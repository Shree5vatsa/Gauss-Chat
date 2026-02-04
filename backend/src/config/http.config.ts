export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    UNAUTHORIZED: 401,
    INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatusCodeType = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];