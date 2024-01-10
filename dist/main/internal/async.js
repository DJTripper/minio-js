"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var fs = _interopRequireWildcard(require("fs"), true);
var stream = _interopRequireWildcard(require("stream"), true);
var _util = require("util");
var _nodeFs = require("fs");
exports.fsp = _nodeFs.promises;
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
// promise helper for stdlib

// TODO: use "node:fs/promise" directly after we stop testing on nodejs 12

const streamPromise = {
  // node:stream/promises Added in: v15.0.0
  pipeline: (0, _util.promisify)(stream.pipeline)
};
exports.streamPromise = streamPromise;
const fstat = (0, _util.promisify)(fs.fstat);
exports.fstat = fstat;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmcyIsIl9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkIiwicmVxdWlyZSIsInN0cmVhbSIsIl91dGlsIiwiX25vZGVGcyIsImV4cG9ydHMiLCJmc3AiLCJwcm9taXNlcyIsIl9nZXRSZXF1aXJlV2lsZGNhcmRDYWNoZSIsIm5vZGVJbnRlcm9wIiwiV2Vha01hcCIsImNhY2hlQmFiZWxJbnRlcm9wIiwiY2FjaGVOb2RlSW50ZXJvcCIsIm9iaiIsIl9fZXNNb2R1bGUiLCJkZWZhdWx0IiwiY2FjaGUiLCJoYXMiLCJnZXQiLCJuZXdPYmoiLCJoYXNQcm9wZXJ0eURlc2NyaXB0b3IiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImdldE93blByb3BlcnR5RGVzY3JpcHRvciIsImtleSIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiY2FsbCIsImRlc2MiLCJzZXQiLCJzdHJlYW1Qcm9taXNlIiwicGlwZWxpbmUiLCJwcm9taXNpZnkiLCJmc3RhdCJdLCJzb3VyY2VzIjpbImFzeW5jLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHByb21pc2UgaGVscGVyIGZvciBzdGRsaWJcblxuaW1wb3J0ICogYXMgZnMgZnJvbSAnbm9kZTpmcydcbmltcG9ydCAqIGFzIHN0cmVhbSBmcm9tICdub2RlOnN0cmVhbSdcbmltcG9ydCB7IHByb21pc2lmeSB9IGZyb20gJ25vZGU6dXRpbCdcblxuLy8gVE9ETzogdXNlIFwibm9kZTpmcy9wcm9taXNlXCIgZGlyZWN0bHkgYWZ0ZXIgd2Ugc3RvcCB0ZXN0aW5nIG9uIG5vZGVqcyAxMlxuZXhwb3J0IHsgcHJvbWlzZXMgYXMgZnNwIH0gZnJvbSAnbm9kZTpmcydcbmV4cG9ydCBjb25zdCBzdHJlYW1Qcm9taXNlID0ge1xuICAvLyBub2RlOnN0cmVhbS9wcm9taXNlcyBBZGRlZCBpbjogdjE1LjAuMFxuICBwaXBlbGluZTogcHJvbWlzaWZ5KHN0cmVhbS5waXBlbGluZSksXG59XG5cbmV4cG9ydCBjb25zdCBmc3RhdCA9IHByb21pc2lmeShmcy5mc3RhdClcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFFQSxJQUFBQSxFQUFBLEdBQUFDLHVCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxNQUFBLEdBQUFGLHVCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxLQUFBLEdBQUFGLE9BQUE7QUFHQSxJQUFBRyxPQUFBLEdBQUFILE9BQUE7QUFBeUNJLE9BQUEsQ0FBQUMsR0FBQSxHQUFBRixPQUFBLENBQUFHLFFBQUE7QUFBQSxTQUFBQyx5QkFBQUMsV0FBQSxlQUFBQyxPQUFBLGtDQUFBQyxpQkFBQSxPQUFBRCxPQUFBLFFBQUFFLGdCQUFBLE9BQUFGLE9BQUEsWUFBQUYsd0JBQUEsWUFBQUEsQ0FBQUMsV0FBQSxXQUFBQSxXQUFBLEdBQUFHLGdCQUFBLEdBQUFELGlCQUFBLEtBQUFGLFdBQUE7QUFBQSxTQUFBVCx3QkFBQWEsR0FBQSxFQUFBSixXQUFBLFNBQUFBLFdBQUEsSUFBQUksR0FBQSxJQUFBQSxHQUFBLENBQUFDLFVBQUEsV0FBQUQsR0FBQSxRQUFBQSxHQUFBLG9CQUFBQSxHQUFBLHdCQUFBQSxHQUFBLDRCQUFBRSxPQUFBLEVBQUFGLEdBQUEsVUFBQUcsS0FBQSxHQUFBUix3QkFBQSxDQUFBQyxXQUFBLE9BQUFPLEtBQUEsSUFBQUEsS0FBQSxDQUFBQyxHQUFBLENBQUFKLEdBQUEsWUFBQUcsS0FBQSxDQUFBRSxHQUFBLENBQUFMLEdBQUEsU0FBQU0sTUFBQSxXQUFBQyxxQkFBQSxHQUFBQyxNQUFBLENBQUFDLGNBQUEsSUFBQUQsTUFBQSxDQUFBRSx3QkFBQSxXQUFBQyxHQUFBLElBQUFYLEdBQUEsUUFBQVcsR0FBQSxrQkFBQUgsTUFBQSxDQUFBSSxTQUFBLENBQUFDLGNBQUEsQ0FBQUMsSUFBQSxDQUFBZCxHQUFBLEVBQUFXLEdBQUEsU0FBQUksSUFBQSxHQUFBUixxQkFBQSxHQUFBQyxNQUFBLENBQUFFLHdCQUFBLENBQUFWLEdBQUEsRUFBQVcsR0FBQSxjQUFBSSxJQUFBLEtBQUFBLElBQUEsQ0FBQVYsR0FBQSxJQUFBVSxJQUFBLENBQUFDLEdBQUEsS0FBQVIsTUFBQSxDQUFBQyxjQUFBLENBQUFILE1BQUEsRUFBQUssR0FBQSxFQUFBSSxJQUFBLFlBQUFULE1BQUEsQ0FBQUssR0FBQSxJQUFBWCxHQUFBLENBQUFXLEdBQUEsU0FBQUwsTUFBQSxDQUFBSixPQUFBLEdBQUFGLEdBQUEsTUFBQUcsS0FBQSxJQUFBQSxLQUFBLENBQUFhLEdBQUEsQ0FBQWhCLEdBQUEsRUFBQU0sTUFBQSxZQUFBQSxNQUFBO0FBUHpDOztBQU1BOztBQUVPLE1BQU1XLGFBQWEsR0FBRztFQUMzQjtFQUNBQyxRQUFRLEVBQUUsSUFBQUMsZUFBUyxFQUFDOUIsTUFBTSxDQUFDNkIsUUFBUTtBQUNyQyxDQUFDO0FBQUExQixPQUFBLENBQUF5QixhQUFBLEdBQUFBLGFBQUE7QUFFTSxNQUFNRyxLQUFLLEdBQUcsSUFBQUQsZUFBUyxFQUFDakMsRUFBRSxDQUFDa0MsS0FBSyxDQUFDO0FBQUE1QixPQUFBLENBQUE0QixLQUFBLEdBQUFBLEtBQUEifQ==