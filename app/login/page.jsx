'use client';

/* Pantalla 1 · Inicio de sesión */

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, rutaInicioPorRol } from '@/app/context/AuthContext';
import { validarLogin, hayErrores } from '@/app/lib/validaciones';
import { MensajeError, ErrorCampo } from '@/app/components/Mensajes';
import Cargando from '@/app/components/Cargando';

const CUENTAS_DEMO = [
  { rol: 'Administrador', email: 'admin@rentsmart.com', password: 'Admin123' },
  { rol: 'Operador', email: 'operador@rentsmart.com', password: 'Operador123' },
  { rol: 'Cliente', email: 'cliente@rentsmart.com', password: 'Cliente123' },
];

function FormularioLogin() {
  const router = useRouter();
  const parametros = useSearchParams();
  const { iniciarSesion, autenticado, rol, cargando } = useAuth();

  const [datos, setDatos] = useState({ email: '', password: '' });
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  const redirigir = parametros.get('redirigir');

  // Si ya hay sesión, no tiene sentido mostrar el formulario.
  useEffect(() => {
    if (!cargando && autenticado) {
      router.replace(redirigir || rutaInicioPorRol(rol));
    }
  }, [cargando, autenticado, rol, router, redirigir]);

  const cambiar = (e) => {
    const { name, value } = e.target;
    setDatos((d) => ({ ...d, [name]: value }));
    setErrores((err) => ({ ...err, [name]: undefined }));
  };

  const enviar = async (e) => {
    e.preventDefault();
    setMensaje(null);

    const encontrados = validarLogin(datos);
    setErrores(encontrados);
    if (hayErrores(encontrados)) return;

    setEnviando(true);
    try {
      const usuario = await iniciarSesion(datos.email.trim(), datos.password);
      router.replace(redirigir || rutaInicioPorRol(usuario.rol));
    } catch (err) {
      setMensaje(err.message);
      if (err.errores) setErrores(err.errores);
    } finally {
      setEnviando(false);
    }
  };

  const usarDemo = (cuenta) => {
    setDatos({ email: cuenta.email, password: cuenta.password });
    setErrores({});
    setMensaje(null);
  };

  if (cargando || autenticado) return <Cargando mensaje="Un momento…" />;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ingresa con tu cuenta de RENT SMART para continuar.
          </p>

          {redirigir && (
            <p className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Debes iniciar sesión para acceder a esa sección.
            </p>
          )}

          <div className="mt-6">
            <MensajeError mensaje={mensaje} />

            <form onSubmit={enviar} noValidate className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={datos.email}
                  onChange={cambiar}
                  aria-invalid={Boolean(errores.email)}
                  className={`mt-1 block w-full rounded-lg border px-3 py-2.5 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-500/30 ${
                    errores.email ? 'border-red-400' : 'border-slate-300 focus:border-blue-500'
                  }`}
                  placeholder="tucorreo@ejemplo.com"
                />
                <ErrorCampo mensaje={errores.email} />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Contraseña
                </label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    name="password"
                    type={verPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={datos.password}
                    onChange={cambiar}
                    aria-invalid={Boolean(errores.password)}
                    className={`block w-full rounded-lg border px-3 py-2.5 pr-20 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-500/30 ${
                      errores.password ? 'border-red-400' : 'border-slate-300 focus:border-blue-500'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setVerPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-slate-500 hover:text-slate-800"
                  >
                    {verPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
                <ErrorCampo mensaje={errores.password} />
              </div>

              <div className="flex justify-end">
                <Link href="/recuperar" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enviando ? 'Verificando…' : 'Entrar'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">
            ¿No tienes cuenta?{' '}
            <Link href="/registro" className="font-semibold text-blue-600 hover:text-blue-800">
              Regístrate aquí
            </Link>
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Cuentas de prueba
          </p>
          <div className="mt-3 grid gap-2">
            {CUENTAS_DEMO.map((c) => (
              <button
                key={c.email}
                type="button"
                onClick={() => usarDemo(c)}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm transition hover:border-blue-300 hover:bg-blue-50"
              >
                <span className="font-medium text-slate-800">{c.rol}</span>
                <span className="text-xs text-slate-500">{c.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Cargando mensaje="Preparando el formulario…" />}>
      <FormularioLogin />
    </Suspense>
  );
}
