import { LoginRequest, LoginResponse } from "@/interface/auth";
import { apiClient } from "./apiClient";

export function login(payload: LoginRequest) {
    return apiClient.post<LoginResponse, LoginRequest>(
        "/api/auth/login",
        payload,
    );
}

export function logout() {}
