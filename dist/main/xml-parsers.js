"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseBucketEncryptionConfig = parseBucketEncryptionConfig;
exports.parseBucketNotification = parseBucketNotification;
exports.parseCopyObject = parseCopyObject;
exports.parseLifecycleConfig = parseLifecycleConfig;
exports.parseListObjects = parseListObjects;
exports.parseListObjectsV2 = parseListObjectsV2;
exports.parseListObjectsV2WithMetadata = parseListObjectsV2WithMetadata;
exports.parseObjectLegalHoldConfig = parseObjectLegalHoldConfig;
exports.parseObjectRetentionConfig = parseObjectRetentionConfig;
exports.parseSelectObjectContentResponse = parseSelectObjectContentResponse;
exports.removeObjectsParser = removeObjectsParser;
exports.uploadPartParser = uploadPartParser;
var _bufferCrc = require("buffer-crc32");
var _fastXmlParser = require("fast-xml-parser");
var errors = _interopRequireWildcard(require("./errors.js"), true);
var _helpers = require("./helpers.js");
var _helper = require("./internal/helper.js");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
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

const fxpWithoutNumParser = new _fastXmlParser.XMLParser({
  numberParseOptions: {
    skipLike: /./
  }
});

// parse XML response for copy object
function parseCopyObject(xml) {
  var result = {
    etag: '',
    lastModified: ''
  };
  var xmlobj = (0, _helper.parseXml)(xml);
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
function parseBucketNotification(xml) {
  var result = {
    TopicConfiguration: [],
    QueueConfiguration: [],
    CloudFunctionConfiguration: []
  };
  // Parse the events list
  var genEvents = function (events) {
    var result = [];
    if (events) {
      (0, _helper.toArray)(events).forEach(s3event => {
        result.push(s3event);
      });
    }
    return result;
  };
  // Parse all filter rules
  var genFilterRules = function (filters) {
    var result = [];
    if (filters) {
      filters = (0, _helper.toArray)(filters);
      if (filters[0].S3Key) {
        filters[0].S3Key = (0, _helper.toArray)(filters[0].S3Key);
        if (filters[0].S3Key[0].FilterRule) {
          (0, _helper.toArray)(filters[0].S3Key[0].FilterRule).forEach(rule => {
            var Name = (0, _helper.toArray)(rule.Name)[0];
            var Value = (0, _helper.toArray)(rule.Value)[0];
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
  var xmlobj = (0, _helper.parseXml)(xml);
  xmlobj = xmlobj.NotificationConfiguration;

  // Parse all topic configurations in the xml
  if (xmlobj.TopicConfiguration) {
    (0, _helper.toArray)(xmlobj.TopicConfiguration).forEach(config => {
      var Id = (0, _helper.toArray)(config.Id)[0];
      var Topic = (0, _helper.toArray)(config.Topic)[0];
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
    (0, _helper.toArray)(xmlobj.QueueConfiguration).forEach(config => {
      var Id = (0, _helper.toArray)(config.Id)[0];
      var Queue = (0, _helper.toArray)(config.Queue)[0];
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
    (0, _helper.toArray)(xmlobj.CloudFunctionConfiguration).forEach(config => {
      var Id = (0, _helper.toArray)(config.Id)[0];
      var CloudFunction = (0, _helper.toArray)(config.CloudFunction)[0];
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
  if (!(0, _helper.isObject)(opts)) {
    opts = {};
  }
  const name = (0, _helper.sanitizeObjectKey)((0, _helper.toArray)(Key)[0]);
  const lastModified = new Date((0, _helper.toArray)(LastModified)[0]);
  const etag = (0, _helper.sanitizeETag)((0, _helper.toArray)(ETag)[0]);
  const size = (0, _helper.sanitizeSize)(Size);
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
function parseListObjects(xml) {
  var result = {
    objects: [],
    isTruncated: false
  };
  let isTruncated = false;
  let nextMarker, nextVersionKeyMarker;
  const xmlobj = fxpWithoutNumParser.parse(xml);
  const parseCommonPrefixesEntity = responseEntity => {
    if (responseEntity) {
      (0, _helper.toArray)(responseEntity).forEach(commonPrefix => {
        result.objects.push({
          prefix: (0, _helper.sanitizeObjectKey)((0, _helper.toArray)(commonPrefix.Prefix)[0]),
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
      (0, _helper.toArray)(listBucketResult.Contents).forEach(content => {
        const name = (0, _helper.sanitizeObjectKey)((0, _helper.toArray)(content.Key)[0]);
        const lastModified = new Date((0, _helper.toArray)(content.LastModified)[0]);
        const etag = (0, _helper.sanitizeETag)((0, _helper.toArray)(content.ETag)[0]);
        const size = (0, _helper.sanitizeSize)(content.Size);
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
      (0, _helper.toArray)(listVersionsResult.Version).forEach(content => {
        result.objects.push(formatObjInfo(content));
      });
    }
    if (listVersionsResult.DeleteMarker) {
      (0, _helper.toArray)(listVersionsResult.DeleteMarker).forEach(content => {
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
function parseListObjectsV2(xml) {
  var result = {
    objects: [],
    isTruncated: false
  };
  var xmlobj = (0, _helper.parseXml)(xml);
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
    (0, _helper.toArray)(xmlobj.Contents).forEach(content => {
      var name = (0, _helper.sanitizeObjectKey)((0, _helper.toArray)(content.Key)[0]);
      var lastModified = new Date(content.LastModified);
      var etag = (0, _helper.sanitizeETag)(content.ETag);
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
    (0, _helper.toArray)(xmlobj.CommonPrefixes).forEach(commonPrefix => {
      result.objects.push({
        prefix: (0, _helper.sanitizeObjectKey)((0, _helper.toArray)(commonPrefix.Prefix)[0]),
        size: 0
      });
    });
  }
  return result;
}

// parse XML response for list objects v2 with metadata in a bucket
function parseListObjectsV2WithMetadata(xml) {
  var result = {
    objects: [],
    isTruncated: false
  };
  var xmlobj = (0, _helper.parseXml)(xml);
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
    (0, _helper.toArray)(xmlobj.Contents).forEach(content => {
      var name = (0, _helper.sanitizeObjectKey)(content.Key);
      var lastModified = new Date(content.LastModified);
      var etag = (0, _helper.sanitizeETag)(content.ETag);
      var size = content.Size;
      var metadata;
      if (content.UserMetadata != null) {
        metadata = (0, _helper.toArray)(content.UserMetadata)[0];
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
    (0, _helper.toArray)(xmlobj.CommonPrefixes).forEach(commonPrefix => {
      result.objects.push({
        prefix: (0, _helper.sanitizeObjectKey)((0, _helper.toArray)(commonPrefix.Prefix)[0]),
        size: 0
      });
    });
  }
  return result;
}
function parseLifecycleConfig(xml) {
  const xmlObj = (0, _helper.parseXml)(xml);
  return xmlObj.LifecycleConfiguration;
}
function parseObjectRetentionConfig(xml) {
  const xmlObj = (0, _helper.parseXml)(xml);
  const retentionConfig = xmlObj.Retention;
  return {
    mode: retentionConfig.Mode,
    retainUntilDate: retentionConfig.RetainUntilDate
  };
}
function parseBucketEncryptionConfig(xml) {
  let encConfig = (0, _helper.parseXml)(xml);
  return encConfig;
}
function parseObjectLegalHoldConfig(xml) {
  const xmlObj = (0, _helper.parseXml)(xml);
  return xmlObj.LegalHold;
}
function uploadPartParser(xml) {
  const xmlObj = (0, _helper.parseXml)(xml);
  const respEl = xmlObj.CopyPartResult;
  return respEl;
}
function removeObjectsParser(xml) {
  const xmlObj = (0, _helper.parseXml)(xml);
  if (xmlObj.DeleteResult && xmlObj.DeleteResult.Error) {
    // return errors as array always. as the response is object in case of single object passed in removeObjects
    return (0, _helper.toArray)(xmlObj.DeleteResult.Error);
  }
  return [];
}
function parseSelectObjectContentResponse(res) {
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
  const selectResults = new _helpers.SelectResults({}); // will be returned

  const responseStream = (0, _helper.readableStream)(res); // convert byte array to a readable responseStream
  while (responseStream._readableState.length) {
    // Top level responseStream read tracker.
    let msgCrcAccumulator; // accumulate from start of the message till the message crc start.

    const totalByteLengthBuffer = Buffer.from(responseStream.read(4));
    msgCrcAccumulator = _bufferCrc(totalByteLengthBuffer);
    const headerBytesBuffer = Buffer.from(responseStream.read(4));
    msgCrcAccumulator = _bufferCrc(headerBytesBuffer, msgCrcAccumulator);
    const calculatedPreludeCrc = msgCrcAccumulator.readInt32BE(); // use it to check if any CRC mismatch in header itself.

    const preludeCrcBuffer = Buffer.from(responseStream.read(4)); // read 4 bytes    i.e 4+4 =8 + 4 = 12 ( prelude + prelude crc)
    msgCrcAccumulator = _bufferCrc(preludeCrcBuffer, msgCrcAccumulator);
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
      msgCrcAccumulator = _bufferCrc(headerBytes, msgCrcAccumulator);
      const headerReaderStream = (0, _helper.readableStream)(headerBytes);
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
      msgCrcAccumulator = _bufferCrc(payLoadBuffer, msgCrcAccumulator);
      // read the checksum early and detect any mismatch so we can avoid unnecessary further processing.
      const messageCrcByteValue = Buffer.from(responseStream.read(4)).readInt32BE();
      const calculatedCrc = msgCrcAccumulator.readInt32BE();
      // Handle message CRC Error
      if (messageCrcByteValue !== calculatedCrc) {
        throw new Error(`Message Checksum Mismatch, Message CRC of ${messageCrcByteValue} does not equal expected CRC of ${calculatedCrc}`);
      }
      payloadStream = (0, _helper.readableStream)(payLoadBuffer);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYnVmZmVyQ3JjIiwicmVxdWlyZSIsIl9mYXN0WG1sUGFyc2VyIiwiZXJyb3JzIiwiX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQiLCJfaGVscGVycyIsIl9oZWxwZXIiLCJfZ2V0UmVxdWlyZVdpbGRjYXJkQ2FjaGUiLCJub2RlSW50ZXJvcCIsIldlYWtNYXAiLCJjYWNoZUJhYmVsSW50ZXJvcCIsImNhY2hlTm9kZUludGVyb3AiLCJvYmoiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsImNhY2hlIiwiaGFzIiwiZ2V0IiwibmV3T2JqIiwiaGFzUHJvcGVydHlEZXNjcmlwdG9yIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJrZXkiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJkZXNjIiwic2V0IiwiZnhwV2l0aG91dE51bVBhcnNlciIsIlhNTFBhcnNlciIsIm51bWJlclBhcnNlT3B0aW9ucyIsInNraXBMaWtlIiwicGFyc2VDb3B5T2JqZWN0IiwieG1sIiwicmVzdWx0IiwiZXRhZyIsImxhc3RNb2RpZmllZCIsInhtbG9iaiIsInBhcnNlWG1sIiwiQ29weU9iamVjdFJlc3VsdCIsIkludmFsaWRYTUxFcnJvciIsIkVUYWciLCJyZXBsYWNlIiwiTGFzdE1vZGlmaWVkIiwiRGF0ZSIsInBhcnNlQnVja2V0Tm90aWZpY2F0aW9uIiwiVG9waWNDb25maWd1cmF0aW9uIiwiUXVldWVDb25maWd1cmF0aW9uIiwiQ2xvdWRGdW5jdGlvbkNvbmZpZ3VyYXRpb24iLCJnZW5FdmVudHMiLCJldmVudHMiLCJ0b0FycmF5IiwiZm9yRWFjaCIsInMzZXZlbnQiLCJwdXNoIiwiZ2VuRmlsdGVyUnVsZXMiLCJmaWx0ZXJzIiwiUzNLZXkiLCJGaWx0ZXJSdWxlIiwicnVsZSIsIk5hbWUiLCJWYWx1ZSIsIk5vdGlmaWNhdGlvbkNvbmZpZ3VyYXRpb24iLCJjb25maWciLCJJZCIsIlRvcGljIiwiRXZlbnQiLCJGaWx0ZXIiLCJRdWV1ZSIsIkNsb3VkRnVuY3Rpb24iLCJmb3JtYXRPYmpJbmZvIiwiY29udGVudCIsIm9wdHMiLCJLZXkiLCJTaXplIiwiVmVyc2lvbklkIiwiSXNMYXRlc3QiLCJpc09iamVjdCIsIm5hbWUiLCJzYW5pdGl6ZU9iamVjdEtleSIsInNhbml0aXplRVRhZyIsInNpemUiLCJzYW5pdGl6ZVNpemUiLCJ2ZXJzaW9uSWQiLCJpc0xhdGVzdCIsImlzRGVsZXRlTWFya2VyIiwiSXNEZWxldGVNYXJrZXIiLCJwYXJzZUxpc3RPYmplY3RzIiwib2JqZWN0cyIsImlzVHJ1bmNhdGVkIiwibmV4dE1hcmtlciIsIm5leHRWZXJzaW9uS2V5TWFya2VyIiwicGFyc2UiLCJwYXJzZUNvbW1vblByZWZpeGVzRW50aXR5IiwicmVzcG9uc2VFbnRpdHkiLCJjb21tb25QcmVmaXgiLCJwcmVmaXgiLCJQcmVmaXgiLCJsaXN0QnVja2V0UmVzdWx0IiwiTGlzdEJ1Y2tldFJlc3VsdCIsImxpc3RWZXJzaW9uc1Jlc3VsdCIsIkxpc3RWZXJzaW9uc1Jlc3VsdCIsIklzVHJ1bmNhdGVkIiwiQ29udGVudHMiLCJOZXh0TWFya2VyIiwibGVuZ3RoIiwiQ29tbW9uUHJlZml4ZXMiLCJWZXJzaW9uIiwiRGVsZXRlTWFya2VyIiwiTmV4dEtleU1hcmtlciIsIk5leHRWZXJzaW9uSWRNYXJrZXIiLCJ2ZXJzaW9uSWRNYXJrZXIiLCJwYXJzZUxpc3RPYmplY3RzVjIiLCJOZXh0Q29udGludWF0aW9uVG9rZW4iLCJuZXh0Q29udGludWF0aW9uVG9rZW4iLCJwYXJzZUxpc3RPYmplY3RzVjJXaXRoTWV0YWRhdGEiLCJtZXRhZGF0YSIsIlVzZXJNZXRhZGF0YSIsInBhcnNlTGlmZWN5Y2xlQ29uZmlnIiwieG1sT2JqIiwiTGlmZWN5Y2xlQ29uZmlndXJhdGlvbiIsInBhcnNlT2JqZWN0UmV0ZW50aW9uQ29uZmlnIiwicmV0ZW50aW9uQ29uZmlnIiwiUmV0ZW50aW9uIiwibW9kZSIsIk1vZGUiLCJyZXRhaW5VbnRpbERhdGUiLCJSZXRhaW5VbnRpbERhdGUiLCJwYXJzZUJ1Y2tldEVuY3J5cHRpb25Db25maWciLCJlbmNDb25maWciLCJwYXJzZU9iamVjdExlZ2FsSG9sZENvbmZpZyIsIkxlZ2FsSG9sZCIsInVwbG9hZFBhcnRQYXJzZXIiLCJyZXNwRWwiLCJDb3B5UGFydFJlc3VsdCIsInJlbW92ZU9iamVjdHNQYXJzZXIiLCJEZWxldGVSZXN1bHQiLCJFcnJvciIsInBhcnNlU2VsZWN0T2JqZWN0Q29udGVudFJlc3BvbnNlIiwicmVzIiwiZXh0cmFjdEhlYWRlclR5cGUiLCJzdHJlYW0iLCJoZWFkZXJOYW1lTGVuIiwiQnVmZmVyIiwiZnJvbSIsInJlYWQiLCJyZWFkVUludDgiLCJoZWFkZXJOYW1lV2l0aFNlcGFyYXRvciIsInRvU3RyaW5nIiwic3BsaXRCeVNlcGFyYXRvciIsInNwbGl0IiwiaGVhZGVyTmFtZSIsImV4dHJhY3RIZWFkZXJWYWx1ZSIsImJvZHlMZW4iLCJyZWFkVUludDE2QkUiLCJib2R5TmFtZSIsInNlbGVjdFJlc3VsdHMiLCJTZWxlY3RSZXN1bHRzIiwicmVzcG9uc2VTdHJlYW0iLCJyZWFkYWJsZVN0cmVhbSIsIl9yZWFkYWJsZVN0YXRlIiwibXNnQ3JjQWNjdW11bGF0b3IiLCJ0b3RhbEJ5dGVMZW5ndGhCdWZmZXIiLCJjcmMzMiIsImhlYWRlckJ5dGVzQnVmZmVyIiwiY2FsY3VsYXRlZFByZWx1ZGVDcmMiLCJyZWFkSW50MzJCRSIsInByZWx1ZGVDcmNCdWZmZXIiLCJ0b3RhbE1zZ0xlbmd0aCIsImhlYWRlckxlbmd0aCIsInByZWx1ZGVDcmNCeXRlVmFsdWUiLCJoZWFkZXJzIiwiaGVhZGVyQnl0ZXMiLCJoZWFkZXJSZWFkZXJTdHJlYW0iLCJoZWFkZXJUeXBlTmFtZSIsInBheWxvYWRTdHJlYW0iLCJwYXlMb2FkTGVuZ3RoIiwicGF5TG9hZEJ1ZmZlciIsIm1lc3NhZ2VDcmNCeXRlVmFsdWUiLCJjYWxjdWxhdGVkQ3JjIiwibWVzc2FnZVR5cGUiLCJlcnJvck1lc3NhZ2UiLCJjb250ZW50VHlwZSIsImV2ZW50VHlwZSIsInNldFJlc3BvbnNlIiwicmVhZERhdGEiLCJzZXRSZWNvcmRzIiwicHJvZ3Jlc3NEYXRhIiwic2V0UHJvZ3Jlc3MiLCJzdGF0c0RhdGEiLCJzZXRTdGF0cyIsIndhcm5pbmdNZXNzYWdlIiwiY29uc29sZSIsIndhcm4iXSwic291cmNlcyI6WyJ4bWwtcGFyc2Vycy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogTWluSU8gSmF2YXNjcmlwdCBMaWJyYXJ5IGZvciBBbWF6b24gUzMgQ29tcGF0aWJsZSBDbG91ZCBTdG9yYWdlLCAoQykgMjAxNSBNaW5JTywgSW5jLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgY3JjMzIgZnJvbSAnYnVmZmVyLWNyYzMyJ1xuaW1wb3J0IHsgWE1MUGFyc2VyIH0gZnJvbSAnZmFzdC14bWwtcGFyc2VyJ1xuXG5pbXBvcnQgKiBhcyBlcnJvcnMgZnJvbSAnLi9lcnJvcnMudHMnXG5pbXBvcnQgeyBTZWxlY3RSZXN1bHRzIH0gZnJvbSAnLi9oZWxwZXJzLnRzJ1xuaW1wb3J0IHtcbiAgaXNPYmplY3QsXG4gIHBhcnNlWG1sLFxuICByZWFkYWJsZVN0cmVhbSxcbiAgc2FuaXRpemVFVGFnLFxuICBzYW5pdGl6ZU9iamVjdEtleSxcbiAgc2FuaXRpemVTaXplLFxuICB0b0FycmF5LFxufSBmcm9tICcuL2ludGVybmFsL2hlbHBlci50cydcblxuY29uc3QgZnhwV2l0aG91dE51bVBhcnNlciA9IG5ldyBYTUxQYXJzZXIoe1xuICBudW1iZXJQYXJzZU9wdGlvbnM6IHtcbiAgICBza2lwTGlrZTogLy4vLFxuICB9LFxufSlcblxuLy8gcGFyc2UgWE1MIHJlc3BvbnNlIGZvciBjb3B5IG9iamVjdFxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQ29weU9iamVjdCh4bWwpIHtcbiAgdmFyIHJlc3VsdCA9IHtcbiAgICBldGFnOiAnJyxcbiAgICBsYXN0TW9kaWZpZWQ6ICcnLFxuICB9XG5cbiAgdmFyIHhtbG9iaiA9IHBhcnNlWG1sKHhtbClcbiAgaWYgKCF4bWxvYmouQ29weU9iamVjdFJlc3VsdCkge1xuICAgIHRocm93IG5ldyBlcnJvcnMuSW52YWxpZFhNTEVycm9yKCdNaXNzaW5nIHRhZzogXCJDb3B5T2JqZWN0UmVzdWx0XCInKVxuICB9XG4gIHhtbG9iaiA9IHhtbG9iai5Db3B5T2JqZWN0UmVzdWx0XG4gIGlmICh4bWxvYmouRVRhZykge1xuICAgIHJlc3VsdC5ldGFnID0geG1sb2JqLkVUYWcucmVwbGFjZSgvXlwiL2csICcnKVxuICAgICAgLnJlcGxhY2UoL1wiJC9nLCAnJylcbiAgICAgIC5yZXBsYWNlKC9eJnF1b3Q7L2csICcnKVxuICAgICAgLnJlcGxhY2UoLyZxdW90OyQvZywgJycpXG4gICAgICAucmVwbGFjZSgvXiYjMzQ7L2csICcnKVxuICAgICAgLnJlcGxhY2UoLyYjMzQ7JC9nLCAnJylcbiAgfVxuICBpZiAoeG1sb2JqLkxhc3RNb2RpZmllZCkge1xuICAgIHJlc3VsdC5sYXN0TW9kaWZpZWQgPSBuZXcgRGF0ZSh4bWxvYmouTGFzdE1vZGlmaWVkKVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vLyBwYXJzZSBYTUwgcmVzcG9uc2UgZm9yIGJ1Y2tldCBub3RpZmljYXRpb25cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUJ1Y2tldE5vdGlmaWNhdGlvbih4bWwpIHtcbiAgdmFyIHJlc3VsdCA9IHtcbiAgICBUb3BpY0NvbmZpZ3VyYXRpb246IFtdLFxuICAgIFF1ZXVlQ29uZmlndXJhdGlvbjogW10sXG4gICAgQ2xvdWRGdW5jdGlvbkNvbmZpZ3VyYXRpb246IFtdLFxuICB9XG4gIC8vIFBhcnNlIHRoZSBldmVudHMgbGlzdFxuICB2YXIgZ2VuRXZlbnRzID0gZnVuY3Rpb24gKGV2ZW50cykge1xuICAgIHZhciByZXN1bHQgPSBbXVxuICAgIGlmIChldmVudHMpIHtcbiAgICAgIHRvQXJyYXkoZXZlbnRzKS5mb3JFYWNoKChzM2V2ZW50KSA9PiB7XG4gICAgICAgIHJlc3VsdC5wdXNoKHMzZXZlbnQpXG4gICAgICB9KVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbiAgLy8gUGFyc2UgYWxsIGZpbHRlciBydWxlc1xuICB2YXIgZ2VuRmlsdGVyUnVsZXMgPSBmdW5jdGlvbiAoZmlsdGVycykge1xuICAgIHZhciByZXN1bHQgPSBbXVxuICAgIGlmIChmaWx0ZXJzKSB7XG4gICAgICBmaWx0ZXJzID0gdG9BcnJheShmaWx0ZXJzKVxuICAgICAgaWYgKGZpbHRlcnNbMF0uUzNLZXkpIHtcbiAgICAgICAgZmlsdGVyc1swXS5TM0tleSA9IHRvQXJyYXkoZmlsdGVyc1swXS5TM0tleSlcbiAgICAgICAgaWYgKGZpbHRlcnNbMF0uUzNLZXlbMF0uRmlsdGVyUnVsZSkge1xuICAgICAgICAgIHRvQXJyYXkoZmlsdGVyc1swXS5TM0tleVswXS5GaWx0ZXJSdWxlKS5mb3JFYWNoKChydWxlKSA9PiB7XG4gICAgICAgICAgICB2YXIgTmFtZSA9IHRvQXJyYXkocnVsZS5OYW1lKVswXVxuICAgICAgICAgICAgdmFyIFZhbHVlID0gdG9BcnJheShydWxlLlZhbHVlKVswXVxuICAgICAgICAgICAgcmVzdWx0LnB1c2goeyBOYW1lLCBWYWx1ZSB9KVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgdmFyIHhtbG9iaiA9IHBhcnNlWG1sKHhtbClcbiAgeG1sb2JqID0geG1sb2JqLk5vdGlmaWNhdGlvbkNvbmZpZ3VyYXRpb25cblxuICAvLyBQYXJzZSBhbGwgdG9waWMgY29uZmlndXJhdGlvbnMgaW4gdGhlIHhtbFxuICBpZiAoeG1sb2JqLlRvcGljQ29uZmlndXJhdGlvbikge1xuICAgIHRvQXJyYXkoeG1sb2JqLlRvcGljQ29uZmlndXJhdGlvbikuZm9yRWFjaCgoY29uZmlnKSA9PiB7XG4gICAgICB2YXIgSWQgPSB0b0FycmF5KGNvbmZpZy5JZClbMF1cbiAgICAgIHZhciBUb3BpYyA9IHRvQXJyYXkoY29uZmlnLlRvcGljKVswXVxuICAgICAgdmFyIEV2ZW50ID0gZ2VuRXZlbnRzKGNvbmZpZy5FdmVudClcbiAgICAgIHZhciBGaWx0ZXIgPSBnZW5GaWx0ZXJSdWxlcyhjb25maWcuRmlsdGVyKVxuICAgICAgcmVzdWx0LlRvcGljQ29uZmlndXJhdGlvbi5wdXNoKHsgSWQsIFRvcGljLCBFdmVudCwgRmlsdGVyIH0pXG4gICAgfSlcbiAgfVxuICAvLyBQYXJzZSBhbGwgdG9waWMgY29uZmlndXJhdGlvbnMgaW4gdGhlIHhtbFxuICBpZiAoeG1sb2JqLlF1ZXVlQ29uZmlndXJhdGlvbikge1xuICAgIHRvQXJyYXkoeG1sb2JqLlF1ZXVlQ29uZmlndXJhdGlvbikuZm9yRWFjaCgoY29uZmlnKSA9PiB7XG4gICAgICB2YXIgSWQgPSB0b0FycmF5KGNvbmZpZy5JZClbMF1cbiAgICAgIHZhciBRdWV1ZSA9IHRvQXJyYXkoY29uZmlnLlF1ZXVlKVswXVxuICAgICAgdmFyIEV2ZW50ID0gZ2VuRXZlbnRzKGNvbmZpZy5FdmVudClcbiAgICAgIHZhciBGaWx0ZXIgPSBnZW5GaWx0ZXJSdWxlcyhjb25maWcuRmlsdGVyKVxuICAgICAgcmVzdWx0LlF1ZXVlQ29uZmlndXJhdGlvbi5wdXNoKHsgSWQsIFF1ZXVlLCBFdmVudCwgRmlsdGVyIH0pXG4gICAgfSlcbiAgfVxuICAvLyBQYXJzZSBhbGwgUXVldWVDb25maWd1cmF0aW9uIGFycmF5c1xuICBpZiAoeG1sb2JqLkNsb3VkRnVuY3Rpb25Db25maWd1cmF0aW9uKSB7XG4gICAgdG9BcnJheSh4bWxvYmouQ2xvdWRGdW5jdGlvbkNvbmZpZ3VyYXRpb24pLmZvckVhY2goKGNvbmZpZykgPT4ge1xuICAgICAgdmFyIElkID0gdG9BcnJheShjb25maWcuSWQpWzBdXG4gICAgICB2YXIgQ2xvdWRGdW5jdGlvbiA9IHRvQXJyYXkoY29uZmlnLkNsb3VkRnVuY3Rpb24pWzBdXG4gICAgICB2YXIgRXZlbnQgPSBnZW5FdmVudHMoY29uZmlnLkV2ZW50KVxuICAgICAgdmFyIEZpbHRlciA9IGdlbkZpbHRlclJ1bGVzKGNvbmZpZy5GaWx0ZXIpXG4gICAgICByZXN1bHQuQ2xvdWRGdW5jdGlvbkNvbmZpZ3VyYXRpb24ucHVzaCh7IElkLCBDbG91ZEZ1bmN0aW9uLCBFdmVudCwgRmlsdGVyIH0pXG4gICAgfSlcbiAgfVxuXG4gIHJldHVybiByZXN1bHRcbn1cblxuY29uc3QgZm9ybWF0T2JqSW5mbyA9IChjb250ZW50LCBvcHRzID0ge30pID0+IHtcbiAgbGV0IHsgS2V5LCBMYXN0TW9kaWZpZWQsIEVUYWcsIFNpemUsIFZlcnNpb25JZCwgSXNMYXRlc3QgfSA9IGNvbnRlbnRcblxuICBpZiAoIWlzT2JqZWN0KG9wdHMpKSB7XG4gICAgb3B0cyA9IHt9XG4gIH1cblxuICBjb25zdCBuYW1lID0gc2FuaXRpemVPYmplY3RLZXkodG9BcnJheShLZXkpWzBdKVxuICBjb25zdCBsYXN0TW9kaWZpZWQgPSBuZXcgRGF0ZSh0b0FycmF5KExhc3RNb2RpZmllZClbMF0pXG4gIGNvbnN0IGV0YWcgPSBzYW5pdGl6ZUVUYWcodG9BcnJheShFVGFnKVswXSlcbiAgY29uc3Qgc2l6ZSA9IHNhbml0aXplU2l6ZShTaXplKVxuXG4gIHJldHVybiB7XG4gICAgbmFtZSxcbiAgICBsYXN0TW9kaWZpZWQsXG4gICAgZXRhZyxcbiAgICBzaXplLFxuICAgIHZlcnNpb25JZDogVmVyc2lvbklkLFxuICAgIGlzTGF0ZXN0OiBJc0xhdGVzdCxcbiAgICBpc0RlbGV0ZU1hcmtlcjogb3B0cy5Jc0RlbGV0ZU1hcmtlciA/IG9wdHMuSXNEZWxldGVNYXJrZXIgOiBmYWxzZSxcbiAgfVxufVxuXG4vLyBwYXJzZSBYTUwgcmVzcG9uc2UgZm9yIGxpc3Qgb2JqZWN0cyBpbiBhIGJ1Y2tldFxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlTGlzdE9iamVjdHMoeG1sKSB7XG4gIHZhciByZXN1bHQgPSB7XG4gICAgb2JqZWN0czogW10sXG4gICAgaXNUcnVuY2F0ZWQ6IGZhbHNlLFxuICB9XG4gIGxldCBpc1RydW5jYXRlZCA9IGZhbHNlXG4gIGxldCBuZXh0TWFya2VyLCBuZXh0VmVyc2lvbktleU1hcmtlclxuICBjb25zdCB4bWxvYmogPSBmeHBXaXRob3V0TnVtUGFyc2VyLnBhcnNlKHhtbClcblxuICBjb25zdCBwYXJzZUNvbW1vblByZWZpeGVzRW50aXR5ID0gKHJlc3BvbnNlRW50aXR5KSA9PiB7XG4gICAgaWYgKHJlc3BvbnNlRW50aXR5KSB7XG4gICAgICB0b0FycmF5KHJlc3BvbnNlRW50aXR5KS5mb3JFYWNoKChjb21tb25QcmVmaXgpID0+IHtcbiAgICAgICAgcmVzdWx0Lm9iamVjdHMucHVzaCh7IHByZWZpeDogc2FuaXRpemVPYmplY3RLZXkodG9BcnJheShjb21tb25QcmVmaXguUHJlZml4KVswXSksIHNpemU6IDAgfSlcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgY29uc3QgbGlzdEJ1Y2tldFJlc3VsdCA9IHhtbG9iai5MaXN0QnVja2V0UmVzdWx0XG4gIGNvbnN0IGxpc3RWZXJzaW9uc1Jlc3VsdCA9IHhtbG9iai5MaXN0VmVyc2lvbnNSZXN1bHRcblxuICBpZiAobGlzdEJ1Y2tldFJlc3VsdCkge1xuICAgIGlmIChsaXN0QnVja2V0UmVzdWx0LklzVHJ1bmNhdGVkKSB7XG4gICAgICBpc1RydW5jYXRlZCA9IGxpc3RCdWNrZXRSZXN1bHQuSXNUcnVuY2F0ZWRcbiAgICB9XG4gICAgaWYgKGxpc3RCdWNrZXRSZXN1bHQuQ29udGVudHMpIHtcbiAgICAgIHRvQXJyYXkobGlzdEJ1Y2tldFJlc3VsdC5Db250ZW50cykuZm9yRWFjaCgoY29udGVudCkgPT4ge1xuICAgICAgICBjb25zdCBuYW1lID0gc2FuaXRpemVPYmplY3RLZXkodG9BcnJheShjb250ZW50LktleSlbMF0pXG4gICAgICAgIGNvbnN0IGxhc3RNb2RpZmllZCA9IG5ldyBEYXRlKHRvQXJyYXkoY29udGVudC5MYXN0TW9kaWZpZWQpWzBdKVxuICAgICAgICBjb25zdCBldGFnID0gc2FuaXRpemVFVGFnKHRvQXJyYXkoY29udGVudC5FVGFnKVswXSlcbiAgICAgICAgY29uc3Qgc2l6ZSA9IHNhbml0aXplU2l6ZShjb250ZW50LlNpemUpXG4gICAgICAgIHJlc3VsdC5vYmplY3RzLnB1c2goeyBuYW1lLCBsYXN0TW9kaWZpZWQsIGV0YWcsIHNpemUgfSlcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgaWYgKGxpc3RCdWNrZXRSZXN1bHQuTmV4dE1hcmtlcikge1xuICAgICAgbmV4dE1hcmtlciA9IGxpc3RCdWNrZXRSZXN1bHQuTmV4dE1hcmtlclxuICAgIH0gZWxzZSBpZiAoaXNUcnVuY2F0ZWQgJiYgcmVzdWx0Lm9iamVjdHMubGVuZ3RoID4gMCkge1xuICAgICAgbmV4dE1hcmtlciA9IHJlc3VsdC5vYmplY3RzW3Jlc3VsdC5vYmplY3RzLmxlbmd0aCAtIDFdLm5hbWVcbiAgICB9XG4gICAgcGFyc2VDb21tb25QcmVmaXhlc0VudGl0eShsaXN0QnVja2V0UmVzdWx0LkNvbW1vblByZWZpeGVzKVxuICB9XG5cbiAgaWYgKGxpc3RWZXJzaW9uc1Jlc3VsdCkge1xuICAgIGlmIChsaXN0VmVyc2lvbnNSZXN1bHQuSXNUcnVuY2F0ZWQpIHtcbiAgICAgIGlzVHJ1bmNhdGVkID0gbGlzdFZlcnNpb25zUmVzdWx0LklzVHJ1bmNhdGVkXG4gICAgfVxuXG4gICAgaWYgKGxpc3RWZXJzaW9uc1Jlc3VsdC5WZXJzaW9uKSB7XG4gICAgICB0b0FycmF5KGxpc3RWZXJzaW9uc1Jlc3VsdC5WZXJzaW9uKS5mb3JFYWNoKChjb250ZW50KSA9PiB7XG4gICAgICAgIHJlc3VsdC5vYmplY3RzLnB1c2goZm9ybWF0T2JqSW5mbyhjb250ZW50KSlcbiAgICAgIH0pXG4gICAgfVxuICAgIGlmIChsaXN0VmVyc2lvbnNSZXN1bHQuRGVsZXRlTWFya2VyKSB7XG4gICAgICB0b0FycmF5KGxpc3RWZXJzaW9uc1Jlc3VsdC5EZWxldGVNYXJrZXIpLmZvckVhY2goKGNvbnRlbnQpID0+IHtcbiAgICAgICAgcmVzdWx0Lm9iamVjdHMucHVzaChmb3JtYXRPYmpJbmZvKGNvbnRlbnQsIHsgSXNEZWxldGVNYXJrZXI6IHRydWUgfSkpXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmIChsaXN0VmVyc2lvbnNSZXN1bHQuTmV4dEtleU1hcmtlcikge1xuICAgICAgbmV4dFZlcnNpb25LZXlNYXJrZXIgPSBsaXN0VmVyc2lvbnNSZXN1bHQuTmV4dEtleU1hcmtlclxuICAgIH1cbiAgICBpZiAobGlzdFZlcnNpb25zUmVzdWx0Lk5leHRWZXJzaW9uSWRNYXJrZXIpIHtcbiAgICAgIHJlc3VsdC52ZXJzaW9uSWRNYXJrZXIgPSBsaXN0VmVyc2lvbnNSZXN1bHQuTmV4dFZlcnNpb25JZE1hcmtlclxuICAgIH1cbiAgICBwYXJzZUNvbW1vblByZWZpeGVzRW50aXR5KGxpc3RWZXJzaW9uc1Jlc3VsdC5Db21tb25QcmVmaXhlcylcbiAgfVxuXG4gIHJlc3VsdC5pc1RydW5jYXRlZCA9IGlzVHJ1bmNhdGVkXG4gIGlmIChpc1RydW5jYXRlZCkge1xuICAgIHJlc3VsdC5uZXh0TWFya2VyID0gbmV4dFZlcnNpb25LZXlNYXJrZXIgfHwgbmV4dE1hcmtlclxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuLy8gcGFyc2UgWE1MIHJlc3BvbnNlIGZvciBsaXN0IG9iamVjdHMgdjIgaW4gYSBidWNrZXRcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUxpc3RPYmplY3RzVjIoeG1sKSB7XG4gIHZhciByZXN1bHQgPSB7XG4gICAgb2JqZWN0czogW10sXG4gICAgaXNUcnVuY2F0ZWQ6IGZhbHNlLFxuICB9XG4gIHZhciB4bWxvYmogPSBwYXJzZVhtbCh4bWwpXG4gIGlmICgheG1sb2JqLkxpc3RCdWNrZXRSZXN1bHQpIHtcbiAgICB0aHJvdyBuZXcgZXJyb3JzLkludmFsaWRYTUxFcnJvcignTWlzc2luZyB0YWc6IFwiTGlzdEJ1Y2tldFJlc3VsdFwiJylcbiAgfVxuICB4bWxvYmogPSB4bWxvYmouTGlzdEJ1Y2tldFJlc3VsdFxuICBpZiAoeG1sb2JqLklzVHJ1bmNhdGVkKSB7XG4gICAgcmVzdWx0LmlzVHJ1bmNhdGVkID0geG1sb2JqLklzVHJ1bmNhdGVkXG4gIH1cbiAgaWYgKHhtbG9iai5OZXh0Q29udGludWF0aW9uVG9rZW4pIHtcbiAgICByZXN1bHQubmV4dENvbnRpbnVhdGlvblRva2VuID0geG1sb2JqLk5leHRDb250aW51YXRpb25Ub2tlblxuICB9XG4gIGlmICh4bWxvYmouQ29udGVudHMpIHtcbiAgICB0b0FycmF5KHhtbG9iai5Db250ZW50cykuZm9yRWFjaCgoY29udGVudCkgPT4ge1xuICAgICAgdmFyIG5hbWUgPSBzYW5pdGl6ZU9iamVjdEtleSh0b0FycmF5KGNvbnRlbnQuS2V5KVswXSlcbiAgICAgIHZhciBsYXN0TW9kaWZpZWQgPSBuZXcgRGF0ZShjb250ZW50Lkxhc3RNb2RpZmllZClcbiAgICAgIHZhciBldGFnID0gc2FuaXRpemVFVGFnKGNvbnRlbnQuRVRhZylcbiAgICAgIHZhciBzaXplID0gY29udGVudC5TaXplXG4gICAgICByZXN1bHQub2JqZWN0cy5wdXNoKHsgbmFtZSwgbGFzdE1vZGlmaWVkLCBldGFnLCBzaXplIH0pXG4gICAgfSlcbiAgfVxuICBpZiAoeG1sb2JqLkNvbW1vblByZWZpeGVzKSB7XG4gICAgdG9BcnJheSh4bWxvYmouQ29tbW9uUHJlZml4ZXMpLmZvckVhY2goKGNvbW1vblByZWZpeCkgPT4ge1xuICAgICAgcmVzdWx0Lm9iamVjdHMucHVzaCh7IHByZWZpeDogc2FuaXRpemVPYmplY3RLZXkodG9BcnJheShjb21tb25QcmVmaXguUHJlZml4KVswXSksIHNpemU6IDAgfSlcbiAgICB9KVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuLy8gcGFyc2UgWE1MIHJlc3BvbnNlIGZvciBsaXN0IG9iamVjdHMgdjIgd2l0aCBtZXRhZGF0YSBpbiBhIGJ1Y2tldFxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlTGlzdE9iamVjdHNWMldpdGhNZXRhZGF0YSh4bWwpIHtcbiAgdmFyIHJlc3VsdCA9IHtcbiAgICBvYmplY3RzOiBbXSxcbiAgICBpc1RydW5jYXRlZDogZmFsc2UsXG4gIH1cbiAgdmFyIHhtbG9iaiA9IHBhcnNlWG1sKHhtbClcbiAgaWYgKCF4bWxvYmouTGlzdEJ1Y2tldFJlc3VsdCkge1xuICAgIHRocm93IG5ldyBlcnJvcnMuSW52YWxpZFhNTEVycm9yKCdNaXNzaW5nIHRhZzogXCJMaXN0QnVja2V0UmVzdWx0XCInKVxuICB9XG4gIHhtbG9iaiA9IHhtbG9iai5MaXN0QnVja2V0UmVzdWx0XG4gIGlmICh4bWxvYmouSXNUcnVuY2F0ZWQpIHtcbiAgICByZXN1bHQuaXNUcnVuY2F0ZWQgPSB4bWxvYmouSXNUcnVuY2F0ZWRcbiAgfVxuICBpZiAoeG1sb2JqLk5leHRDb250aW51YXRpb25Ub2tlbikge1xuICAgIHJlc3VsdC5uZXh0Q29udGludWF0aW9uVG9rZW4gPSB4bWxvYmouTmV4dENvbnRpbnVhdGlvblRva2VuXG4gIH1cblxuICBpZiAoeG1sb2JqLkNvbnRlbnRzKSB7XG4gICAgdG9BcnJheSh4bWxvYmouQ29udGVudHMpLmZvckVhY2goKGNvbnRlbnQpID0+IHtcbiAgICAgIHZhciBuYW1lID0gc2FuaXRpemVPYmplY3RLZXkoY29udGVudC5LZXkpXG4gICAgICB2YXIgbGFzdE1vZGlmaWVkID0gbmV3IERhdGUoY29udGVudC5MYXN0TW9kaWZpZWQpXG4gICAgICB2YXIgZXRhZyA9IHNhbml0aXplRVRhZyhjb250ZW50LkVUYWcpXG4gICAgICB2YXIgc2l6ZSA9IGNvbnRlbnQuU2l6ZVxuICAgICAgdmFyIG1ldGFkYXRhXG4gICAgICBpZiAoY29udGVudC5Vc2VyTWV0YWRhdGEgIT0gbnVsbCkge1xuICAgICAgICBtZXRhZGF0YSA9IHRvQXJyYXkoY29udGVudC5Vc2VyTWV0YWRhdGEpWzBdXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZXRhZGF0YSA9IG51bGxcbiAgICAgIH1cbiAgICAgIHJlc3VsdC5vYmplY3RzLnB1c2goeyBuYW1lLCBsYXN0TW9kaWZpZWQsIGV0YWcsIHNpemUsIG1ldGFkYXRhIH0pXG4gICAgfSlcbiAgfVxuXG4gIGlmICh4bWxvYmouQ29tbW9uUHJlZml4ZXMpIHtcbiAgICB0b0FycmF5KHhtbG9iai5Db21tb25QcmVmaXhlcykuZm9yRWFjaCgoY29tbW9uUHJlZml4KSA9PiB7XG4gICAgICByZXN1bHQub2JqZWN0cy5wdXNoKHsgcHJlZml4OiBzYW5pdGl6ZU9iamVjdEtleSh0b0FycmF5KGNvbW1vblByZWZpeC5QcmVmaXgpWzBdKSwgc2l6ZTogMCB9KVxuICAgIH0pXG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VMaWZlY3ljbGVDb25maWcoeG1sKSB7XG4gIGNvbnN0IHhtbE9iaiA9IHBhcnNlWG1sKHhtbClcbiAgcmV0dXJuIHhtbE9iai5MaWZlY3ljbGVDb25maWd1cmF0aW9uXG59XG5leHBvcnQgZnVuY3Rpb24gcGFyc2VPYmplY3RSZXRlbnRpb25Db25maWcoeG1sKSB7XG4gIGNvbnN0IHhtbE9iaiA9IHBhcnNlWG1sKHhtbClcbiAgY29uc3QgcmV0ZW50aW9uQ29uZmlnID0geG1sT2JqLlJldGVudGlvblxuXG4gIHJldHVybiB7XG4gICAgbW9kZTogcmV0ZW50aW9uQ29uZmlnLk1vZGUsXG4gICAgcmV0YWluVW50aWxEYXRlOiByZXRlbnRpb25Db25maWcuUmV0YWluVW50aWxEYXRlLFxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUJ1Y2tldEVuY3J5cHRpb25Db25maWcoeG1sKSB7XG4gIGxldCBlbmNDb25maWcgPSBwYXJzZVhtbCh4bWwpXG4gIHJldHVybiBlbmNDb25maWdcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlT2JqZWN0TGVnYWxIb2xkQ29uZmlnKHhtbCkge1xuICBjb25zdCB4bWxPYmogPSBwYXJzZVhtbCh4bWwpXG4gIHJldHVybiB4bWxPYmouTGVnYWxIb2xkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1cGxvYWRQYXJ0UGFyc2VyKHhtbCkge1xuICBjb25zdCB4bWxPYmogPSBwYXJzZVhtbCh4bWwpXG4gIGNvbnN0IHJlc3BFbCA9IHhtbE9iai5Db3B5UGFydFJlc3VsdFxuICByZXR1cm4gcmVzcEVsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVPYmplY3RzUGFyc2VyKHhtbCkge1xuICBjb25zdCB4bWxPYmogPSBwYXJzZVhtbCh4bWwpXG4gIGlmICh4bWxPYmouRGVsZXRlUmVzdWx0ICYmIHhtbE9iai5EZWxldGVSZXN1bHQuRXJyb3IpIHtcbiAgICAvLyByZXR1cm4gZXJyb3JzIGFzIGFycmF5IGFsd2F5cy4gYXMgdGhlIHJlc3BvbnNlIGlzIG9iamVjdCBpbiBjYXNlIG9mIHNpbmdsZSBvYmplY3QgcGFzc2VkIGluIHJlbW92ZU9iamVjdHNcbiAgICByZXR1cm4gdG9BcnJheSh4bWxPYmouRGVsZXRlUmVzdWx0LkVycm9yKVxuICB9XG4gIHJldHVybiBbXVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTZWxlY3RPYmplY3RDb250ZW50UmVzcG9uc2UocmVzKSB7XG4gIC8vIGV4dHJhY3RIZWFkZXJUeXBlIGV4dHJhY3RzIHRoZSBmaXJzdCBoYWxmIG9mIHRoZSBoZWFkZXIgbWVzc2FnZSwgdGhlIGhlYWRlciB0eXBlLlxuICBmdW5jdGlvbiBleHRyYWN0SGVhZGVyVHlwZShzdHJlYW0pIHtcbiAgICBjb25zdCBoZWFkZXJOYW1lTGVuID0gQnVmZmVyLmZyb20oc3RyZWFtLnJlYWQoMSkpLnJlYWRVSW50OCgpXG4gICAgY29uc3QgaGVhZGVyTmFtZVdpdGhTZXBhcmF0b3IgPSBCdWZmZXIuZnJvbShzdHJlYW0ucmVhZChoZWFkZXJOYW1lTGVuKSkudG9TdHJpbmcoKVxuICAgIGNvbnN0IHNwbGl0QnlTZXBhcmF0b3IgPSAoaGVhZGVyTmFtZVdpdGhTZXBhcmF0b3IgfHwgJycpLnNwbGl0KCc6JylcbiAgICBjb25zdCBoZWFkZXJOYW1lID0gc3BsaXRCeVNlcGFyYXRvci5sZW5ndGggPj0gMSA/IHNwbGl0QnlTZXBhcmF0b3JbMV0gOiAnJ1xuICAgIHJldHVybiBoZWFkZXJOYW1lXG4gIH1cblxuICBmdW5jdGlvbiBleHRyYWN0SGVhZGVyVmFsdWUoc3RyZWFtKSB7XG4gICAgY29uc3QgYm9keUxlbiA9IEJ1ZmZlci5mcm9tKHN0cmVhbS5yZWFkKDIpKS5yZWFkVUludDE2QkUoKVxuICAgIGNvbnN0IGJvZHlOYW1lID0gQnVmZmVyLmZyb20oc3RyZWFtLnJlYWQoYm9keUxlbikpLnRvU3RyaW5nKClcbiAgICByZXR1cm4gYm9keU5hbWVcbiAgfVxuXG4gIGNvbnN0IHNlbGVjdFJlc3VsdHMgPSBuZXcgU2VsZWN0UmVzdWx0cyh7fSkgLy8gd2lsbCBiZSByZXR1cm5lZFxuXG4gIGNvbnN0IHJlc3BvbnNlU3RyZWFtID0gcmVhZGFibGVTdHJlYW0ocmVzKSAvLyBjb252ZXJ0IGJ5dGUgYXJyYXkgdG8gYSByZWFkYWJsZSByZXNwb25zZVN0cmVhbVxuICB3aGlsZSAocmVzcG9uc2VTdHJlYW0uX3JlYWRhYmxlU3RhdGUubGVuZ3RoKSB7XG4gICAgLy8gVG9wIGxldmVsIHJlc3BvbnNlU3RyZWFtIHJlYWQgdHJhY2tlci5cbiAgICBsZXQgbXNnQ3JjQWNjdW11bGF0b3IgLy8gYWNjdW11bGF0ZSBmcm9tIHN0YXJ0IG9mIHRoZSBtZXNzYWdlIHRpbGwgdGhlIG1lc3NhZ2UgY3JjIHN0YXJ0LlxuXG4gICAgY29uc3QgdG90YWxCeXRlTGVuZ3RoQnVmZmVyID0gQnVmZmVyLmZyb20ocmVzcG9uc2VTdHJlYW0ucmVhZCg0KSlcbiAgICBtc2dDcmNBY2N1bXVsYXRvciA9IGNyYzMyKHRvdGFsQnl0ZUxlbmd0aEJ1ZmZlcilcblxuICAgIGNvbnN0IGhlYWRlckJ5dGVzQnVmZmVyID0gQnVmZmVyLmZyb20ocmVzcG9uc2VTdHJlYW0ucmVhZCg0KSlcbiAgICBtc2dDcmNBY2N1bXVsYXRvciA9IGNyYzMyKGhlYWRlckJ5dGVzQnVmZmVyLCBtc2dDcmNBY2N1bXVsYXRvcilcblxuICAgIGNvbnN0IGNhbGN1bGF0ZWRQcmVsdWRlQ3JjID0gbXNnQ3JjQWNjdW11bGF0b3IucmVhZEludDMyQkUoKSAvLyB1c2UgaXQgdG8gY2hlY2sgaWYgYW55IENSQyBtaXNtYXRjaCBpbiBoZWFkZXIgaXRzZWxmLlxuXG4gICAgY29uc3QgcHJlbHVkZUNyY0J1ZmZlciA9IEJ1ZmZlci5mcm9tKHJlc3BvbnNlU3RyZWFtLnJlYWQoNCkpIC8vIHJlYWQgNCBieXRlcyAgICBpLmUgNCs0ID04ICsgNCA9IDEyICggcHJlbHVkZSArIHByZWx1ZGUgY3JjKVxuICAgIG1zZ0NyY0FjY3VtdWxhdG9yID0gY3JjMzIocHJlbHVkZUNyY0J1ZmZlciwgbXNnQ3JjQWNjdW11bGF0b3IpXG5cbiAgICBjb25zdCB0b3RhbE1zZ0xlbmd0aCA9IHRvdGFsQnl0ZUxlbmd0aEJ1ZmZlci5yZWFkSW50MzJCRSgpXG4gICAgY29uc3QgaGVhZGVyTGVuZ3RoID0gaGVhZGVyQnl0ZXNCdWZmZXIucmVhZEludDMyQkUoKVxuICAgIGNvbnN0IHByZWx1ZGVDcmNCeXRlVmFsdWUgPSBwcmVsdWRlQ3JjQnVmZmVyLnJlYWRJbnQzMkJFKClcblxuICAgIGlmIChwcmVsdWRlQ3JjQnl0ZVZhbHVlICE9PSBjYWxjdWxhdGVkUHJlbHVkZUNyYykge1xuICAgICAgLy8gSGFuZGxlIEhlYWRlciBDUkMgbWlzbWF0Y2ggRXJyb3JcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYEhlYWRlciBDaGVja3N1bSBNaXNtYXRjaCwgUHJlbHVkZSBDUkMgb2YgJHtwcmVsdWRlQ3JjQnl0ZVZhbHVlfSBkb2VzIG5vdCBlcXVhbCBleHBlY3RlZCBDUkMgb2YgJHtjYWxjdWxhdGVkUHJlbHVkZUNyY31gLFxuICAgICAgKVxuICAgIH1cblxuICAgIGNvbnN0IGhlYWRlcnMgPSB7fVxuICAgIGlmIChoZWFkZXJMZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBoZWFkZXJCeXRlcyA9IEJ1ZmZlci5mcm9tKHJlc3BvbnNlU3RyZWFtLnJlYWQoaGVhZGVyTGVuZ3RoKSlcbiAgICAgIG1zZ0NyY0FjY3VtdWxhdG9yID0gY3JjMzIoaGVhZGVyQnl0ZXMsIG1zZ0NyY0FjY3VtdWxhdG9yKVxuICAgICAgY29uc3QgaGVhZGVyUmVhZGVyU3RyZWFtID0gcmVhZGFibGVTdHJlYW0oaGVhZGVyQnl0ZXMpXG4gICAgICB3aGlsZSAoaGVhZGVyUmVhZGVyU3RyZWFtLl9yZWFkYWJsZVN0YXRlLmxlbmd0aCkge1xuICAgICAgICBsZXQgaGVhZGVyVHlwZU5hbWUgPSBleHRyYWN0SGVhZGVyVHlwZShoZWFkZXJSZWFkZXJTdHJlYW0pXG4gICAgICAgIGhlYWRlclJlYWRlclN0cmVhbS5yZWFkKDEpIC8vIGp1c3QgcmVhZCBhbmQgaWdub3JlIGl0LlxuICAgICAgICBoZWFkZXJzW2hlYWRlclR5cGVOYW1lXSA9IGV4dHJhY3RIZWFkZXJWYWx1ZShoZWFkZXJSZWFkZXJTdHJlYW0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IHBheWxvYWRTdHJlYW1cbiAgICBjb25zdCBwYXlMb2FkTGVuZ3RoID0gdG90YWxNc2dMZW5ndGggLSBoZWFkZXJMZW5ndGggLSAxNlxuICAgIGlmIChwYXlMb2FkTGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgcGF5TG9hZEJ1ZmZlciA9IEJ1ZmZlci5mcm9tKHJlc3BvbnNlU3RyZWFtLnJlYWQocGF5TG9hZExlbmd0aCkpXG4gICAgICBtc2dDcmNBY2N1bXVsYXRvciA9IGNyYzMyKHBheUxvYWRCdWZmZXIsIG1zZ0NyY0FjY3VtdWxhdG9yKVxuICAgICAgLy8gcmVhZCB0aGUgY2hlY2tzdW0gZWFybHkgYW5kIGRldGVjdCBhbnkgbWlzbWF0Y2ggc28gd2UgY2FuIGF2b2lkIHVubmVjZXNzYXJ5IGZ1cnRoZXIgcHJvY2Vzc2luZy5cbiAgICAgIGNvbnN0IG1lc3NhZ2VDcmNCeXRlVmFsdWUgPSBCdWZmZXIuZnJvbShyZXNwb25zZVN0cmVhbS5yZWFkKDQpKS5yZWFkSW50MzJCRSgpXG4gICAgICBjb25zdCBjYWxjdWxhdGVkQ3JjID0gbXNnQ3JjQWNjdW11bGF0b3IucmVhZEludDMyQkUoKVxuICAgICAgLy8gSGFuZGxlIG1lc3NhZ2UgQ1JDIEVycm9yXG4gICAgICBpZiAobWVzc2FnZUNyY0J5dGVWYWx1ZSAhPT0gY2FsY3VsYXRlZENyYykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYE1lc3NhZ2UgQ2hlY2tzdW0gTWlzbWF0Y2gsIE1lc3NhZ2UgQ1JDIG9mICR7bWVzc2FnZUNyY0J5dGVWYWx1ZX0gZG9lcyBub3QgZXF1YWwgZXhwZWN0ZWQgQ1JDIG9mICR7Y2FsY3VsYXRlZENyY31gLFxuICAgICAgICApXG4gICAgICB9XG4gICAgICBwYXlsb2FkU3RyZWFtID0gcmVhZGFibGVTdHJlYW0ocGF5TG9hZEJ1ZmZlcilcbiAgICB9XG5cbiAgICBjb25zdCBtZXNzYWdlVHlwZSA9IGhlYWRlcnNbJ21lc3NhZ2UtdHlwZSddXG5cbiAgICBzd2l0Y2ggKG1lc3NhZ2VUeXBlKSB7XG4gICAgICBjYXNlICdlcnJvcic6IHtcbiAgICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gaGVhZGVyc1snZXJyb3ItY29kZSddICsgJzpcIicgKyBoZWFkZXJzWydlcnJvci1tZXNzYWdlJ10gKyAnXCInXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvck1lc3NhZ2UpXG4gICAgICB9XG4gICAgICBjYXNlICdldmVudCc6IHtcbiAgICAgICAgY29uc3QgY29udGVudFR5cGUgPSBoZWFkZXJzWydjb250ZW50LXR5cGUnXVxuICAgICAgICBjb25zdCBldmVudFR5cGUgPSBoZWFkZXJzWydldmVudC10eXBlJ11cblxuICAgICAgICBzd2l0Y2ggKGV2ZW50VHlwZSkge1xuICAgICAgICAgIGNhc2UgJ0VuZCc6IHtcbiAgICAgICAgICAgIHNlbGVjdFJlc3VsdHMuc2V0UmVzcG9uc2UocmVzKVxuICAgICAgICAgICAgcmV0dXJuIHNlbGVjdFJlc3VsdHNcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjYXNlICdSZWNvcmRzJzoge1xuICAgICAgICAgICAgY29uc3QgcmVhZERhdGEgPSBwYXlsb2FkU3RyZWFtLnJlYWQocGF5TG9hZExlbmd0aClcbiAgICAgICAgICAgIHNlbGVjdFJlc3VsdHMuc2V0UmVjb3JkcyhyZWFkRGF0YSlcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY2FzZSAnUHJvZ3Jlc3MnOlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzd2l0Y2ggKGNvbnRlbnRUeXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAndGV4dC94bWwnOiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBwcm9ncmVzc0RhdGEgPSBwYXlsb2FkU3RyZWFtLnJlYWQocGF5TG9hZExlbmd0aClcbiAgICAgICAgICAgICAgICAgIHNlbGVjdFJlc3VsdHMuc2V0UHJvZ3Jlc3MocHJvZ3Jlc3NEYXRhLnRvU3RyaW5nKCkpXG4gICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBgVW5leHBlY3RlZCBjb250ZW50LXR5cGUgJHtjb250ZW50VHlwZX0gc2VudCBmb3IgZXZlbnQtdHlwZSBQcm9ncmVzc2BcbiAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvck1lc3NhZ2UpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgJ1N0YXRzJzpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3dpdGNoIChjb250ZW50VHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQveG1sJzoge1xuICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhdHNEYXRhID0gcGF5bG9hZFN0cmVhbS5yZWFkKHBheUxvYWRMZW5ndGgpXG4gICAgICAgICAgICAgICAgICBzZWxlY3RSZXN1bHRzLnNldFN0YXRzKHN0YXRzRGF0YS50b1N0cmluZygpKVxuICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgICAgICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gYFVuZXhwZWN0ZWQgY29udGVudC10eXBlICR7Y29udGVudFR5cGV9IHNlbnQgZm9yIGV2ZW50LXR5cGUgU3RhdHNgXG4gICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3JNZXNzYWdlKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICAvLyBDb250aW51YXRpb24gbWVzc2FnZTogTm90IHN1cmUgaWYgaXQgaXMgc3VwcG9ydGVkLiBkaWQgbm90IGZpbmQgYSByZWZlcmVuY2Ugb3IgYW55IG1lc3NhZ2UgaW4gcmVzcG9uc2UuXG4gICAgICAgICAgICAvLyBJdCBkb2VzIG5vdCBoYXZlIGEgcGF5bG9hZC5cbiAgICAgICAgICAgIGNvbnN0IHdhcm5pbmdNZXNzYWdlID0gYFVuIGltcGxlbWVudGVkIGV2ZW50IGRldGVjdGVkICAke21lc3NhZ2VUeXBlfS5gXG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgICAgICAgY29uc29sZS53YXJuKHdhcm5pbmdNZXNzYWdlKVxuICAgICAgICAgIH1cbiAgICAgICAgfSAvLyBldmVudFR5cGUgRW5kXG4gICAgICB9IC8vIEV2ZW50IEVuZFxuICAgIH0gLy8gbWVzc2FnZVR5cGUgRW5kXG4gIH0gLy8gVG9wIExldmVsIFN0cmVhbSBFbmRcbn1cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkEsSUFBQUEsVUFBQSxHQUFBQyxPQUFBO0FBQ0EsSUFBQUMsY0FBQSxHQUFBRCxPQUFBO0FBRUEsSUFBQUUsTUFBQSxHQUFBQyx1QkFBQSxDQUFBSCxPQUFBO0FBQ0EsSUFBQUksUUFBQSxHQUFBSixPQUFBO0FBQ0EsSUFBQUssT0FBQSxHQUFBTCxPQUFBO0FBUTZCLFNBQUFNLHlCQUFBQyxXQUFBLGVBQUFDLE9BQUEsa0NBQUFDLGlCQUFBLE9BQUFELE9BQUEsUUFBQUUsZ0JBQUEsT0FBQUYsT0FBQSxZQUFBRix3QkFBQSxZQUFBQSxDQUFBQyxXQUFBLFdBQUFBLFdBQUEsR0FBQUcsZ0JBQUEsR0FBQUQsaUJBQUEsS0FBQUYsV0FBQTtBQUFBLFNBQUFKLHdCQUFBUSxHQUFBLEVBQUFKLFdBQUEsU0FBQUEsV0FBQSxJQUFBSSxHQUFBLElBQUFBLEdBQUEsQ0FBQUMsVUFBQSxXQUFBRCxHQUFBLFFBQUFBLEdBQUEsb0JBQUFBLEdBQUEsd0JBQUFBLEdBQUEsNEJBQUFFLE9BQUEsRUFBQUYsR0FBQSxVQUFBRyxLQUFBLEdB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