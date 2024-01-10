/*
 * MinIO Javascript Library for Amazon S3 Compatible Cloud Storage, (C) 2015 MinIO, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import crc32 from 'buffer-crc32';
import { XMLParser } from 'fast-xml-parser';
import * as errors from "./errors.mjs";
import { SelectResults } from "./helpers.mjs";
import { isObject, parseXml, readableStream, sanitizeETag, sanitizeObjectKey, sanitizeSize, toArray } from "./internal/helper.mjs";
const fxpWithoutNumParser = new XMLParser({
  numberParseOptions: {
    skipLike: /./
  }
});

// parse XML response for copy object
export function parseCopyObject(xml) {
  var result = {
    etag: '',
    lastModified: ''
  };
  var xmlobj = parseXml(xml);
  if (!xmlobj.CopyObjectResult) {
    throw new errors.InvalidXMLError('Missing tag: "CopyObjectResult"');
  }
  xmlobj = xmlobj.CopyObjectResult;
  if (xmlobj.ETag) {
    result.etag = xmlobj.ETag.replace(/^"/g, '').replace(/"$/g, '').replace(/^&quot;/g, '').replace(/&quot;$/g, '').replace(/^&#34;/g, '').replace(/&#34;$/g, '');
  }
  if (xmlobj.LastModified) {
    result.lastModified = new Date(xmlobj.LastModified);
  }
  return result;
}

// parse XML response for bucket notification
export function parseBucketNotification(xml) {
  var result = {
    TopicConfiguration: [],
    QueueConfiguration: [],
    CloudFunctionConfiguration: []
  };
  // Parse the events list
  var genEvents = function (events) {
    var result = [];
    if (events) {
      toArray(events).forEach(s3event => {
        result.push(s3event);
      });
    }
    return result;
  };
  // Parse all filter rules
  var genFilterRules = function (filters) {
    var result = [];
    if (filters) {
      filters = toArray(filters);
      if (filters[0].S3Key) {
        filters[0].S3Key = toArray(filters[0].S3Key);
        if (filters[0].S3Key[0].FilterRule) {
          toArray(filters[0].S3Key[0].FilterRule).forEach(rule => {
            var Name = toArray(rule.Name)[0];
            var Value = toArray(rule.Value)[0];
            result.push({
              Name,
              Value
            });
          });
        }
      }
    }
    return result;
  };
  var xmlobj = parseXml(xml);
  xmlobj = xmlobj.NotificationConfiguration;

  // Parse all topic configurations in the xml
  if (xmlobj.TopicConfiguration) {
    toArray(xmlobj.TopicConfiguration).forEach(config => {
      var Id = toArray(config.Id)[0];
      var Topic = toArray(config.Topic)[0];
      var Event = genEvents(config.Event);
      var Filter = genFilterRules(config.Filter);
      result.TopicConfiguration.push({
        Id,
        Topic,
        Event,
        Filter
      });
    });
  }
  // Parse all topic configurations in the xml
  if (xmlobj.QueueConfiguration) {
    toArray(xmlobj.QueueConfiguration).forEach(config => {
      var Id = toArray(config.Id)[0];
      var Queue = toArray(config.Queue)[0];
      var Event = genEvents(config.Event);
      var Filter = genFilterRules(config.Filter);
      result.QueueConfiguration.push({
        Id,
        Queue,
        Event,
        Filter
      });
    });
  }
  // Parse all QueueConfiguration arrays
  if (xmlobj.CloudFunctionConfiguration) {
    toArray(xmlobj.CloudFunctionConfiguration).forEach(config => {
      var Id = toArray(config.Id)[0];
      var CloudFunction = toArray(config.CloudFunction)[0];
      var Event = genEvents(config.Event);
      var Filter = genFilterRules(config.Filter);
      result.CloudFunctionConfiguration.push({
        Id,
        CloudFunction,
        Event,
        Filter
      });
    });
  }
  return result;
}
const formatObjInfo = (content, opts = {}) => {
  let {
    Key,
    LastModified,
    ETag,
    Size,
    VersionId,
    IsLatest
  } = content;
  if (!isObject(opts)) {
    opts = {};
  }
  const name = sanitizeObjectKey(toArray(Key)[0]);
  const lastModified = new Date(toArray(LastModified)[0]);
  const etag = sanitizeETag(toArray(ETag)[0]);
  const size = sanitizeSize(Size);
  return {
    name,
    lastModified,
    etag,
    size,
    versionId: VersionId,
    isLatest: IsLatest,
    isDeleteMarker: opts.IsDeleteMarker ? opts.IsDeleteMarker : false
  };
};

// parse XML response for list objects in a bucket
export function parseListObjects(xml) {
  var result = {
    objects: [],
    isTruncated: false
  };
  let isTruncated = false;
  let nextMarker, nextVersionKeyMarker;
  const xmlobj = fxpWithoutNumParser.parse(xml);
  const parseCommonPrefixesEntity = responseEntity => {
    if (responseEntity) {
      toArray(responseEntity).forEach(commonPrefix => {
        result.objects.push({
          prefix: sanitizeObjectKey(toArray(commonPrefix.Prefix)[0]),
          size: 0
        });
      });
    }
  };
  const listBucketResult = xmlobj.ListBucketResult;
  const listVersionsResult = xmlobj.ListVersionsResult;
  if (listBucketResult) {
    if (listBucketResult.IsTruncated) {
      isTruncated = listBucketResult.IsTruncated;
    }
    if (listBucketResult.Contents) {
      toArray(listBucketResult.Contents).forEach(content => {
        const name = sanitizeObjectKey(toArray(content.Key)[0]);
        const lastModified = new Date(toArray(content.LastModified)[0]);
        const etag = sanitizeETag(toArray(content.ETag)[0]);
        const size = sanitizeSize(content.Size);
        result.objects.push({
          name,
          lastModified,
          etag,
          size
        });
      });
    }
    if (listBucketResult.NextMarker) {
      nextMarker = listBucketResult.NextMarker;
    } else if (isTruncated && result.objects.length > 0) {
      nextMarker = result.objects[result.objects.length - 1].name;
    }
    parseCommonPrefixesEntity(listBucketResult.CommonPrefixes);
  }
  if (listVersionsResult) {
    if (listVersionsResult.IsTruncated) {
      isTruncated = listVersionsResult.IsTruncated;
    }
    if (listVersionsResult.Version) {
      toArray(listVersionsResult.Version).forEach(content => {
        result.objects.push(formatObjInfo(content));
      });
    }
    if (listVersionsResult.DeleteMarker) {
      toArray(listVersionsResult.DeleteMarker).forEach(content => {
        result.objects.push(formatObjInfo(content, {
          IsDeleteMarker: true
        }));
      });
    }
    if (listVersionsResult.NextKeyMarker) {
      nextVersionKeyMarker = listVersionsResult.NextKeyMarker;
    }
    if (listVersionsResult.NextVersionIdMarker) {
      result.versionIdMarker = listVersionsResult.NextVersionIdMarker;
    }
    parseCommonPrefixesEntity(listVersionsResult.CommonPrefixes);
  }
  result.isTruncated = isTruncated;
  if (isTruncated) {
    result.nextMarker = nextVersionKeyMarker || nextMarker;
  }
  return result;
}

// parse XML response for list objects v2 in a bucket
export function parseListObjectsV2(xml) {
  var result = {
    objects: [],
    isTruncated: false
  };
  var xmlobj = parseXml(xml);
  if (!xmlobj.ListBucketResult) {
    throw new errors.InvalidXMLError('Missing tag: "ListBucketResult"');
  }
  xmlobj = xmlobj.ListBucketResult;
  if (xmlobj.IsTruncated) {
    result.isTruncated = xmlobj.IsTruncated;
  }
  if (xmlobj.NextContinuationToken) {
    result.nextContinuationToken = xmlobj.NextContinuationToken;
  }
  if (xmlobj.Contents) {
    toArray(xmlobj.Contents).forEach(content => {
      var name = sanitizeObjectKey(toArray(content.Key)[0]);
      var lastModified = new Date(content.LastModified);
      var etag = sanitizeETag(content.ETag);
      var size = content.Size;
      result.objects.push({
        name,
        lastModified,
        etag,
        size
      });
    });
  }
  if (xmlobj.CommonPrefixes) {
    toArray(xmlobj.CommonPrefixes).forEach(commonPrefix => {
      result.objects.push({
        prefix: sanitizeObjectKey(toArray(commonPrefix.Prefix)[0]),
        size: 0
      });
    });
  }
  return result;
}

// parse XML response for list objects v2 with metadata in a bucket
export function parseListObjectsV2WithMetadata(xml) {
  var result = {
    objects: [],
    isTruncated: false
  };
  var xmlobj = parseXml(xml);
  if (!xmlobj.ListBucketResult) {
    throw new errors.InvalidXMLError('Missing tag: "ListBucketResult"');
  }
  xmlobj = xmlobj.ListBucketResult;
  if (xmlobj.IsTruncated) {
    result.isTruncated = xmlobj.IsTruncated;
  }
  if (xmlobj.NextContinuationToken) {
    result.nextContinuationToken = xmlobj.NextContinuationToken;
  }
  if (xmlobj.Contents) {
    toArray(xmlobj.Contents).forEach(content => {
      var name = sanitizeObjectKey(content.Key);
      var lastModified = new Date(content.LastModified);
      var etag = sanitizeETag(content.ETag);
      var size = content.Size;
      var metadata;
      if (content.UserMetadata != null) {
        metadata = toArray(content.UserMetadata)[0];
      } else {
        metadata = null;
      }
      result.objects.push({
        name,
        lastModified,
        etag,
        size,
        metadata
      });
    });
  }
  if (xmlobj.CommonPrefixes) {
    toArray(xmlobj.CommonPrefixes).forEach(commonPrefix => {
      result.objects.push({
        prefix: sanitizeObjectKey(toArray(commonPrefix.Prefix)[0]),
        size: 0
      });
    });
  }
  return result;
}
export function parseLifecycleConfig(xml) {
  const xmlObj = parseXml(xml);
  return xmlObj.LifecycleConfiguration;
}
export function parseObjectRetentionConfig(xml) {
  const xmlObj = parseXml(xml);
  const retentionConfig = xmlObj.Retention;
  return {
    mode: retentionConfig.Mode,
    retainUntilDate: retentionConfig.RetainUntilDate
  };
}
export function parseBucketEncryptionConfig(xml) {
  let encConfig = parseXml(xml);
  return encConfig;
}
export function parseObjectLegalHoldConfig(xml) {
  const xmlObj = parseXml(xml);
  return xmlObj.LegalHold;
}
export function uploadPartParser(xml) {
  const xmlObj = parseXml(xml);
  const respEl = xmlObj.CopyPartResult;
  return respEl;
}
export function removeObjectsParser(xml) {
  const xmlObj = parseXml(xml);
  if (xmlObj.DeleteResult && xmlObj.DeleteResult.Error) {
    // return errors as array always. as the response is object in case of single object passed in removeObjects
    return toArray(xmlObj.DeleteResult.Error);
  }
  return [];
}
export function parseSelectObjectContentResponse(res) {
  // extractHeaderType extracts the first half of the header message, the header type.
  function extractHeaderType(stream) {
    const headerNameLen = Buffer.from(stream.read(1)).readUInt8();
    const headerNameWithSeparator = Buffer.from(stream.read(headerNameLen)).toString();
    const splitBySeparator = (headerNameWithSeparator || '').split(':');
    const headerName = splitBySeparator.length >= 1 ? splitBySeparator[1] : '';
    return headerName;
  }
  function extractHeaderValue(stream) {
    const bodyLen = Buffer.from(stream.read(2)).readUInt16BE();
    const bodyName = Buffer.from(stream.read(bodyLen)).toString();
    return bodyName;
  }
  const selectResults = new SelectResults({}); // will be returned

  const responseStream = readableStream(res); // convert byte array to a readable responseStream
  while (responseStream._readableState.length) {
    // Top level responseStream read tracker.
    let msgCrcAccumulator; // accumulate from start of the message till the message crc start.

    const totalByteLengthBuffer = Buffer.from(responseStream.read(4));
    msgCrcAccumulator = crc32(totalByteLengthBuffer);
    const headerBytesBuffer = Buffer.from(responseStream.read(4));
    msgCrcAccumulator = crc32(headerBytesBuffer, msgCrcAccumulator);
    const calculatedPreludeCrc = msgCrcAccumulator.readInt32BE(); // use it to check if any CRC mismatch in header itself.

    const preludeCrcBuffer = Buffer.from(responseStream.read(4)); // read 4 bytes    i.e 4+4 =8 + 4 = 12 ( prelude + prelude crc)
    msgCrcAccumulator = crc32(preludeCrcBuffer, msgCrcAccumulator);
    const totalMsgLength = totalByteLengthBuffer.readInt32BE();
    const headerLength = headerBytesBuffer.readInt32BE();
    const preludeCrcByteValue = preludeCrcBuffer.readInt32BE();
    if (preludeCrcByteValue !== calculatedPreludeCrc) {
      // Handle Header CRC mismatch Error
      throw new Error(`Header Checksum Mismatch, Prelude CRC of ${preludeCrcByteValue} does not equal expected CRC of ${calculatedPreludeCrc}`);
    }
    const headers = {};
    if (headerLength > 0) {
      const headerBytes = Buffer.from(responseStream.read(headerLength));
      msgCrcAccumulator = crc32(headerBytes, msgCrcAccumulator);
      const headerReaderStream = readableStream(headerBytes);
      while (headerReaderStream._readableState.length) {
        let headerTypeName = extractHeaderType(headerReaderStream);
        headerReaderStream.read(1); // just read and ignore it.
        headers[headerTypeName] = extractHeaderValue(headerReaderStream);
      }
    }
    let payloadStream;
    const payLoadLength = totalMsgLength - headerLength - 16;
    if (payLoadLength > 0) {
      const payLoadBuffer = Buffer.from(responseStream.read(payLoadLength));
      msgCrcAccumulator = crc32(payLoadBuffer, msgCrcAccumulator);
      // read the checksum early and detect any mismatch so we can avoid unnecessary further processing.
      const messageCrcByteValue = Buffer.from(responseStream.read(4)).readInt32BE();
      const calculatedCrc = msgCrcAccumulator.readInt32BE();
      // Handle message CRC Error
      if (messageCrcByteValue !== calculatedCrc) {
        throw new Error(`Message Checksum Mismatch, Message CRC of ${messageCrcByteValue} does not equal expected CRC of ${calculatedCrc}`);
      }
      payloadStream = readableStream(payLoadBuffer);
    }
    const messageType = headers['message-type'];
    switch (messageType) {
      case 'error':
        {
          const errorMessage = headers['error-code'] + ':"' + headers['error-message'] + '"';
          throw new Error(errorMessage);
        }
      case 'event':
        {
          const contentType = headers['content-type'];
          const eventType = headers['event-type'];
          switch (eventType) {
            case 'End':
              {
                selectResults.setResponse(res);
                return selectResults;
              }
            case 'Records':
              {
                const readData = payloadStream.read(payLoadLength);
                selectResults.setRecords(readData);
                break;
              }
            case 'Progress':
              {
                switch (contentType) {
                  case 'text/xml':
                    {
                      const progressData = payloadStream.read(payLoadLength);
                      selectResults.setProgress(progressData.toString());
                      break;
                    }
                  default:
                    {
                      const errorMessage = `Unexpected content-type ${contentType} sent for event-type Progress`;
                      throw new Error(errorMessage);
                    }
                }
              }
              break;
            case 'Stats':
              {
                switch (contentType) {
                  case 'text/xml':
                    {
                      const statsData = payloadStream.read(payLoadLength);
                      selectResults.setStats(statsData.toString());
                      break;
                    }
                  default:
                    {
                      const errorMessage = `Unexpected content-type ${contentType} sent for event-type Stats`;
                      throw new Error(errorMessage);
                    }
                }
              }
              break;
            default:
              {
                // Continuation message: Not sure if it is supported. did not find a reference or any message in response.
                // It does not have a payload.
                const warningMessage = `Un implemented event detected  ${messageType}.`;
                // eslint-disable-next-line no-console
                console.warn(warningMessage);
              }
          } // eventType End
        }
      // Event End
    } // messageType End
  } // Top Level Stream End
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjcmMzMiIsIlhNTFBhcnNlciIsImVycm9ycyIsIlNlbGVjdFJlc3VsdHMiLCJpc09iamVjdCIsInBhcnNlWG1sIiwicmVhZGFibGVTdHJlYW0iLCJzYW5pdGl6ZUVUYWciLCJzYW5pdGl6ZU9iamVjdEtleSIsInNhbml0aXplU2l6ZSIsInRvQXJyYXkiLCJmeHBXaXRob3V0TnVtUGFyc2VyIiwibnVtYmVyUGFyc2VPcHRpb25zIiwic2tpcExpa2UiLCJwYXJzZUNvcHlPYmplY3QiLCJ4bWwiLCJyZXN1bHQiLCJldGFnIiwibGFzdE1vZGlmaWVkIiwieG1sb2JqIiwiQ29weU9iamVjdFJlc3VsdCIsIkludmFsaWRYTUxFcnJvciIsIkVUYWciLCJyZXBsYWNlIiwiTGFzdE1vZGlmaWVkIiwiRGF0ZSIsInBhcnNlQnVja2V0Tm90aWZpY2F0aW9uIiwiVG9waWNDb25maWd1cmF0aW9uIiwiUXVldWVDb25maWd1cmF0aW9uIiwiQ2xvdWRGdW5jdGlvbkNvbmZpZ3VyYXRpb24iLCJnZW5FdmVudHMiLCJldmVudHMiLCJmb3JFYWNoIiwiczNldmVudCIsInB1c2giLCJnZW5GaWx0ZXJSdWxlcyIsImZpbHRlcnMiLCJTM0tleSIsIkZpbHRlclJ1bGUiLCJydWxlIiwiTmFtZSIsIlZhbHVlIiwiTm90aWZpY2F0aW9uQ29uZmlndXJhdGlvbiIsImNvbmZpZyIsIklkIiwiVG9waWMiLCJFdmVudCIsIkZpbHRlciIsIlF1ZXVlIiwiQ2xvdWRGdW5jdGlvbiIsImZvcm1hdE9iakluZm8iLCJjb250ZW50Iiwib3B0cyIsIktleSIsIlNpemUiLCJWZXJzaW9uSWQiLCJJc0xhdGVzdCIsIm5hbWUiLCJzaXplIiwidmVyc2lvbklkIiwiaXNMYXRlc3QiLCJpc0RlbGV0ZU1hcmtlciIsIklzRGVsZXRlTWFya2VyIiwicGFyc2VMaXN0T2JqZWN0cyIsIm9iamVjdHMiLCJpc1RydW5jYXRlZCIsIm5leHRNYXJrZXIiLCJuZXh0VmVyc2lvbktleU1hcmtlciIsInBhcnNlIiwicGFyc2VDb21tb25QcmVmaXhlc0VudGl0eSIsInJlc3BvbnNlRW50aXR5IiwiY29tbW9uUHJlZml4IiwicHJlZml4IiwiUHJlZml4IiwibGlzdEJ1Y2tldFJlc3VsdCIsIkxpc3RCdWNrZXRSZXN1bHQiLCJsaXN0VmVyc2lvbnNSZXN1bHQiLCJMaXN0VmVyc2lvbnNSZXN1bHQiLCJJc1RydW5jYXRlZCIsIkNvbnRlbnRzIiwiTmV4dE1hcmtlciIsImxlbmd0aCIsIkNvbW1vblByZWZpeGVzIiwiVmVyc2lvbiIsIkRlbGV0ZU1hcmtlciIsIk5leHRLZXlNYXJrZXIiLCJOZXh0VmVyc2lvbklkTWFya2VyIiwidmVyc2lvbklkTWFya2VyIiwicGFyc2VMaXN0T2JqZWN0c1YyIiwiTmV4dENvbnRpbnVhdGlvblRva2VuIiwibmV4dENvbnRpbnVhdGlvblRva2VuIiwicGFyc2VMaXN0T2JqZWN0c1YyV2l0aE1ldGFkYXRhIiwibWV0YWRhdGEiLCJVc2VyTWV0YWRhdGEiLCJwYXJzZUxpZmVjeWNsZUNvbmZpZyIsInhtbE9iaiIsIkxpZmVjeWNsZUNvbmZpZ3VyYXRpb24iLCJwYXJzZU9iamVjdFJldGVudGlvbkNvbmZpZyIsInJldGVudGlvbkNvbmZpZyIsIlJldGVudGlvbiIsIm1vZGUiLCJNb2RlIiwicmV0YWluVW50aWxEYXRlIiwiUmV0YWluVW50aWxEYXRlIiwicGFyc2VCdWNrZXRFbmNyeXB0aW9uQ29uZmlnIiwiZW5jQ29uZmlnIiwicGFyc2VPYmplY3RMZWdhbEhvbGRDb25maWciLCJMZWdhbEhvbGQiLCJ1cGxvYWRQYXJ0UGFyc2VyIiwicmVzcEVsIiwiQ29weVBhcnRSZXN1bHQiLCJyZW1vdmVPYmplY3RzUGFyc2VyIiwiRGVsZXRlUmVzdWx0IiwiRXJyb3IiLCJwYXJzZVNlbGVjdE9iamVjdENvbnRlbnRSZXNwb25zZSIsInJlcyIsImV4dHJhY3RIZWFkZXJUeXBlIiwic3RyZWFtIiwiaGVhZGVyTmFtZUxlbiIsIkJ1ZmZlciIsImZyb20iLCJyZWFkIiwicmVhZFVJbnQ4IiwiaGVhZGVyTmFtZVdpdGhTZXBhcmF0b3IiLCJ0b1N0cmluZyIsInNwbGl0QnlTZXBhcmF0b3IiLCJzcGxpdCIsImhlYWRlck5hbWUiLCJleHRyYWN0SGVhZGVyVmFsdWUiLCJib2R5TGVuIiwicmVhZFVJbnQxNkJFIiwiYm9keU5hbWUiLCJzZWxlY3RSZXN1bHRzIiwicmVzcG9uc2VTdHJlYW0iLCJfcmVhZGFibGVTdGF0ZSIsIm1zZ0NyY0FjY3VtdWxhdG9yIiwidG90YWxCeXRlTGVuZ3RoQnVmZmVyIiwiaGVhZGVyQnl0ZXNCdWZmZXIiLCJjYWxjdWxhdGVkUHJlbHVkZUNyYyIsInJlYWRJbnQzMkJFIiwicHJlbHVkZUNyY0J1ZmZlciIsInRvdGFsTXNnTGVuZ3RoIiwiaGVhZGVyTGVuZ3RoIiwicHJlbHVkZUNyY0J5dGVWYWx1ZSIsImhlYWRlcnMiLCJoZWFkZXJCeXRlcyIsImhlYWRlclJlYWRlclN0cmVhbSIsImhlYWRlclR5cGVOYW1lIiwicGF5bG9hZFN0cmVhbSIsInBheUxvYWRMZW5ndGgiLCJwYXlMb2FkQnVmZmVyIiwibWVzc2FnZUNyY0J5dGVWYWx1ZSIsImNhbGN1bGF0ZWRDcmMiLCJtZXNzYWdlVHlwZSIsImVycm9yTWVzc2FnZSIsImNvbnRlbnRUeXBlIiwiZXZlbnRUeXBlIiwic2V0UmVzcG9uc2UiLCJyZWFkRGF0YSIsInNldFJlY29yZHMiLCJwcm9ncmVzc0RhdGEiLCJzZXRQcm9ncmVzcyIsInN0YXRzRGF0YSIsInNldFN0YXRzIiwid2FybmluZ01lc3NhZ2UiLCJjb25zb2xlIiwid2FybiJdLCJzb3VyY2VzIjpbInhtbC1wYXJzZXJzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBNaW5JTyBKYXZhc2NyaXB0IExpYnJhcnkgZm9yIEFtYXpvbiBTMyBDb21wYXRpYmxlIENsb3VkIFN0b3JhZ2UsIChDKSAyMDE1IE1pbklPLCBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBjcmMzMiBmcm9tICdidWZmZXItY3JjMzInXG5pbXBvcnQgeyBYTUxQYXJzZXIgfSBmcm9tICdmYXN0LXhtbC1wYXJzZXInXG5cbmltcG9ydCAqIGFzIGVycm9ycyBmcm9tICcuL2Vycm9ycy50cydcbmltcG9ydCB7IFNlbGVjdFJlc3VsdHMgfSBmcm9tICcuL2hlbHBlcnMudHMnXG5pbXBvcnQge1xuICBpc09iamVjdCxcbiAgcGFyc2VYbWwsXG4gIHJlYWRhYmxlU3RyZWFtLFxuICBzYW5pdGl6ZUVUYWcsXG4gIHNhbml0aXplT2JqZWN0S2V5LFxuICBzYW5pdGl6ZVNpemUsXG4gIHRvQXJyYXksXG59IGZyb20gJy4vaW50ZXJuYWwvaGVscGVyLnRzJ1xuXG5jb25zdCBmeHBXaXRob3V0TnVtUGFyc2VyID0gbmV3IFhNTFBhcnNlcih7XG4gIG51bWJlclBhcnNlT3B0aW9uczoge1xuICAgIHNraXBMaWtlOiAvLi8sXG4gIH0sXG59KVxuXG4vLyBwYXJzZSBYTUwgcmVzcG9uc2UgZm9yIGNvcHkgb2JqZWN0XG5leHBvcnQgZnVuY3Rpb24gcGFyc2VDb3B5T2JqZWN0KHhtbCkge1xuICB2YXIgcmVzdWx0ID0ge1xuICAgIGV0YWc6ICcnLFxuICAgIGxhc3RNb2RpZmllZDogJycsXG4gIH1cblxuICB2YXIgeG1sb2JqID0gcGFyc2VYbWwoeG1sKVxuICBpZiAoIXhtbG9iai5Db3B5T2JqZWN0UmVzdWx0KSB7XG4gICAgdGhyb3cgbmV3IGVycm9ycy5JbnZhbGlkWE1MRXJyb3IoJ01pc3NpbmcgdGFnOiBcIkNvcHlPYmplY3RSZXN1bHRcIicpXG4gIH1cbiAgeG1sb2JqID0geG1sb2JqLkNvcHlPYmplY3RSZXN1bHRcbiAgaWYgKHhtbG9iai5FVGFnKSB7XG4gICAgcmVzdWx0LmV0YWcgPSB4bWxvYmouRVRhZy5yZXBsYWNlKC9eXCIvZywgJycpXG4gICAgICAucmVwbGFjZSgvXCIkL2csICcnKVxuICAgICAgLnJlcGxhY2UoL14mcXVvdDsvZywgJycpXG4gICAgICAucmVwbGFjZSgvJnF1b3Q7JC9nLCAnJylcbiAgICAgIC5yZXBsYWNlKC9eJiMzNDsvZywgJycpXG4gICAgICAucmVwbGFjZSgvJiMzNDskL2csICcnKVxuICB9XG4gIGlmICh4bWxvYmouTGFzdE1vZGlmaWVkKSB7XG4gICAgcmVzdWx0Lmxhc3RNb2RpZmllZCA9IG5ldyBEYXRlKHhtbG9iai5MYXN0TW9kaWZpZWQpXG4gIH1cblxuICByZXR1cm4gcmVzdWx0XG59XG5cbi8vIHBhcnNlIFhNTCByZXNwb25zZSBmb3IgYnVja2V0IG5vdGlmaWNhdGlvblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQnVja2V0Tm90aWZpY2F0aW9uKHhtbCkge1xuICB2YXIgcmVzdWx0ID0ge1xuICAgIFRvcGljQ29uZmlndXJhdGlvbjogW10sXG4gICAgUXVldWVDb25maWd1cmF0aW9uOiBbXSxcbiAgICBDbG91ZEZ1bmN0aW9uQ29uZmlndXJhdGlvbjogW10sXG4gIH1cbiAgLy8gUGFyc2UgdGhlIGV2ZW50cyBsaXN0XG4gIHZhciBnZW5FdmVudHMgPSBmdW5jdGlvbiAoZXZlbnRzKSB7XG4gICAgdmFyIHJlc3VsdCA9IFtdXG4gICAgaWYgKGV2ZW50cykge1xuICAgICAgdG9BcnJheShldmVudHMpLmZvckVhY2goKHMzZXZlbnQpID0+IHtcbiAgICAgICAgcmVzdWx0LnB1c2goczNldmVudClcbiAgICAgIH0pXG4gICAgfVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICAvLyBQYXJzZSBhbGwgZmlsdGVyIHJ1bGVzXG4gIHZhciBnZW5GaWx0ZXJSdWxlcyA9IGZ1bmN0aW9uIChmaWx0ZXJzKSB7XG4gICAgdmFyIHJlc3VsdCA9IFtdXG4gICAgaWYgKGZpbHRlcnMpIHtcbiAgICAgIGZpbHRlcnMgPSB0b0FycmF5KGZpbHRlcnMpXG4gICAgICBpZiAoZmlsdGVyc1swXS5TM0tleSkge1xuICAgICAgICBmaWx0ZXJzWzBdLlMzS2V5ID0gdG9BcnJheShmaWx0ZXJzWzBdLlMzS2V5KVxuICAgICAgICBpZiAoZmlsdGVyc1swXS5TM0tleVswXS5GaWx0ZXJSdWxlKSB7XG4gICAgICAgICAgdG9BcnJheShmaWx0ZXJzWzBdLlMzS2V5WzBdLkZpbHRlclJ1bGUpLmZvckVhY2goKHJ1bGUpID0+IHtcbiAgICAgICAgICAgIHZhciBOYW1lID0gdG9BcnJheShydWxlLk5hbWUpWzBdXG4gICAgICAgICAgICB2YXIgVmFsdWUgPSB0b0FycmF5KHJ1bGUuVmFsdWUpWzBdXG4gICAgICAgICAgICByZXN1bHQucHVzaCh7IE5hbWUsIFZhbHVlIH0pXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cblxuICB2YXIgeG1sb2JqID0gcGFyc2VYbWwoeG1sKVxuICB4bWxvYmogPSB4bWxvYmouTm90aWZpY2F0aW9uQ29uZmlndXJhdGlvblxuXG4gIC8vIFBhcnNlIGFsbCB0b3BpYyBjb25maWd1cmF0aW9ucyBpbiB0aGUgeG1sXG4gIGlmICh4bWxvYmouVG9waWNDb25maWd1cmF0aW9uKSB7XG4gICAgdG9BcnJheSh4bWxvYmouVG9waWNDb25maWd1cmF0aW9uKS5mb3JFYWNoKChjb25maWcpID0+IHtcbiAgICAgIHZhciBJZCA9IHRvQXJyYXkoY29uZmlnLklkKVswXVxuICAgICAgdmFyIFRvcGljID0gdG9BcnJheShjb25maWcuVG9waWMpWzBdXG4gICAgICB2YXIgRXZlbnQgPSBnZW5FdmVudHMoY29uZmlnLkV2ZW50KVxuICAgICAgdmFyIEZpbHRlciA9IGdlbkZpbHRlclJ1bGVzKGNvbmZpZy5GaWx0ZXIpXG4gICAgICByZXN1bHQuVG9waWNDb25maWd1cmF0aW9uLnB1c2goeyBJZCwgVG9waWMsIEV2ZW50LCBGaWx0ZXIgfSlcbiAgICB9KVxuICB9XG4gIC8vIFBhcnNlIGFsbCB0b3BpYyBjb25maWd1cmF0aW9ucyBpbiB0aGUgeG1sXG4gIGlmICh4bWxvYmouUXVldWVDb25maWd1cmF0aW9uKSB7XG4gICAgdG9BcnJheSh4bWxvYmouUXVldWVDb25maWd1cmF0aW9uKS5mb3JFYWNoKChjb25maWcpID0+IHtcbiAgICAgIHZhciBJZCA9IHRvQXJyYXkoY29uZmlnLklkKVswXVxuICAgICAgdmFyIFF1ZXVlID0gdG9BcnJheShjb25maWcuUXVldWUpWzBdXG4gICAgICB2YXIgRXZlbnQgPSBnZW5FdmVudHMoY29uZmlnLkV2ZW50KVxuICAgICAgdmFyIEZpbHRlciA9IGdlbkZpbHRlclJ1bGVzKGNvbmZpZy5GaWx0ZXIpXG4gICAgICByZXN1bHQuUXVldWVDb25maWd1cmF0aW9uLnB1c2goeyBJZCwgUXVldWUsIEV2ZW50LCBGaWx0ZXIgfSlcbiAgICB9KVxuICB9XG4gIC8vIFBhcnNlIGFsbCBRdWV1ZUNvbmZpZ3VyYXRpb24gYXJyYXlzXG4gIGlmICh4bWxvYmouQ2xvdWRGdW5jdGlvbkNvbmZpZ3VyYXRpb24pIHtcbiAgICB0b0FycmF5KHhtbG9iai5DbG91ZEZ1bmN0aW9uQ29uZmlndXJhdGlvbikuZm9yRWFjaCgoY29uZmlnKSA9PiB7XG4gICAgICB2YXIgSWQgPSB0b0FycmF5KGNvbmZpZy5JZClbMF1cbiAgICAgIHZhciBDbG91ZEZ1bmN0aW9uID0gdG9BcnJheShjb25maWcuQ2xvdWRGdW5jdGlvbilbMF1cbiAgICAgIHZhciBFdmVudCA9IGdlbkV2ZW50cyhjb25maWcuRXZlbnQpXG4gICAgICB2YXIgRmlsdGVyID0gZ2VuRmlsdGVyUnVsZXMoY29uZmlnLkZpbHRlcilcbiAgICAgIHJlc3VsdC5DbG91ZEZ1bmN0aW9uQ29uZmlndXJhdGlvbi5wdXNoKHsgSWQsIENsb3VkRnVuY3Rpb24sIEV2ZW50LCBGaWx0ZXIgfSlcbiAgICB9KVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5jb25zdCBmb3JtYXRPYmpJbmZvID0gKGNvbnRlbnQsIG9wdHMgPSB7fSkgPT4ge1xuICBsZXQgeyBLZXksIExhc3RNb2RpZmllZCwgRVRhZywgU2l6ZSwgVmVyc2lvbklkLCBJc0xhdGVzdCB9ID0gY29udGVudFxuXG4gIGlmICghaXNPYmplY3Qob3B0cykpIHtcbiAgICBvcHRzID0ge31cbiAgfVxuXG4gIGNvbnN0IG5hbWUgPSBzYW5pdGl6ZU9iamVjdEtleSh0b0FycmF5KEtleSlbMF0pXG4gIGNvbnN0IGxhc3RNb2RpZmllZCA9IG5ldyBEYXRlKHRvQXJyYXkoTGFzdE1vZGlmaWVkKVswXSlcbiAgY29uc3QgZXRhZyA9IHNhbml0aXplRVRhZyh0b0FycmF5KEVUYWcpWzBdKVxuICBjb25zdCBzaXplID0gc2FuaXRpemVTaXplKFNpemUpXG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lLFxuICAgIGxhc3RNb2RpZmllZCxcbiAgICBldGFnLFxuICAgIHNpemUsXG4gICAgdmVyc2lvbklkOiBWZXJzaW9uSWQsXG4gICAgaXNMYXRlc3Q6IElzTGF0ZXN0LFxuICAgIGlzRGVsZXRlTWFya2VyOiBvcHRzLklzRGVsZXRlTWFya2VyID8gb3B0cy5Jc0RlbGV0ZU1hcmtlciA6IGZhbHNlLFxuICB9XG59XG5cbi8vIHBhcnNlIFhNTCByZXNwb25zZSBmb3IgbGlzdCBvYmplY3RzIGluIGEgYnVja2V0XG5leHBvcnQgZnVuY3Rpb24gcGFyc2VMaXN0T2JqZWN0cyh4bWwpIHtcbiAgdmFyIHJlc3VsdCA9IHtcbiAgICBvYmplY3RzOiBbXSxcbiAgICBpc1RydW5jYXRlZDogZmFsc2UsXG4gIH1cbiAgbGV0IGlzVHJ1bmNhdGVkID0gZmFsc2VcbiAgbGV0IG5leHRNYXJrZXIsIG5leHRWZXJzaW9uS2V5TWFya2VyXG4gIGNvbnN0IHhtbG9iaiA9IGZ4cFdpdGhvdXROdW1QYXJzZXIucGFyc2UoeG1sKVxuXG4gIGNvbnN0IHBhcnNlQ29tbW9uUHJlZml4ZXNFbnRpdHkgPSAocmVzcG9uc2VFbnRpdHkpID0+IHtcbiAgICBpZiAocmVzcG9uc2VFbnRpdHkpIHtcbiAgICAgIHRvQXJyYXkocmVzcG9uc2VFbnRpdHkpLmZvckVhY2goKGNvbW1vblByZWZpeCkgPT4ge1xuICAgICAgICByZXN1bHQub2JqZWN0cy5wdXNoKHsgcHJlZml4OiBzYW5pdGl6ZU9iamVjdEtleSh0b0FycmF5KGNvbW1vblByZWZpeC5QcmVmaXgpWzBdKSwgc2l6ZTogMCB9KVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBjb25zdCBsaXN0QnVja2V0UmVzdWx0ID0geG1sb2JqLkxpc3RCdWNrZXRSZXN1bHRcbiAgY29uc3QgbGlzdFZlcnNpb25zUmVzdWx0ID0geG1sb2JqLkxpc3RWZXJzaW9uc1Jlc3VsdFxuXG4gIGlmIChsaXN0QnVja2V0UmVzdWx0KSB7XG4gICAgaWYgKGxpc3RCdWNrZXRSZXN1bHQuSXNUcnVuY2F0ZWQpIHtcbiAgICAgIGlzVHJ1bmNhdGVkID0gbGlzdEJ1Y2tldFJlc3VsdC5Jc1RydW5jYXRlZFxuICAgIH1cbiAgICBpZiAobGlzdEJ1Y2tldFJlc3VsdC5Db250ZW50cykge1xuICAgICAgdG9BcnJheShsaXN0QnVja2V0UmVzdWx0LkNvbnRlbnRzKS5mb3JFYWNoKChjb250ZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBzYW5pdGl6ZU9iamVjdEtleSh0b0FycmF5KGNvbnRlbnQuS2V5KVswXSlcbiAgICAgICAgY29uc3QgbGFzdE1vZGlmaWVkID0gbmV3IERhdGUodG9BcnJheShjb250ZW50Lkxhc3RNb2RpZmllZClbMF0pXG4gICAgICAgIGNvbnN0IGV0YWcgPSBzYW5pdGl6ZUVUYWcodG9BcnJheShjb250ZW50LkVUYWcpWzBdKVxuICAgICAgICBjb25zdCBzaXplID0gc2FuaXRpemVTaXplKGNvbnRlbnQuU2l6ZSlcbiAgICAgICAgcmVzdWx0Lm9iamVjdHMucHVzaCh7IG5hbWUsIGxhc3RNb2RpZmllZCwgZXRhZywgc2l6ZSB9KVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAobGlzdEJ1Y2tldFJlc3VsdC5OZXh0TWFya2VyKSB7XG4gICAgICBuZXh0TWFya2VyID0gbGlzdEJ1Y2tldFJlc3VsdC5OZXh0TWFya2VyXG4gICAgfSBlbHNlIGlmIChpc1RydW5jYXRlZCAmJiByZXN1bHQub2JqZWN0cy5sZW5ndGggPiAwKSB7XG4gICAgICBuZXh0TWFya2VyID0gcmVzdWx0Lm9iamVjdHNbcmVzdWx0Lm9iamVjdHMubGVuZ3RoIC0gMV0ubmFtZVxuICAgIH1cbiAgICBwYXJzZUNvbW1vblByZWZpeGVzRW50aXR5KGxpc3RCdWNrZXRSZXN1bHQuQ29tbW9uUHJlZml4ZXMpXG4gIH1cblxuICBpZiAobGlzdFZlcnNpb25zUmVzdWx0KSB7XG4gICAgaWYgKGxpc3RWZXJzaW9uc1Jlc3VsdC5Jc1RydW5jYXRlZCkge1xuICAgICAgaXNUcnVuY2F0ZWQgPSBsaXN0VmVyc2lvbnNSZXN1bHQuSXNUcnVuY2F0ZWRcbiAgICB9XG5cbiAgICBpZiAobGlzdFZlcnNpb25zUmVzdWx0LlZlcnNpb24pIHtcbiAgICAgIHRvQXJyYXkobGlzdFZlcnNpb25zUmVzdWx0LlZlcnNpb24pLmZvckVhY2goKGNvbnRlbnQpID0+IHtcbiAgICAgICAgcmVzdWx0Lm9iamVjdHMucHVzaChmb3JtYXRPYmpJbmZvKGNvbnRlbnQpKVxuICAgICAgfSlcbiAgICB9XG4gICAgaWYgKGxpc3RWZXJzaW9uc1Jlc3VsdC5EZWxldGVNYXJrZXIpIHtcbiAgICAgIHRvQXJyYXkobGlzdFZlcnNpb25zUmVzdWx0LkRlbGV0ZU1hcmtlcikuZm9yRWFjaCgoY29udGVudCkgPT4ge1xuICAgICAgICByZXN1bHQub2JqZWN0cy5wdXNoKGZvcm1hdE9iakluZm8oY29udGVudCwgeyBJc0RlbGV0ZU1hcmtlcjogdHJ1ZSB9KSlcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgaWYgKGxpc3RWZXJzaW9uc1Jlc3VsdC5OZXh0S2V5TWFya2VyKSB7XG4gICAgICBuZXh0VmVyc2lvbktleU1hcmtlciA9IGxpc3RWZXJzaW9uc1Jlc3VsdC5OZXh0S2V5TWFya2VyXG4gICAgfVxuICAgIGlmIChsaXN0VmVyc2lvbnNSZXN1bHQuTmV4dFZlcnNpb25JZE1hcmtlcikge1xuICAgICAgcmVzdWx0LnZlcnNpb25JZE1hcmtlciA9IGxpc3RWZXJzaW9uc1Jlc3VsdC5OZXh0VmVyc2lvbklkTWFya2VyXG4gICAgfVxuICAgIHBhcnNlQ29tbW9uUHJlZml4ZXNFbnRpdHkobGlzdFZlcnNpb25zUmVzdWx0LkNvbW1vblByZWZpeGVzKVxuICB9XG5cbiAgcmVzdWx0LmlzVHJ1bmNhdGVkID0gaXNUcnVuY2F0ZWRcbiAgaWYgKGlzVHJ1bmNhdGVkKSB7XG4gICAgcmVzdWx0Lm5leHRNYXJrZXIgPSBuZXh0VmVyc2lvbktleU1hcmtlciB8fCBuZXh0TWFya2VyXG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vLyBwYXJzZSBYTUwgcmVzcG9uc2UgZm9yIGxpc3Qgb2JqZWN0cyB2MiBpbiBhIGJ1Y2tldFxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlTGlzdE9iamVjdHNWMih4bWwpIHtcbiAgdmFyIHJlc3VsdCA9IHtcbiAgICBvYmplY3RzOiBbXSxcbiAgICBpc1RydW5jYXRlZDogZmFsc2UsXG4gIH1cbiAgdmFyIHhtbG9iaiA9IHBhcnNlWG1sKHhtbClcbiAgaWYgKCF4bWxvYmouTGlzdEJ1Y2tldFJlc3VsdCkge1xuICAgIHRocm93IG5ldyBlcnJvcnMuSW52YWxpZFhNTEVycm9yKCdNaXNzaW5nIHRhZzogXCJMaXN0QnVja2V0UmVzdWx0XCInKVxuICB9XG4gIHhtbG9iaiA9IHhtbG9iai5MaXN0QnVja2V0UmVzdWx0XG4gIGlmICh4bWxvYmouSXNUcnVuY2F0ZWQpIHtcbiAgICByZXN1bHQuaXNUcnVuY2F0ZWQgPSB4bWxvYmouSXNUcnVuY2F0ZWRcbiAgfVxuICBpZiAoeG1sb2JqLk5leHRDb250aW51YXRpb25Ub2tlbikge1xuICAgIHJlc3VsdC5uZXh0Q29udGludWF0aW9uVG9rZW4gPSB4bWxvYmouTmV4dENvbnRpbnVhdGlvblRva2VuXG4gIH1cbiAgaWYgKHhtbG9iai5Db250ZW50cykge1xuICAgIHRvQXJyYXkoeG1sb2JqLkNvbnRlbnRzKS5mb3JFYWNoKChjb250ZW50KSA9PiB7XG4gICAgICB2YXIgbmFtZSA9IHNhbml0aXplT2JqZWN0S2V5KHRvQXJyYXkoY29udGVudC5LZXkpWzBdKVxuICAgICAgdmFyIGxhc3RNb2RpZmllZCA9IG5ldyBEYXRlKGNvbnRlbnQuTGFzdE1vZGlmaWVkKVxuICAgICAgdmFyIGV0YWcgPSBzYW5pdGl6ZUVUYWcoY29udGVudC5FVGFnKVxuICAgICAgdmFyIHNpemUgPSBjb250ZW50LlNpemVcbiAgICAgIHJlc3VsdC5vYmplY3RzLnB1c2goeyBuYW1lLCBsYXN0TW9kaWZpZWQsIGV0YWcsIHNpemUgfSlcbiAgICB9KVxuICB9XG4gIGlmICh4bWxvYmouQ29tbW9uUHJlZml4ZXMpIHtcbiAgICB0b0FycmF5KHhtbG9iai5Db21tb25QcmVmaXhlcykuZm9yRWFjaCgoY29tbW9uUHJlZml4KSA9PiB7XG4gICAgICByZXN1bHQub2JqZWN0cy5wdXNoKHsgcHJlZml4OiBzYW5pdGl6ZU9iamVjdEtleSh0b0FycmF5KGNvbW1vblByZWZpeC5QcmVmaXgpWzBdKSwgc2l6ZTogMCB9KVxuICAgIH0pXG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vLyBwYXJzZSBYTUwgcmVzcG9uc2UgZm9yIGxpc3Qgb2JqZWN0cyB2MiB3aXRoIG1ldGFkYXRhIGluIGEgYnVja2V0XG5leHBvcnQgZnVuY3Rpb24gcGFyc2VMaXN0T2JqZWN0c1YyV2l0aE1ldGFkYXRhKHhtbCkge1xuICB2YXIgcmVzdWx0ID0ge1xuICAgIG9iamVjdHM6IFtdLFxuICAgIGlzVHJ1bmNhdGVkOiBmYWxzZSxcbiAgfVxuICB2YXIgeG1sb2JqID0gcGFyc2VYbWwoeG1sKVxuICBpZiAoIXhtbG9iai5MaXN0QnVja2V0UmVzdWx0KSB7XG4gICAgdGhyb3cgbmV3IGVycm9ycy5JbnZhbGlkWE1MRXJyb3IoJ01pc3NpbmcgdGFnOiBcIkxpc3RCdWNrZXRSZXN1bHRcIicpXG4gIH1cbiAgeG1sb2JqID0geG1sb2JqLkxpc3RCdWNrZXRSZXN1bHRcbiAgaWYgKHhtbG9iai5Jc1RydW5jYXRlZCkge1xuICAgIHJlc3VsdC5pc1RydW5jYXRlZCA9IHhtbG9iai5Jc1RydW5jYXRlZFxuICB9XG4gIGlmICh4bWxvYmouTmV4dENvbnRpbnVhdGlvblRva2VuKSB7XG4gICAgcmVzdWx0Lm5leHRDb250aW51YXRpb25Ub2tlbiA9IHhtbG9iai5OZXh0Q29udGludWF0aW9uVG9rZW5cbiAgfVxuXG4gIGlmICh4bWxvYmouQ29udGVudHMpIHtcbiAgICB0b0FycmF5KHhtbG9iai5Db250ZW50cykuZm9yRWFjaCgoY29udGVudCkgPT4ge1xuICAgICAgdmFyIG5hbWUgPSBzYW5pdGl6ZU9iamVjdEtleShjb250ZW50LktleSlcbiAgICAgIHZhciBsYXN0TW9kaWZpZWQgPSBuZXcgRGF0ZShjb250ZW50Lkxhc3RNb2RpZmllZClcbiAgICAgIHZhciBldGFnID0gc2FuaXRpemVFVGFnKGNvbnRlbnQuRVRhZylcbiAgICAgIHZhciBzaXplID0gY29udGVudC5TaXplXG4gICAgICB2YXIgbWV0YWRhdGFcbiAgICAgIGlmIChjb250ZW50LlVzZXJNZXRhZGF0YSAhPSBudWxsKSB7XG4gICAgICAgIG1ldGFkYXRhID0gdG9BcnJheShjb250ZW50LlVzZXJNZXRhZGF0YSlbMF1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1ldGFkYXRhID0gbnVsbFxuICAgICAgfVxuICAgICAgcmVzdWx0Lm9iamVjdHMucHVzaCh7IG5hbWUsIGxhc3RNb2RpZmllZCwgZXRhZywgc2l6ZSwgbWV0YWRhdGEgfSlcbiAgICB9KVxuICB9XG5cbiAgaWYgKHhtbG9iai5Db21tb25QcmVmaXhlcykge1xuICAgIHRvQXJyYXkoeG1sb2JqLkNvbW1vblByZWZpeGVzKS5mb3JFYWNoKChjb21tb25QcmVmaXgpID0+IHtcbiAgICAgIHJlc3VsdC5vYmplY3RzLnB1c2goeyBwcmVmaXg6IHNhbml0aXplT2JqZWN0S2V5KHRvQXJyYXkoY29tbW9uUHJlZml4LlByZWZpeClbMF0pLCBzaXplOiAwIH0pXG4gICAgfSlcbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUxpZmVjeWNsZUNvbmZpZyh4bWwpIHtcbiAgY29uc3QgeG1sT2JqID0gcGFyc2VYbWwoeG1sKVxuICByZXR1cm4geG1sT2JqLkxpZmVjeWNsZUNvbmZpZ3VyYXRpb25cbn1cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZU9iamVjdFJldGVudGlvbkNvbmZpZyh4bWwpIHtcbiAgY29uc3QgeG1sT2JqID0gcGFyc2VYbWwoeG1sKVxuICBjb25zdCByZXRlbnRpb25Db25maWcgPSB4bWxPYmouUmV0ZW50aW9uXG5cbiAgcmV0dXJuIHtcbiAgICBtb2RlOiByZXRlbnRpb25Db25maWcuTW9kZSxcbiAgICByZXRhaW5VbnRpbERhdGU6IHJldGVudGlvbkNvbmZpZy5SZXRhaW5VbnRpbERhdGUsXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQnVja2V0RW5jcnlwdGlvbkNvbmZpZyh4bWwpIHtcbiAgbGV0IGVuY0NvbmZpZyA9IHBhcnNlWG1sKHhtbClcbiAgcmV0dXJuIGVuY0NvbmZpZ1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VPYmplY3RMZWdhbEhvbGRDb25maWcoeG1sKSB7XG4gIGNvbnN0IHhtbE9iaiA9IHBhcnNlWG1sKHhtbClcbiAgcmV0dXJuIHhtbE9iai5MZWdhbEhvbGRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVwbG9hZFBhcnRQYXJzZXIoeG1sKSB7XG4gIGNvbnN0IHhtbE9iaiA9IHBhcnNlWG1sKHhtbClcbiAgY29uc3QgcmVzcEVsID0geG1sT2JqLkNvcHlQYXJ0UmVzdWx0XG4gIHJldHVybiByZXNwRWxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZU9iamVjdHNQYXJzZXIoeG1sKSB7XG4gIGNvbnN0IHhtbE9iaiA9IHBhcnNlWG1sKHhtbClcbiAgaWYgKHhtbE9iai5EZWxldGVSZXN1bHQgJiYgeG1sT2JqLkRlbGV0ZVJlc3VsdC5FcnJvcikge1xuICAgIC8vIHJldHVybiBlcnJvcnMgYXMgYXJyYXkgYWx3YXlzLiBhcyB0aGUgcmVzcG9uc2UgaXMgb2JqZWN0IGluIGNhc2Ugb2Ygc2luZ2xlIG9iamVjdCBwYXNzZWQgaW4gcmVtb3ZlT2JqZWN0c1xuICAgIHJldHVybiB0b0FycmF5KHhtbE9iai5EZWxldGVSZXN1bHQuRXJyb3IpXG4gIH1cbiAgcmV0dXJuIFtdXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVNlbGVjdE9iamVjdENvbnRlbnRSZXNwb25zZShyZXMpIHtcbiAgLy8gZXh0cmFjdEhlYWRlclR5cGUgZXh0cmFjdHMgdGhlIGZpcnN0IGhhbGYgb2YgdGhlIGhlYWRlciBtZXNzYWdlLCB0aGUgaGVhZGVyIHR5cGUuXG4gIGZ1bmN0aW9uIGV4dHJhY3RIZWFkZXJUeXBlKHN0cmVhbSkge1xuICAgIGNvbnN0IGhlYWRlck5hbWVMZW4gPSBCdWZmZXIuZnJvbShzdHJlYW0ucmVhZCgxKSkucmVhZFVJbnQ4KClcbiAgICBjb25zdCBoZWFkZXJOYW1lV2l0aFNlcGFyYXRvciA9IEJ1ZmZlci5mcm9tKHN0cmVhbS5yZWFkKGhlYWRlck5hbWVMZW4pKS50b1N0cmluZygpXG4gICAgY29uc3Qgc3BsaXRCeVNlcGFyYXRvciA9IChoZWFkZXJOYW1lV2l0aFNlcGFyYXRvciB8fCAnJykuc3BsaXQoJzonKVxuICAgIGNvbnN0IGhlYWRlck5hbWUgPSBzcGxpdEJ5U2VwYXJhdG9yLmxlbmd0aCA+PSAxID8gc3BsaXRCeVNlcGFyYXRvclsxXSA6ICcnXG4gICAgcmV0dXJuIGhlYWRlck5hbWVcbiAgfVxuXG4gIGZ1bmN0aW9uIGV4dHJhY3RIZWFkZXJWYWx1ZShzdHJlYW0pIHtcbiAgICBjb25zdCBib2R5TGVuID0gQnVmZmVyLmZyb20oc3RyZWFtLnJlYWQoMikpLnJlYWRVSW50MTZCRSgpXG4gICAgY29uc3QgYm9keU5hbWUgPSBCdWZmZXIuZnJvbShzdHJlYW0ucmVhZChib2R5TGVuKSkudG9TdHJpbmcoKVxuICAgIHJldHVybiBib2R5TmFtZVxuICB9XG5cbiAgY29uc3Qgc2VsZWN0UmVzdWx0cyA9IG5ldyBTZWxlY3RSZXN1bHRzKHt9KSAvLyB3aWxsIGJlIHJldHVybmVkXG5cbiAgY29uc3QgcmVzcG9uc2VTdHJlYW0gPSByZWFkYWJsZVN0cmVhbShyZXMpIC8vIGNvbnZlcnQgYnl0ZSBhcnJheSB0byBhIHJlYWRhYmxlIHJlc3BvbnNlU3RyZWFtXG4gIHdoaWxlIChyZXNwb25zZVN0cmVhbS5fcmVhZGFibGVTdGF0ZS5sZW5ndGgpIHtcbiAgICAvLyBUb3AgbGV2ZWwgcmVzcG9uc2VTdHJlYW0gcmVhZCB0cmFja2VyLlxuICAgIGxldCBtc2dDcmNBY2N1bXVsYXRvciAvLyBhY2N1bXVsYXRlIGZyb20gc3RhcnQgb2YgdGhlIG1lc3NhZ2UgdGlsbCB0aGUgbWVzc2FnZSBjcmMgc3RhcnQuXG5cbiAgICBjb25zdCB0b3RhbEJ5dGVMZW5ndGhCdWZmZXIgPSBCdWZmZXIuZnJvbShyZXNwb25zZVN0cmVhbS5yZWFkKDQpKVxuICAgIG1zZ0NyY0FjY3VtdWxhdG9yID0gY3JjMzIodG90YWxCeXRlTGVuZ3RoQnVmZmVyKVxuXG4gICAgY29uc3QgaGVhZGVyQnl0ZXNCdWZmZXIgPSBCdWZmZXIuZnJvbShyZXNwb25zZVN0cmVhbS5yZWFkKDQpKVxuICAgIG1zZ0NyY0FjY3VtdWxhdG9yID0gY3JjMzIoaGVhZGVyQnl0ZXNCdWZmZXIsIG1zZ0NyY0FjY3VtdWxhdG9yKVxuXG4gICAgY29uc3QgY2FsY3VsYXRlZFByZWx1ZGVDcmMgPSBtc2dDcmNBY2N1bXVsYXRvci5yZWFkSW50MzJCRSgpIC8vIHVzZSBpdCB0byBjaGVjayBpZiBhbnkgQ1JDIG1pc21hdGNoIGluIGhlYWRlciBpdHNlbGYuXG5cbiAgICBjb25zdCBwcmVsdWRlQ3JjQnVmZmVyID0gQnVmZmVyLmZyb20ocmVzcG9uc2VTdHJlYW0ucmVhZCg0KSkgLy8gcmVhZCA0IGJ5dGVzICAgIGkuZSA0KzQgPTggKyA0ID0gMTIgKCBwcmVsdWRlICsgcHJlbHVkZSBjcmMpXG4gICAgbXNnQ3JjQWNjdW11bGF0b3IgPSBjcmMzMihwcmVsdWRlQ3JjQnVmZmVyLCBtc2dDcmNBY2N1bXVsYXRvcilcblxuICAgIGNvbnN0IHRvdGFsTXNnTGVuZ3RoID0gdG90YWxCeXRlTGVuZ3RoQnVmZmVyLnJlYWRJbnQzMkJFKClcbiAgICBjb25zdCBoZWFkZXJMZW5ndGggPSBoZWFkZXJCeXRlc0J1ZmZlci5yZWFkSW50MzJCRSgpXG4gICAgY29uc3QgcHJlbHVkZUNyY0J5dGVWYWx1ZSA9IHByZWx1ZGVDcmNCdWZmZXIucmVhZEludDMyQkUoKVxuXG4gICAgaWYgKHByZWx1ZGVDcmNCeXRlVmFsdWUgIT09IGNhbGN1bGF0ZWRQcmVsdWRlQ3JjKSB7XG4gICAgICAvLyBIYW5kbGUgSGVhZGVyIENSQyBtaXNtYXRjaCBFcnJvclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgSGVhZGVyIENoZWNrc3VtIE1pc21hdGNoLCBQcmVsdWRlIENSQyBvZiAke3ByZWx1ZGVDcmNCeXRlVmFsdWV9IGRvZXMgbm90IGVxdWFsIGV4cGVjdGVkIENSQyBvZiAke2NhbGN1bGF0ZWRQcmVsdWRlQ3JjfWAsXG4gICAgICApXG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGVycyA9IHt9XG4gICAgaWYgKGhlYWRlckxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGhlYWRlckJ5dGVzID0gQnVmZmVyLmZyb20ocmVzcG9uc2VTdHJlYW0ucmVhZChoZWFkZXJMZW5ndGgpKVxuICAgICAgbXNnQ3JjQWNjdW11bGF0b3IgPSBjcmMzMihoZWFkZXJCeXRlcywgbXNnQ3JjQWNjdW11bGF0b3IpXG4gICAgICBjb25zdCBoZWFkZXJSZWFkZXJTdHJlYW0gPSByZWFkYWJsZVN0cmVhbShoZWFkZXJCeXRlcylcbiAgICAgIHdoaWxlIChoZWFkZXJSZWFkZXJTdHJlYW0uX3JlYWRhYmxlU3RhdGUubGVuZ3RoKSB7XG4gICAgICAgIGxldCBoZWFkZXJUeXBlTmFtZSA9IGV4dHJhY3RIZWFkZXJUeXBlKGhlYWRlclJlYWRlclN0cmVhbSlcbiAgICAgICAgaGVhZGVyUmVhZGVyU3RyZWFtLnJlYWQoMSkgLy8ganVzdCByZWFkIGFuZCBpZ25vcmUgaXQuXG4gICAgICAgIGhlYWRlcnNbaGVhZGVyVHlwZU5hbWVdID0gZXh0cmFjdEhlYWRlclZhbHVlKGhlYWRlclJlYWRlclN0cmVhbSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgcGF5bG9hZFN0cmVhbVxuICAgIGNvbnN0IHBheUxvYWRMZW5ndGggPSB0b3RhbE1zZ0xlbmd0aCAtIGhlYWRlckxlbmd0aCAtIDE2XG4gICAgaWYgKHBheUxvYWRMZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBwYXlMb2FkQnVmZmVyID0gQnVmZmVyLmZyb20ocmVzcG9uc2VTdHJlYW0ucmVhZChwYXlMb2FkTGVuZ3RoKSlcbiAgICAgIG1zZ0NyY0FjY3VtdWxhdG9yID0gY3JjMzIocGF5TG9hZEJ1ZmZlciwgbXNnQ3JjQWNjdW11bGF0b3IpXG4gICAgICAvLyByZWFkIHRoZSBjaGVja3N1bSBlYXJseSBhbmQgZGV0ZWN0IGFueSBtaXNtYXRjaCBzbyB3ZSBjYW4gYXZvaWQgdW5uZWNlc3NhcnkgZnVydGhlciBwcm9jZXNzaW5nLlxuICAgICAgY29uc3QgbWVzc2FnZUNyY0J5dGVWYWx1ZSA9IEJ1ZmZlci5mcm9tKHJlc3BvbnNlU3RyZWFtLnJlYWQoNCkpLnJlYWRJbnQzMkJFKClcbiAgICAgIGNvbnN0IGNhbGN1bGF0ZWRDcmMgPSBtc2dDcmNBY2N1bXVsYXRvci5yZWFkSW50MzJCRSgpXG4gICAgICAvLyBIYW5kbGUgbWVzc2FnZSBDUkMgRXJyb3JcbiAgICAgIGlmIChtZXNzYWdlQ3JjQnl0ZVZhbHVlICE9PSBjYWxjdWxhdGVkQ3JjKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgTWVzc2FnZSBDaGVja3N1bSBNaXNtYXRjaCwgTWVzc2FnZSBDUkMgb2YgJHttZXNzYWdlQ3JjQnl0ZVZhbHVlfSBkb2VzIG5vdCBlcXVhbCBleHBlY3RlZCBDUkMgb2YgJHtjYWxjdWxhdGVkQ3JjfWAsXG4gICAgICAgIClcbiAgICAgIH1cbiAgICAgIHBheWxvYWRTdHJlYW0gPSByZWFkYWJsZVN0cmVhbShwYXlMb2FkQnVmZmVyKVxuICAgIH1cblxuICAgIGNvbnN0IG1lc3NhZ2VUeXBlID0gaGVhZGVyc1snbWVzc2FnZS10eXBlJ11cblxuICAgIHN3aXRjaCAobWVzc2FnZVR5cGUpIHtcbiAgICAgIGNhc2UgJ2Vycm9yJzoge1xuICAgICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBoZWFkZXJzWydlcnJvci1jb2RlJ10gKyAnOlwiJyArIGhlYWRlcnNbJ2Vycm9yLW1lc3NhZ2UnXSArICdcIidcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yTWVzc2FnZSlcbiAgICAgIH1cbiAgICAgIGNhc2UgJ2V2ZW50Jzoge1xuICAgICAgICBjb25zdCBjb250ZW50VHlwZSA9IGhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddXG4gICAgICAgIGNvbnN0IGV2ZW50VHlwZSA9IGhlYWRlcnNbJ2V2ZW50LXR5cGUnXVxuXG4gICAgICAgIHN3aXRjaCAoZXZlbnRUeXBlKSB7XG4gICAgICAgICAgY2FzZSAnRW5kJzoge1xuICAgICAgICAgICAgc2VsZWN0UmVzdWx0cy5zZXRSZXNwb25zZShyZXMpXG4gICAgICAgICAgICByZXR1cm4gc2VsZWN0UmVzdWx0c1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNhc2UgJ1JlY29yZHMnOiB7XG4gICAgICAgICAgICBjb25zdCByZWFkRGF0YSA9IHBheWxvYWRTdHJlYW0ucmVhZChwYXlMb2FkTGVuZ3RoKVxuICAgICAgICAgICAgc2VsZWN0UmVzdWx0cy5zZXRSZWNvcmRzKHJlYWREYXRhKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjYXNlICdQcm9ncmVzcyc6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHN3aXRjaCAoY29udGVudFR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICd0ZXh0L3htbCc6IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHByb2dyZXNzRGF0YSA9IHBheWxvYWRTdHJlYW0ucmVhZChwYXlMb2FkTGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgc2VsZWN0UmVzdWx0cy5zZXRQcm9ncmVzcyhwcm9ncmVzc0RhdGEudG9TdHJpbmcoKSlcbiAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGBVbmV4cGVjdGVkIGNvbnRlbnQtdHlwZSAke2NvbnRlbnRUeXBlfSBzZW50IGZvciBldmVudC10eXBlIFByb2dyZXNzYFxuICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yTWVzc2FnZSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSAnU3RhdHMnOlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzd2l0Y2ggKGNvbnRlbnRUeXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAndGV4dC94bWwnOiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBzdGF0c0RhdGEgPSBwYXlsb2FkU3RyZWFtLnJlYWQocGF5TG9hZExlbmd0aClcbiAgICAgICAgICAgICAgICAgIHNlbGVjdFJlc3VsdHMuc2V0U3RhdHMoc3RhdHNEYXRhLnRvU3RyaW5nKCkpXG4gICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBgVW5leHBlY3RlZCBjb250ZW50LXR5cGUgJHtjb250ZW50VHlwZX0gc2VudCBmb3IgZXZlbnQtdHlwZSBTdGF0c2BcbiAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvck1lc3NhZ2UpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgIC8vIENvbnRpbnVhdGlvbiBtZXNzYWdlOiBOb3Qgc3VyZSBpZiBpdCBpcyBzdXBwb3J0ZWQuIGRpZCBub3QgZmluZCBhIHJlZmVyZW5jZSBvciBhbnkgbWVzc2FnZSBpbiByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIEl0IGRvZXMgbm90IGhhdmUgYSBwYXlsb2FkLlxuICAgICAgICAgICAgY29uc3Qgd2FybmluZ01lc3NhZ2UgPSBgVW4gaW1wbGVtZW50ZWQgZXZlbnQgZGV0ZWN0ZWQgICR7bWVzc2FnZVR5cGV9LmBcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgICBjb25zb2xlLndhcm4od2FybmluZ01lc3NhZ2UpXG4gICAgICAgICAgfVxuICAgICAgICB9IC8vIGV2ZW50VHlwZSBFbmRcbiAgICAgIH0gLy8gRXZlbnQgRW5kXG4gICAgfSAvLyBtZXNzYWdlVHlwZSBF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