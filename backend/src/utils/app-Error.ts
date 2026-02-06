import { HTTP_STATUS, HttpStatusCodeType } from "../config/http.config";


export const ErrorCodes = {
    ERR_INTERNAL: "ERR_INTERNAL",
    ERR_NOT_FOUND: "ERR_NOT_FOUND",
    ERR_UNAUTHORIZED: "ERR_UNAUTHORIZED",
    ERR_FORBIDDEN: "ERR_FORBIDDEN",
    ERR_BAD_REQUEST: "ERR_BAD_REQUEST",
    ERR_INTERNAL_SERVER_ERROR: "ERR_INTERNAL_SERVER_ERROR",
} as const;

export type ErrorCodeType = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class AppError extends Error {
    constructor(
        message: string,
        public statusCode: HttpStatusCodeType = HTTP_STATUS.INTERNAL_SERVER_ERROR,
        public errorCode: ErrorCodeType = ErrorCodes.ERR_INTERNAL
    ) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        Error.captureStackTrace(this,this.constructor);
    }
}

export class InternalServerException extends AppError{
    constructor(message: string = "Internal Server Error") {
        super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ErrorCodes.ERR_INTERNAL);
    }
}
export class NotFoundException extends AppError{
    constructor(message: string = "Resources Not Found") {
        super(message, HTTP_STATUS.NOT_FOUND, ErrorCodes.ERR_NOT_FOUND);
    }
}
export class UnauthorizedException extends AppError{
    constructor(message: string = "Unauthorized") {
        super(message, HTTP_STATUS.UNAUTHORIZED, ErrorCodes.ERR_UNAUTHORIZED);
    }
}
export class ForbiddenException extends AppError{
    constructor(message: string = "Forbidden") {
        super(message, HTTP_STATUS.FORBIDDEN, ErrorCodes.ERR_FORBIDDEN);
    }
}
export class BadRequestException extends AppError{
    constructor(message: string = "Bad Request") {
        super(message, HTTP_STATUS.BAD_REQUEST, ErrorCodes.ERR_BAD_REQUEST);
    }
}