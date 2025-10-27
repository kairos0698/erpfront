export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  success: boolean;
  data?: T;
}

export class ApiResponseHelper {
  static success<T>(data: T, message: string = 'Operación exitosa'): ApiResponse<T> {
    return {
      statusCode: 200,
      message: message,
      success: true,
      data: data
    };
  }

  static error(message: string, statusCode: number = 400): ApiResponse<any> {
    return {
      statusCode: statusCode,
      message: message,
      success: false,
      data: undefined
    };
  }

  static notFound(message: string = 'Recurso no encontrado'): ApiResponse<any> {
    return {
      statusCode: 404,
      message: message,
      success: false,
      data: undefined
    };
  }

  static validationError(message: string = 'Error de validación'): ApiResponse<any> {
    return {
      statusCode: 400,
      message: message,
      success: false,
      data: undefined
    };
  }
}
