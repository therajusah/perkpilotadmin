import { createContext, useContext } from "react";
import type { AuthContextType } from "../types/auth.types";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export type { AuthContextType, User } from "../types/auth.types";

function isAuthContext(value: AuthContextType | undefined): value is AuthContextType {
  return value !== undefined;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!isAuthContext(context)) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

