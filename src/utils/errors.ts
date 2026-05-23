export class AppError extends Error {
  statusCode: number;
  details?: { field: string; message: string }[];

  constructor(message: string, statusCode: number = 500, details?: { field: string; message: string }[]) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(message: string, details?: { field: string; message: string }[]) {
    return new AppError(message, 400, details);
  }

  static unauthorized(message: string = "Unauthorized") {
    return new AppError(message, 401);
  }

  static forbidden(message: string = "Forbidden") {
    return new AppError(message, 403);
  }

  static notFound(message: string = "Not found") {
    return new AppError(message, 404);
  }

  static conflict(message: string) {
    return new AppError(message, 409);
  }

  static internal(message: string = "Internal server error") {
    return new AppError(message, 500);
  }
}
