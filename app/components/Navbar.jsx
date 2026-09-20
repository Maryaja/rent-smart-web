'use client';

/** Barra de navegación: los enlaces cambian según el rol activo. */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

const ENLACES_PERSONAL = [
  { href: '/admin', texto: 'Dashboard' },
  { href: '/vehiculos', texto: 'Vehículos' },
  { href: '/reservas', texto: 'Reservas' },
  { href: '/contratos', texto: 'Contratos' },
  { href: '/reportes', texto: 'Reportes' },
];

const ENLACES_CLIENTE = [
  { href: '/cliente', texto: 'Mi panel' },
  { href: '/buscar', texto: 'Buscar vehículo' },
  { href: '/mis-reservas', texto: 'Mis reservas' },
];

export default function Navbar() {
  const { autenticado, usuario, rol, esPersonal, cerrarSesion, cargando } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);

  const enlaces = esPersonal ? ENLACES_PERSONAL : ENLACES_CLIENTE;

  const salir = () => {
    cerrarSesion();
    setAbierto(false);
    router.push('/login');
  };

  const esActivo = (href) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            RS
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            RENT <span className="text-blue-600">SMART</span>
          </span>
        </Link>

        {autenticado && (
          <ul className="hidden items-center gap-1 md:flex">
            {enlaces.map((e) => (
              <li key={e.href}>
                <Link
                  href={e.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    esActivo(e.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-3">
          {cargando ? null : autenticado ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-tight text-slate-900">{usuario.nombre}</p>
                <p className="text-xs capitalize text-slate-500">{rol}</p>
              </div>
              <button
                type="button"
                onClick={salir}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Salir
              </button>
              <button
                type="button"
                onClick={() => setAbierto((v) => !v)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:hidden"
                aria-expanded={abierto}
                aria-label="Abrir menú"
              >
                ☰
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </nav>

      {autenticado && abierto && (
        <ul className="border-t border-slate-200 bg-white px-4 py-2 md:hidden">
          {enlaces.map((e) => (
            <li key={e.href}>
              <Link
                href={e.href}
                onClick={() => setAbierto(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                  esActivo(e.href) ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
                }`}
              >
                {e.texto}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
