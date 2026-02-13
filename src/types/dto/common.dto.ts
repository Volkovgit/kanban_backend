/**
 * Pagination DTO for list endpoints
 */
export interface PaginationDto {
  page?: number;
  pageSize?: number;
}

/**
 * Pagination metadata response
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  errors?: ValidationError[];
}

/**
 * Validation error detail
 */
export interface ValidationError {
  field: string;
  message: string;
}
