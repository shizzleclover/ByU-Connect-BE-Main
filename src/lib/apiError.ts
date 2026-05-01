export class ApiError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;
  details?: unknown[];

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: unknown[],
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code ?? ApiError.codeFromStatus(statusCode);
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  private static codeFromStatus(statusCode: number): string {
    const map: Record<number, string> = {
      400: "BAD_REQUEST",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      422: "UNPROCESSABLE",
      429: "TOO_MANY_REQUESTS",
      500: "INTERNAL_ERROR",
    };
    return map[statusCode] ?? "ERROR";
  }
}
