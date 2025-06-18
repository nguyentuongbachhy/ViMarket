"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseUtils = void 0;
class ResponseUtils {
    static success(res, data, message = 'Operation completed successfully', code = 200, meta) {
        const response = Object.assign({ status: 'success', code,
            message,
            data, timestamp: new Date().toISOString() }, (meta && { meta }));
        return res.status(code).json(response);
    }
    static error(res, message = 'An error occurred', code = 500, meta) {
        const response = Object.assign({ status: 'error', code,
            message, timestamp: new Date().toISOString() }, (meta && { meta }));
        return res.status(code).json(response);
    }
    static notFound(res, message = 'Resource not found') {
        return this.error(res, message, 404);
    }
    static badRequest(res, message = 'Bad request') {
        return this.error(res, message, 400);
    }
    static unauthorized(res, message = 'Unauthorized') {
        return this.error(res, message, 401);
    }
    static forbidden(res, message = 'Forbidden') {
        return this.error(res, message, 403);
    }
}
exports.ResponseUtils = ResponseUtils;
//# sourceMappingURL=response.js.map