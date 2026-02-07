export interface LoginRequest {
    username: string;
    password_hash: string;
}

export interface LoginResponse {
    token?: string;
    user: {
        id: string;
        username: string;
    };
}

export interface ApiError {
    message: string;
}
