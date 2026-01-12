export interface LoginRequest {
  username: string;
  password_hash: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
  };
}

export interface ApiError {
  message: string;
}
