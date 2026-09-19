// =============================================
// TIPOS - Equivalente al "Modelo" en MVC
// Define la forma de los datos que usará la app
// =============================================

export type UserRole = "administrador" | "operador" | "cliente";

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}
