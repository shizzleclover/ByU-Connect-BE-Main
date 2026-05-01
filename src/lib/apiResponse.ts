export class ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;

  constructor(statusCode: number, message: string, data: T | null = null) {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }
}
