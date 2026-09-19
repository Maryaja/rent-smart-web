"use client";
// =============================================
// PÁGINA DE LOGIN - Equivalente al "Controlador"
// Conecta el formulario (Vista) con el servicio
// (Modelo) y actualiza el contexto global.
// =============================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { useAuth } from "@/context/AuthContext";
import { loginUser } from "@/services/userService";
import { LoginCredentials } from "@/types/user";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await loginUser(credentials);

      if (response.success && response.user && response.token) {
        // Guarda usuario y token en el contexto global
        setAuth(response.user, response.token);

        // Redirige según el rol del usuario
        switch (response.user.rol) {
          case "administrador":
            router.push("/dashboard?rol=admin");
            break;
          case "operador":
            router.push("/dashboard?rol=operador");
            break;
          case "cliente":
            router.push("/dashboard?rol=cliente");
            break;
          default:
            router.push("/dashboard");
        }
      } else {
        setError(response.error || "Error al iniciar sesión.");
      }
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return <LoginForm onSubmit={handleLogin} isLoading={isLoading} error={error} />;
}
