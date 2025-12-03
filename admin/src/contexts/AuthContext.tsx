import { useState, useEffect, type ReactNode } from "react";
import { AUTH_API } from "../config/backend";
import { AuthContext } from "../hooks/useAuth";
import type { AuthContextType, User } from "../types/auth.types";

interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

interface ErrorResponse {
  error: string;
}

const TOKEN_KEY = "admin_auth_token";
const USER_KEY = "admin_user";
const TOKEN_EXP_KEY = "admin_auth_token_exp";
const LOGIN_TIMEOUT_MS = 10000;

function isValidUser(obj: unknown): obj is User {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "email" in obj &&
    "isAdmin" in obj &&
    typeof (obj as User).id === "string" &&
    typeof (obj as User).email === "string" &&
    typeof (obj as User).isAdmin === "boolean"
  );
}

function isLoginResponse(obj: unknown): obj is LoginResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "token" in obj &&
    "user" in obj &&
    typeof (obj as LoginResponse).token === "string" &&
    isValidUser((obj as LoginResponse).user)
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = sessionStorage.getItem(TOKEN_KEY);
    const storedUser = sessionStorage.getItem(USER_KEY);
    const storedExp = sessionStorage.getItem(TOKEN_EXP_KEY);

    if (storedToken && storedUser && storedExp) {
      try {
        const expirationTime = parseInt(storedExp, 10);
        const now = Date.now();

        if (isNaN(expirationTime) || expirationTime <= now) {
          sessionStorage.removeItem(TOKEN_KEY);
          sessionStorage.removeItem(USER_KEY);
          sessionStorage.removeItem(TOKEN_EXP_KEY);
        } else {
        const parsedUser: unknown = JSON.parse(storedUser);
        if (isValidUser(parsedUser)) {
          setToken(storedToken);
          setUser(parsedUser);
        } else {
            sessionStorage.removeItem(TOKEN_KEY);
            sessionStorage.removeItem(USER_KEY);
            sessionStorage.removeItem(TOKEN_EXP_KEY);
          }
        }
      } catch (error) {
        console.error("Error loading auth state:", error);
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(TOKEN_EXP_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, LOGIN_TIMEOUT_MS);

    try {
      const response = await fetch(`${AUTH_API}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: unknown = await response.json().catch(() => ({ error: "Login failed" }));
        const errorMessage =
          typeof errorData === "object" &&
          errorData !== null &&
          "error" in errorData &&
          typeof (errorData as ErrorResponse).error === "string"
            ? (errorData as ErrorResponse).error
            : "Login failed";
        throw new Error(errorMessage);
      }

      const data: unknown = await response.json();
      
      if (!isLoginResponse(data)) {
        throw new Error("Invalid response from server");
      }

      const expirationTime = Date.now() + (7 * 24 * 60 * 60 * 1000);
      sessionStorage.setItem(TOKEN_KEY, data.token);
      sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
      sessionStorage.setItem(TOKEN_EXP_KEY, expirationTime.toString());

      setToken(data.token);
      setUser(data.user);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("Login request timed out. Please try again.");
      }
      
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Login request timed out. Please try again.");
      }
      
      console.error("Login error:", error);
      if (error instanceof Error) {
      throw error;
      }
      throw new Error("Login failed");
    }
  };

  const logout = (): void => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_EXP_KEY);
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

