// =============================================
// SERVICIO - Equivalente al "Modelo" en MVC
// Aquí van TODAS las llamadas a la API real.
// Por ahora usa datos mock (simulados).
// =============================================

import { LoginCredentials, AuthResponse, User } from "@/types/user";

// --- DATOS MOCK (simulados) ---
// Reemplaza esto con tu API real cuando esté lista
const MOCK_USERS: (User & { password: string })[] = [
  {
    id: "1",
    nombre: "Admin Principal",
    email: "admin@empresa.com",
    password: "admin123",
    rol: "administrador",
  },
  {
    id: "2",
    nombre: "Operador Uno",
    email: "operador@empresa.com",
    password: "operador123",
    rol: "operador",
  },
  {
    id: "3",
    nombre: "Cliente Demo",
    email: "cliente@empresa.com",
    password: "cliente123",
    rol: "cliente",
  },
];

// --- FUNCIÓN DE LOGIN ---
// Cuando tengas API real, cambia esto por: fetch('/api/login', {...})
export async function loginUser(
  credentials: LoginCredentials
): Promise<AuthResponse> {
  // Simula un delay de red
  await new Promise((r) => setTimeout(r, 800));

  const found = MOCK_USERS.find(
    (u) => u.email === credentials.email && u.password === credentials.password
  );

  if (!found) {
    return { success: false, error: "Correo o contraseña incorrectos." };
  }

  const { password, ...user } = found;
  return {
    success: true,
    user,
    token: `mock-token-${user.id}-${Date.now()}`,
  };
}

// --- FUNCIÓN DE LOGOUT ---
export async function logoutUser(): Promise<void> {
  // Con API real: await fetch('/api/logout', { method: 'POST' })
  await new Promise((r) => setTimeout(r, 300));
}

// --- OBTENER USUARIO ACTUAL (desde token guardado) ---
export async function getCurrentUser(): Promise<User | null> {
  // Con API real: valida el token en el servidor
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("user");
  return stored ? JSON.parse(stored) : null;
}
