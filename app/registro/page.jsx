'use client';

/* Pantalla 2 · Registro de clientes */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, rutaInicioPorRol } from '@/app/context/AuthContext';
import { validarRegistro, hayErrores } from '@/app/lib/validaciones';
import { MensajeError, ErrorCampo } from '@/app/components/Mensajes';
import Cargando from '@/app/components/Cargando';

const INICIAL = {
  nombre: '',
  email: '',
  documento: '',
  licencia: '',
  telefono: '',
  direccion: '',
  password: '',
  confirmarPassword: '',
};

function fuerzaPassword(password) {
  if (!password) return { nivel: 0, texto: '', color: '' };
  let puntos = 0;
  if (password.length >= 8) puntos += 1;
  if (/[A-Z]/.test(password)) puntos += 1;
  if (/[0-9]/.test(password)) puntos += 1;
  if (/[^A-Za-z0-9]/.test(password)) puntos += 1;

  if (puntos <= 1) return { nivel: 1, texto: 'Débil', color: 'bg-red-500' };
  if (puntos === 2) return { nivel: 2, texto: 'Aceptable', color: 'bg-amber-500' };
  if (puntos === 3) return { nivel: 3, texto: 'Buena', color: 'bg-blue-500' };
  return { nivel: 4, texto: 'Excelente', color: 'bg-emerald-500' };
}

export default function RegistroPage() {
  const router = useRouter();
  const { registrarse, autenticado, rol, cargando } = useAuth();

  const [datos, setDatos] = useState(INICIAL);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!cargando && autenticado) router.replace(rutaInicioPorRol(rol));
  }, [cargando, autenticado, rol, router]);

  const cambiar = (e) => {
    const { name, value } = e.target;
    setDatos((d) => ({ ...d, [name]: value }));
    setErrores((err) => ({ ...err, [name]: undefined }));
  };

  const enviar = async (e) => {
    e.preventDefault();
    setMensaje(null);

    const encontrados = validarRegistro(datos);
    setErrores(encontrados);
    if (hayErrores(encontrados)) return;

    setEnviando(true);
    try {
      const usuario = await registrarse(datos);
      router.replace(rutaInicioPorRol(usuario.rol));
    } catch (err) {
      setMensaje(err.message);
      if (err.errores) setErrores(err.errores);
    } finally {
      setEnviando(false);
    }
  };

  if (cargando || autenticado) return <Cargando mensaje="Un momento…" />;

  const fuerza = fuerzaPassword(datos.password);

  const campo = (name, etiqueta, opciones = {}) => (
    <div className={opciones.ancho || ''}>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {etiqueta} {opciones.opcional && <span className="text-slate-400">(opcional)</span>}
      </label>
      <input
        id={name}
        name={name}
        type={opciones.tipo || 'text'}
        autoComplete={opciones.autoComplete}
        value={datos[name]}
        onChange={cambiar}
        placeholder={opciones.placeholder}
        aria-invalid={Boolean(errores[name])}
        className={`mt-1 block w-full rounded-lg border px-3 py-2.5 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-500/30 ${
          errores[name] ? 'border-red-400' : 'border-slate-300 focus:border-blue-500'
        }`}
      />
      <ErrorCampo mensaje={errores[name]} />
    </div>
  );

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Crear cuenta de cliente</h1>
        <p className="mt-1 text-sm text-slate-500">
          Con tu cuenta podrás buscar vehículos, reservar y consultar tus contratos.
        </p>

        <div className="mt-6">
          <MensajeError mensaje={mensaje} />

          <form onSubmit={enviar} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {campo('nombre', 'Nombre completo', { autoComplete: 'name', placeholder: 'Ej. Carlos Mejía' })}
              {campo('email', 'Correo electrónico', {
                tipo: 'email',
                autoComplete: 'email',
                placeholder: 'tucorreo@ejemplo.com',
              })}
              {campo('documento', 'Documento (DUI)', { placeholder: '01234567-8' })}
              {campo('telefono', 'Teléfono', { tipo: 'tel', placeholder: '7000-0000' })}
              {campo('licencia', 'Licencia de conducir', { opcional: true, placeholder: 'LIC-000000' })}
              {campo('direccion', 'Dirección', { opcional: true, placeholder: 'Ciudad, departamento' })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={datos.password}
                  onChange={cambiar}
                  aria-invalid={Boolean(errores.password)}
                  className={`mt-1 block w-full rounded-lg border px-3 py-2.5 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-500/30 ${
                    errores.password ? 'border-red-400' : 'border-slate-300 focus:border-blue-500'
                  }`}
                />
                {datos.password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${fuerza.color}`}
                        style={{ width: `${fuerza.nivel * 25}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{fuerza.texto}</span>
                  </div>
                )}
                <ErrorCampo mensaje={errores.password} />
              </div>

              <div>
                <label htmlFor="confirmarPassword" className="block text-sm font-medium text-slate-700">
                  Confirmar contraseña
                </label>
                <input
                  id="confirmarPassword"
                  name="confirmarPassword"
                  type="password"
                  autoComplete="new-password"
                  value={datos.confirmarPassword}
                  onChange={cambiar}
                  aria-invalid={Boolean(errores.confirmarPassword)}
                  className={`mt-1 block w-full rounded-lg border px-3 py-2.5 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-500/30 ${
                    errores.confirmarPassword
                      ? 'border-red-400'
                      : 'border-slate-300 focus:border-blue-500'
                  }`}
                />
                <ErrorCampo mensaje={errores.confirmarPassword} />
              </div>
            </div>

            <p className="text-xs text-slate-500">
              La contraseña debe tener al menos 8 caracteres y combinar letras y números.
            </p>

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-800">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
