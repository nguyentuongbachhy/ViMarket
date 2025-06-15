"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResponse = createResponse;
function createResponse(success, message, data, meta) {
    const response = {
        success,
        message,
    };
    if (data !== undefined) {
        response.data = data;
    }
    if (meta !== undefined) {
        response.meta = meta;
    }
    return response;
}
//# sourceMappingURL=response.js.map