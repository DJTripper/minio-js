// nodejs IncomingHttpHeaders is Record<string, string | string[]>, but it's actually this:

export let ENCRYPTION_TYPES = /*#__PURE__*/function (ENCRYPTION_TYPES) {
  ENCRYPTION_TYPES["SSEC"] = "SSE-C";
  ENCRYPTION_TYPES["KMS"] = "KMS";
  return ENCRYPTION_TYPES;
}({});
export let RETENTION_MODES = /*#__PURE__*/function (RETENTION_MODES) {
  RETENTION_MODES["GOVERNANCE"] = "GOVERNANCE";
  RETENTION_MODES["COMPLIANCE"] = "COMPLIANCE";
  return RETENTION_MODES;
}({});
export let RETENTION_VALIDITY_UNITS = /*#__PURE__*/function (RETENTION_VALIDITY_UNITS) {
  RETENTION_VALIDITY_UNITS["DAYS"] = "Days";
  RETENTION_VALIDITY_UNITS["YEARS"] = "Years";
  return RETENTION_VALIDITY_UNITS;
}({});
export let LEGAL_HOLD_STATUS = /*#__PURE__*/function (LEGAL_HOLD_STATUS) {
  LEGAL_HOLD_STATUS["ENABLED"] = "ON";
  LEGAL_HOLD_STATUS["DISABLED"] = "OFF";
  return LEGAL_HOLD_STATUS;
}({});

/* Replication Config types */

/* Replication Config types */

/**
 * @deprecated keep for backward compatible, use `LEGAL_HOLD_STATUS` instead
 */
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJFTkNSWVBUSU9OX1RZUEVTIiwiUkVURU5USU9OX01PREVTIiwiUkVURU5USU9OX1ZBTElESVRZX1VOSVRTIiwiTEVHQUxfSE9MRF9TVEFUVVMiXSwic291cmNlcyI6WyJ0eXBlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlICogYXMgaHR0cCBmcm9tICdub2RlOmh0dHAnXG5pbXBvcnQgdHlwZSB7IFJlYWRhYmxlIGFzIFJlYWRhYmxlU3RyZWFtIH0gZnJvbSAnbm9kZTpzdHJlYW0nXG5cbmV4cG9ydCB0eXBlIFZlcnNpb25JZGVudGlmaWNhdG9yID0ge1xuICB2ZXJzaW9uSWQ/OiBzdHJpbmdcbn1cblxuZXhwb3J0IHR5cGUgQmluYXJ5ID0gc3RyaW5nIHwgQnVmZmVyXG5cbi8vIG5vZGVqcyBJbmNvbWluZ0h0dHBIZWFkZXJzIGlzIFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IHN0cmluZ1tdPiwgYnV0IGl0J3MgYWN0dWFsbHkgdGhpczpcbmV4cG9ydCB0eXBlIFJlc3BvbnNlSGVhZGVyID0gUmVjb3JkPHN0cmluZywgc3RyaW5nPlxuXG5leHBvcnQgdHlwZSBPYmplY3RNZXRhRGF0YSA9IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IG51bWJlcj5cblxuZXhwb3J0IHR5cGUgUmVxdWVzdEhlYWRlcnMgPSBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCBib29sZWFuIHwgbnVtYmVyIHwgdW5kZWZpbmVkPlxuXG5leHBvcnQgdHlwZSBFbmNyeXB0aW9uID1cbiAgfCB7XG4gICAgICB0eXBlOiBFTkNSWVBUSU9OX1RZUEVTLlNTRUNcbiAgICB9XG4gIHwge1xuICAgICAgdHlwZTogRU5DUllQVElPTl9UWVBFUy5LTVNcbiAgICAgIFNTRUFsZ29yaXRobT86IHN0cmluZ1xuICAgICAgS01TTWFzdGVyS2V5SUQ/OiBzdHJpbmdcbiAgICB9XG5cbmV4cG9ydCB0eXBlIEVuYWJsZWRPckRpc2FibGVkU3RhdHVzID0gJ0VuYWJsZWQnIHwgJ0Rpc2FibGVkJ1xuZXhwb3J0IGVudW0gRU5DUllQVElPTl9UWVBFUyB7XG4gIC8qKlxuICAgKiBTU0VDIHJlcHJlc2VudHMgc2VydmVyLXNpZGUtZW5jcnlwdGlvbiB3aXRoIGN1c3RvbWVyIHByb3ZpZGVkIGtleXNcbiAgICovXG4gIFNTRUMgPSAnU1NFLUMnLFxuICAvKipcbiAgICogS01TIHJlcHJlc2VudHMgc2VydmVyLXNpZGUtZW5jcnlwdGlvbiB3aXRoIG1hbmFnZWQga2V5c1xuICAgKi9cbiAgS01TID0gJ0tNUycsXG59XG5cbmV4cG9ydCBlbnVtIFJFVEVOVElPTl9NT0RFUyB7XG4gIEdPVkVSTkFOQ0UgPSAnR09WRVJOQU5DRScsXG4gIENPTVBMSUFOQ0UgPSAnQ09NUExJQU5DRScsXG59XG5cbmV4cG9ydCBlbnVtIFJFVEVOVElPTl9WQUxJRElUWV9VTklUUyB7XG4gIERBWVMgPSAnRGF5cycsXG4gIFlFQVJTID0gJ1llYXJzJyxcbn1cblxuZXhwb3J0IGVudW0gTEVHQUxfSE9MRF9TVEFUVVMge1xuICBFTkFCTEVEID0gJ09OJyxcbiAgRElTQUJMRUQgPSAnT0ZGJyxcbn1cblxuZXhwb3J0IHR5cGUgVHJhbnNwb3J0ID0gUGljazx0eXBlb2YgaHR0cCwgJ3JlcXVlc3QnPlxuXG5leHBvcnQgaW50ZXJmYWNlIElSZXF1ZXN0IHtcbiAgcHJvdG9jb2w6IHN0cmluZ1xuICBwb3J0PzogbnVtYmVyIHwgc3RyaW5nXG4gIG1ldGhvZDogc3RyaW5nXG4gIHBhdGg6IHN0cmluZ1xuICBoZWFkZXJzOiBSZXF1ZXN0SGVhZGVyc1xufVxuXG5leHBvcnQgdHlwZSBJQ2Fub25pY2FsUmVxdWVzdCA9IHN0cmluZ1xuXG5leHBvcnQgaW50ZXJmYWNlIEluY29tcGxldGVVcGxvYWRlZEJ1Y2tldEl0ZW0ge1xuICBrZXk6IHN0cmluZ1xuICB1cGxvYWRJZDogc3RyaW5nXG4gIHNpemU6IG51bWJlclxufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1ldGFkYXRhSXRlbSB7XG4gIEtleTogc3RyaW5nXG4gIFZhbHVlOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJdGVtQnVja2V0TWV0YWRhdGFMaXN0IHtcbiAgSXRlbXM6IE1ldGFkYXRhSXRlbVtdXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSXRlbUJ1Y2tldE1ldGFkYXRhIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgW2tleTogc3RyaW5nXTogYW55XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQnVja2V0SXRlbUZyb21MaXN0IHtcbiAgbmFtZTogc3RyaW5nXG4gIGNyZWF0aW9uRGF0ZTogRGF0ZVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJ1Y2tldEl0ZW1Db3B5IHtcbiAgZXRhZzogc3RyaW5nXG4gIGxhc3RNb2RpZmllZDogRGF0ZVxufVxuXG5leHBvcnQgdHlwZSBCdWNrZXRJdGVtID1cbiAgfCB7XG4gICAgICBuYW1lOiBzdHJpbmdcbiAgICAgIHNpemU6IG51bWJlclxuICAgICAgZXRhZzogc3RyaW5nXG4gICAgICBwcmVmaXg/OiBuZXZlclxuICAgICAgbGFzdE1vZGlmaWVkOiBEYXRlXG4gICAgfVxuICB8IHtcbiAgICAgIG5hbWU/OiBuZXZlclxuICAgICAgZXRhZz86IG5ldmVyXG4gICAgICBsYXN0TW9kaWZpZWQ/OiBuZXZlclxuICAgICAgcHJlZml4OiBzdHJpbmdcbiAgICAgIHNpemU6IDBcbiAgICB9XG5cbmV4cG9ydCB0eXBlIEJ1Y2tldEl0ZW1XaXRoTWV0YWRhdGEgPSBCdWNrZXRJdGVtICYge1xuICBtZXRhZGF0YT86IEl0ZW1CdWNrZXRNZXRhZGF0YSB8IEl0ZW1CdWNrZXRNZXRhZGF0YUxpc3Rcbn1cblxuZXhwb3J0IGludGVyZmFjZSBCdWNrZXRTdHJlYW08VD4gZXh0ZW5kcyBSZWFkYWJsZVN0cmVhbSB7XG4gIG9uKGV2ZW50OiAnZGF0YScsIGxpc3RlbmVyOiAoaXRlbTogVCkgPT4gdm9pZCk6IHRoaXNcblxuICBvbihldmVudDogJ2VuZCcgfCAncGF1c2UnIHwgJ3JlYWRhYmxlJyB8ICdyZXN1bWUnIHwgJ2Nsb3NlJywgbGlzdGVuZXI6ICgpID0+IHZvaWQpOiB0aGlzXG5cbiAgb24oZXZlbnQ6ICdlcnJvcicsIGxpc3RlbmVyOiAoZXJyOiBFcnJvcikgPT4gdm9pZCk6IHRoaXNcblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICBvbihldmVudDogc3RyaW5nIHwgc3ltYm9sLCBsaXN0ZW5lcjogKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkKTogdGhpc1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJ1Y2tldEl0ZW1TdGF0IHtcbiAgc2l6ZTogbnVtYmVyXG4gIGV0YWc6IHN0cmluZ1xuICBsYXN0TW9kaWZpZWQ6IERhdGVcbiAgbWV0YURhdGE6IEl0ZW1CdWNrZXRNZXRhZGF0YVxuICB2ZXJzaW9uSWQ/OiBzdHJpbmcgfCBudWxsXG59XG5cbmV4cG9ydCB0eXBlIFN0YXRPYmplY3RPcHRzID0ge1xuICB2ZXJzaW9uSWQ/OiBzdHJpbmdcbn1cblxuLyogUmVwbGljYXRpb24gQ29uZmlnIHR5cGVzICovXG5leHBvcnQgdHlwZSBSZXBsaWNhdGlvblJ1bGVTdGF0dXMgPSB7XG4gIFN0YXR1czogRW5hYmxlZE9yRGlzYWJsZWRTdGF0dXNcbn1cblxuZXhwb3J0IHR5cGUgVGFnID0ge1xuICBLZXk6IHN0cmluZ1xuICBWYWx1ZTogc3RyaW5nXG59XG5cbmV4cG9ydCB0eXBlIFJlcGxpY2F0aW9uUnVsZURlc3RpbmF0aW9uID0ge1xuICBCdWNrZXQ6IHN0cmluZ1xuICBTdG9yYWdlQ2xhc3M6IHN0cmluZ1xufVxuZXhwb3J0IHR5cGUgUmVwbGljYXRpb25SdWxlQW5kID0ge1xuICBQcmVmaXg6IHN0cmluZ1xuICBUYWdzOiBUYWdbXVxufVxuXG5leHBvcnQgdHlwZSBSZXBsaWNhdGlvblJ1bGVGaWx0ZXIgPSB7XG4gIFByZWZpeDogc3RyaW5nXG4gIEFuZDogUmVwbGljYXRpb25SdWxlQW5kXG4gIFRhZzogVGFnXG59XG5cbmV4cG9ydCB0eXBlIFJlcGxpY2FNb2RpZmljYXRpb25zID0ge1xuICBTdGF0dXM6IFJlcGxpY2F0aW9uUnVsZVN0YXR1c1xufVxuXG5leHBvcnQgdHlwZSBTb3VyY2VTZWxlY3Rpb25Dcml0ZXJpYSA9IHtcbiAgUmVwbGljYU1vZGlmaWNhdGlvbnM6IFJlcGxpY2FNb2RpZmljYXRpb25zXG59XG5cbmV4cG9ydCB0eXBlIEV4aXN0aW5nT2JqZWN0UmVwbGljYXRpb24gPSB7XG4gIFN0YXR1czogUmVwbGljYXRpb25SdWxlU3RhdHVzXG59XG5cbmV4cG9ydCB0eXBlIFJlcGxpY2F0aW9uUnVsZSA9IHtcbiAgSUQ6IHN0cmluZ1xuICBTdGF0dXM6IFJlcGxpY2F0aW9uUnVsZVN0YXR1c1xuICBQcmlvcml0eTogbnVtYmVyXG4gIERlbGV0ZU1hcmtlclJlcGxpY2F0aW9uOiBSZXBsaWNhdGlvblJ1bGVTdGF0dXMgLy8gc2hvdWxkIGJlIHNldCB0byBcIkRpc2FibGVkXCIgYnkgZGVmYXVsdFxuICBEZWxldGVSZXBsaWNhdGlvbjogUmVwbGljYXRpb25SdWxlU3RhdHVzXG4gIERlc3RpbmF0aW9uOiBSZXBsaWNhdGlvblJ1bGVEZXN0aW5hdGlvblxuICBGaWx0ZXI6IFJlcGxpY2F0aW9uUnVsZUZpbHRlclxuICBTb3VyY2VTZWxlY3Rpb25Dcml0ZXJpYTogU291cmNlU2VsZWN0aW9uQ3JpdGVyaWFcbiAgRXhpc3RpbmdPYmplY3RSZXBsaWNhdGlvbjogRXhpc3RpbmdPYmplY3RSZXBsaWNhdGlvblxufVxuXG5leHBvcnQgdHlwZSBSZXBsaWNhdGlvbkNvbmZpZ09wdHMgPSB7XG4gIHJvbGU6IHN0cmluZ1xuICBydWxlczogUmVwbGljYXRpb25SdWxlW11cbn1cblxuZXhwb3J0IHR5cGUgUmVwbGljYXRpb25Db25maWcgPSB7XG4gIFJlcGxpY2F0aW9uQ29uZmlndXJhdGlvbjogUmVwbGljYXRpb25Db25maWdPcHRzXG59XG4vKiBSZXBsaWNhdGlvbiBDb25maWcgdHlwZXMgKi9cblxuZXhwb3J0IHR5cGUgUmVzdWx0Q2FsbGJhY2s8VD4gPSAoZXJyb3I6IEVycm9yIHwgbnVsbCwgcmVzdWx0OiBUKSA9PiB2b2lkXG5cbmV4cG9ydCB0eXBlIEdldE9iamVjdExlZ2FsSG9sZE9wdGlvbnMgPSB7XG4gIHZlcnNpb25JZDogc3RyaW5nXG59XG4vKipcbiAqIEBkZXByZWNhdGVkIGtlZXAgZm9yIGJhY2t3YXJkIGNvbXBhdGlibGUsIHVzZSBgTEVHQUxfSE9MRF9TVEFUVVNgIGluc3RlYWRcbiAqL1xuZXhwb3J0IHR5cGUgTGVnYWxIb2xkU3RhdHVzID0gTEVHQUxfSE9MRF9TVEFUVVNcblxuZXhwb3J0IHR5cGUgUHV0T2JqZWN0TGVnYWxIb2xkT3B0aW9ucyA9IHtcbiAgdmVyc2lvbklkPzogc3RyaW5nXG4gIHN0YXR1czogTEVHQUxfSE9MRF9TVEFUVVNcbn1cblxuZXhwb3J0IGludGVyZmFjZSBVcGxvYWRlZE9iamVjdEluZm8ge1xuICBldGFnOiBzdHJpbmdcbiAgdmVyc2lvbklkOiBzdHJpbmcgfCBudWxsXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmV0ZW50aW9uT3B0aW9ucyB7XG4gIHZlcnNpb25JZDogc3RyaW5nXG4gIG1vZGU/OiBSRVRFTlRJT05fTU9ERVNcbiAgcmV0YWluVW50aWxEYXRlPzogSXNvRGF0ZVxuICBnb3Zlcm5hbmNlQnlwYXNzPzogYm9vbGVhblxufVxuZXhwb3J0IHR5cGUgUmV0ZW50aW9uID0gUmV0ZW50aW9uT3B0aW9ucyB8IEVtcHR5T2JqZWN0XG5leHBvcnQgdHlwZSBJc29EYXRlID0gc3RyaW5nXG5leHBvcnQgdHlwZSBFbXB0eU9iamVjdCA9IFJlY29yZDxzdHJpbmcsIG5ldmVyPlxuXG5leHBvcnQgdHlwZSBPYmplY3RMb2NrSW5mbyA9XG4gIHwge1xuICAgICAgb2JqZWN0TG9ja0VuYWJsZWQ6IEVuYWJsZWRPckRpc2FibGVkU3RhdHVzXG4gICAgICBtb2RlOiBSRVRFTlRJT05fTU9ERVNcbiAgICAgIHVuaXQ6IFJFVEVOVElPTl9WQUxJRElUWV9VTklUU1xuICAgICAgdmFsaWRpdHk6IG51bWJlclxuICAgIH1cbiAgfCBFbXB0eU9iamVjdFxuXG5leHBvcnQgdHlwZSBPYmplY3RMb2NrQ29uZmlnUGFyYW0gPSB7XG4gIE9iamVjdExvY2tFbmFibGVkPzogJ0VuYWJsZWQnIHwgdW5kZWZpbmVkXG4gIFJ1bGU/OlxuICAgIHwge1xuICAgICAgICBEZWZhdWx0UmV0ZW50aW9uOlxuICAgICAgICAgIHwge1xuICAgICAgICAgICAgICBNb2RlOiBSRVRFTlRJT05fTU9ERVNcbiAgICAgICAgICAgICAgRGF5czogbnVtYmVyXG4gICAgICAgICAgICAgIFllYXJzOiBudW1iZXJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB8IEVtcHR5T2JqZWN0XG4gICAgICB9XG4gICAgfCBFbXB0eU9iamVjdFxufVxuXG5leHBvcnQgdHlwZSBWZXJzaW9uaW5nRW5hYmxlZCA9ICdFbmFibGVkJ1xuZXhwb3J0IHR5cGUgVmVyc2lvbmluZ1N1c3BlbmRlZCA9ICdTdXNwZW5kZWQnXG5cbmV4cG9ydCB0eXBlIEJ1Y2tldFZlcnNpb25pbmdDb25maWd1cmF0aW9uID0ge1xuICBTdGF0dXM6IFZlcnNpb25pbmdFbmFibGVkIHwgVmVyc2lvbmluZ1N1c3BlbmRlZFxuICAvLyBUT0RPIGFkZCBFeGNsdWRlZFByZWZpeGVzLCBFeGNsdWRlRm9sZGVycyB3aGljaCBhcmUgIHBhcnQgb2YgTWluSU8ncyBleHRlbnNpb24sIGFzIGFuIGVuaGFuY2VtZW50LlxufVxuIl0sIm1hcHBpbmdzIjoiQUFTQTs7QUFrQkEsV0FBWUEsZ0JBQWdCLDBCQUFoQkEsZ0JBQWdCO0VBQWhCQSxnQkFBZ0I7RUFBaEJBLGdCQUFnQjtFQUFBLE9BQWhCQSxnQkFBZ0I7QUFBQTtBQVc1QixXQUFZQyxlQUFlLDBCQUFmQSxlQUFlO0VBQWZBLGVBQWU7RUFBZkEsZUFBZTtFQUFBLE9BQWZBLGVBQWU7QUFBQTtBQUszQixXQUFZQyx3QkFBd0IsMEJBQXhCQSx3QkFBd0I7RUFBeEJBLHdCQUF3QjtFQUF4QkEsd0JBQXdCO0VBQUEsT0FBeEJBLHdCQUF3QjtBQUFBO0FBS3BDLFdBQVlDLGlCQUFpQiwwQkFBakJBLGlCQUFpQjtFQUFqQkEsaUJBQWlCO0VBQWpCQSxpQkFBaUI7RUFBQSxPQUFqQkEsaUJBQWlCO0FBQUE7O0FBMEY3Qjs7QUF5REE7O0FBT0E7QUFDQTtBQUNBIn0=