"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadRequestException = exports.ForbiddenException = exports.UnauthorizedException = exports.NotFoundException = exports.InternalServerException = exports.AppError = exports.ErrorCodes = void 0;
const http_config_1 = require("../config/http.config");
exports.ErrorCodes = {
    ERR_INTERNAL: "ERR_INTERNAL",
    ERR_NOT_FOUND: "ERR_NOT_FOUND",
    ERR_UNAUTHORIZED: "ERR_UNAUTHORIZED",
    ERR_FORBIDDEN: "ERR_FORBIDDEN",
    ERR_BAD_REQUEST: "ERR_BAD_REQUEST",
    ERR_INTERNAL_SERVER_ERROR: "ERR_INTERNAL_SERVER_ERROR",
};
class AppError extends Error {
    constructor(message, statusCode = http_config_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode = exports.ErrorCodes.ERR_INTERNAL) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class InternalServerException extends AppError {
    constructor(message = "Internal Server Error") {
        super(message, http_config_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, exports.ErrorCodes.ERR_INTERNAL);
    }
}
exports.InternalServerException = InternalServerException;
class NotFoundException extends AppError {
    constructor(message = "Resources Not Found") {
        super(message, http_config_1.HTTP_STATUS.NOT_FOUND, exports.ErrorCodes.ERR_NOT_FOUND);
    }
}
exports.NotFoundException = NotFoundException;
class UnauthorizedException extends AppError {
    constructor(message = "Unauthorized") {
        super(message, http_config_1.HTTP_STATUS.UNAUTHORIZED, exports.ErrorCodes.ERR_UNAUTHORIZED);
    }
}
exports.UnauthorizedException = UnauthorizedException;
class ForbiddenException extends AppError {
    constructor(message = "Forbidden") {
        super(message, http_config_1.HTTP_STATUS.FORBIDDEN, exports.ErrorCodes.ERR_FORBIDDEN);
    }
}
exports.ForbiddenException = ForbiddenException;
class BadRequestException extends AppError {
    constructor(message = "Bad Request") {
        super(message, http_config_1.HTTP_STATUS.BAD_REQUEST, exports.ErrorCodes.ERR_BAD_REQUEST);
    }
}
exports.BadRequestException = BadRequestException;
