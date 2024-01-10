"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.request = request;
var _stream = require("stream");
async function request(transport, opt, body = null) {
  return new Promise((resolve, reject) => {
    const requestObj = transport.request(opt, resp => {
      resolve(resp);
    });
    if (!body || Buffer.isBuffer(body) || typeof body === 'string') {
      requestObj.on('error', e => {
        reject(e);
      }).end(body);
      return;
    }

    // pump readable stream
    (0, _stream.pipeline)(body, requestObj, err => {
      if (err) {
        reject(err);
      }
    });
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfc3RyZWFtIiwicmVxdWlyZSIsInJlcXVlc3QiLCJ0cmFuc3BvcnQiLCJvcHQiLCJib2R5IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJyZXF1ZXN0T2JqIiwicmVzcCIsIkJ1ZmZlciIsImlzQnVmZmVyIiwib24iLCJlIiwiZW5kIiwicGlwZWxpbmUiLCJlcnIiXSwic291cmNlcyI6WyJyZXF1ZXN0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlICogYXMgaHR0cCBmcm9tICdub2RlOmh0dHAnXG5pbXBvcnQgdHlwZSAqIGFzIGh0dHBzIGZyb20gJ25vZGU6aHR0cHMnXG5pbXBvcnQgdHlwZSAqIGFzIHN0cmVhbSBmcm9tICdub2RlOnN0cmVhbSdcbmltcG9ydCB7IHBpcGVsaW5lIH0gZnJvbSAnbm9kZTpzdHJlYW0nXG5cbmltcG9ydCB0eXBlIHsgVHJhbnNwb3J0IH0gZnJvbSAnLi90eXBlLnRzJ1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVxdWVzdChcbiAgdHJhbnNwb3J0OiBUcmFuc3BvcnQsXG4gIG9wdDogaHR0cHMuUmVxdWVzdE9wdGlvbnMsXG4gIGJvZHk6IEJ1ZmZlciB8IHN0cmluZyB8IHN0cmVhbS5SZWFkYWJsZSB8IG51bGwgPSBudWxsLFxuKTogUHJvbWlzZTxodHRwLkluY29taW5nTWVzc2FnZT4ge1xuICByZXR1cm4gbmV3IFByb21pc2U8aHR0cC5JbmNvbWluZ01lc3NhZ2U+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCByZXF1ZXN0T2JqID0gdHJhbnNwb3J0LnJlcXVlc3Qob3B0LCAocmVzcCkgPT4ge1xuICAgICAgcmVzb2x2ZShyZXNwKVxuICAgIH0pXG5cbiAgICBpZiAoIWJvZHkgfHwgQnVmZmVyLmlzQnVmZmVyKGJvZHkpIHx8IHR5cGVvZiBib2R5ID09PSAnc3RyaW5nJykge1xuICAgICAgcmVxdWVzdE9ialxuICAgICAgICAub24oJ2Vycm9yJywgKGU6IHVua25vd24pID0+IHtcbiAgICAgICAgICByZWplY3QoZSlcbiAgICAgICAgfSlcbiAgICAgICAgLmVuZChib2R5KVxuXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyBwdW1wIHJlYWRhYmxlIHN0cmVhbVxuICAgIHBpcGVsaW5lKGJvZHksIHJlcXVlc3RPYmosIChlcnIpID0+IHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgcmVqZWN0KGVycilcbiAgICAgIH1cbiAgICB9KVxuICB9KVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFHQSxJQUFBQSxPQUFBLEdBQUFDLE9BQUE7QUFJTyxlQUFlQyxPQUFPQSxDQUMzQkMsU0FBb0IsRUFDcEJDLEdBQXlCLEVBQ3pCQyxJQUE4QyxHQUFHLElBQUksRUFDdEI7RUFDL0IsT0FBTyxJQUFJQyxPQUFPLENBQXVCLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO0lBQzVELE1BQU1DLFVBQVUsR0FBR04sU0FBUyxDQUFDRCxPQUFPLENBQUNFLEdBQUcsRUFBR00sSUFBSSxJQUFLO01BQ2xESCxPQUFPLENBQUNHLElBQUksQ0FBQztJQUNmLENBQUMsQ0FBQztJQUVGLElBQUksQ0FBQ0wsSUFBSSxJQUFJTSxNQUFNLENBQUNDLFFBQVEsQ0FBQ1AsSUFBSSxDQUFDLElBQUksT0FBT0EsSUFBSSxLQUFLLFFBQVEsRUFBRTtNQUM5REksVUFBVSxDQUNQSSxFQUFFLENBQUMsT0FBTyxFQUFHQyxDQUFVLElBQUs7UUFDM0JOLE1BQU0sQ0FBQ00sQ0FBQyxDQUFDO01BQ1gsQ0FBQyxDQUFDLENBQ0RDLEdBQUcsQ0FBQ1YsSUFBSSxDQUFDO01BRVo7SUFDRjs7SUFFQTtJQUNBLElBQUFXLGdCQUFRLEVBQUNYLElBQUksRUFBRUksVUFBVSxFQUFHUSxHQUFHLElBQUs7TUFDbEMsSUFBSUEsR0FBRyxFQUFFO1FBQ1BULE1BQU0sQ0FBQ1MsR0FBRyxDQUFDO01BQ2I7SUFDRixDQUFDLENBQUM7RUFDSixDQUFDLENBQUM7QUFDSiJ9