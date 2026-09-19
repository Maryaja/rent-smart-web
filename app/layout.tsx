import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Mi App",
  description: "Proyecto base Next.js con autenticación",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {/* AuthProvider envuelve toda la app para que cualquier
            componente pueda acceder al usuario logueado */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
