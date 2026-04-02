export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; error: { message: string; issues?: string[]; code?: string; requestId?: string; context?: Record<string, unknown> } };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
