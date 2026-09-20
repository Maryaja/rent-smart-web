'use client';

/**
 * Rutas protegidas por rol (Paso 1).
 *
 * <RutaProtegida roles={['administrador', 'operador']}> ... </RutaProtegida>
 *
 * - Sin sesión  -> redirige a /login guardando la ruta de destino.
 * - Rol no autorizado -> muestra un aviso y ofrece volver a su panel.
 */

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth, rutaInicioPorRol } from '@/app/context/AuthContext';
import Cargando from './Cargando';

export default function RutaProtegida({ roles, children }) {
  const { autenticado, rol, cargando } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!cargando && !autenticado) {
      router.replace(`/login?redirigir=${encodeURIComponent(pathname)}`);
    }
  }, [cargando, autenticado, router, pathname]);

  if (cargando) return <Cargando mensaje="Verificando tu sesión…" />;
  if (!autenticado) return <Cargando mensaje="Redirigiendo al inicio de sesión…" />;

  if (roles && roles.length > 0 && !roles.includes(rol)) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="text-4xl">🔒</p>
          <h2 className="mt-4 text-xl font-semibold text-amber-900">Acceso restringido</h2>
          <p className="mt-2 text-sm text-amber-800">
            Tu rol <strong>{rol}</strong> no tiene permiso para ver esta sección. Esta pantalla está
            reservada para: {roles.join(', ')}.
          </p>
          <Link
            href={rutaInicioPorRol(rol)}
            className="mt-6 inline-block rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            Volver a mi panel
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
