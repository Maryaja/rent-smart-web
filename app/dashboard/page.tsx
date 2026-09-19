"use client";
// =============================================
// DASHBOARD - Página protegida por rol
// Solo accesible después de hacer login.
// Muestra contenido según el rol del usuario.
// =============================================

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logoutUser } from "@/services/userService";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, clearAuth } = useAuth();

  // Protección de ruta: si no hay usuario, vuelve al login
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    await logoutUser();
    clearAuth();
    router.push("/login");
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  // Colores según el rol
  const rolColor: Record<string, string> = {
    administrador: "bg-purple-100 text-purple-700",
    operador: "bg-blue-100 text-blue-700",
    cliente: "bg-green-100 text-green-700",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <h1 className="font-bold text-gray-800">Mi App</h1>
        <div className="flex items-center gap-4">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${rolColor[user.rol]}`}>
            {user.rol}
          </span>
          <span className="text-sm text-gray-600">{user.nombre}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* Contenido */}
      <main className="max-w-2xl mx-auto mt-12 px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="text-4xl mb-4">
            {user.rol === "administrador" ? "🛠️" : user.rol === "operador" ? "⚙️" : "👋"}
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Hola, {user.nombre}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Iniciaste sesión como <strong>{user.rol}</strong>.
            Tu ID es <code className="bg-gray-100 px-1 rounded">{user.id}</code>.
          </p>

          {/* Contenido diferente por rol */}
          {user.rol === "administrador" && (
            <div className="p-4 bg-purple-50 rounded-lg text-sm text-purple-700">
              Tienes acceso total al sistema. Aquí irían las opciones de administración.
            </div>
          )}
          {user.rol === "operador" && (
            <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
              Puedes gestionar operaciones. Aquí irían las herramientas de operador.
            </div>
          )}
          {user.rol === "cliente" && (
            <div className="p-4 bg-green-50 rounded-lg text-sm text-green-700">
              Bienvenido. Aquí verías tu información y servicios disponibles.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
