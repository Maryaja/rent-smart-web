'use client';

/**
 * Recuperación de contraseña (Paso 1).
 * Flujo en dos etapas: solicitar código → confirmar código y nueva contraseña.
 * El envío de correo está simulado: el código se muestra en pantalla.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UsuarioService from '@/app/services/usuarioService';
import { MensajeError, MensajeExito, ErrorCampo } from '@/app/components/Mensajes';
import { REGEX_EMAIL } from '@/app/lib/validaciones';

export default function RecuperarPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState('solicitar'); // solicitar | confirmar | listo
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [codigoDemo, setCodigoDemo] = useState(null);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const solicitar = async (e) => {
    e.preventDefault();
    setMensaje(null);
    setErrores({});

    if (!REGEX_EMAIL.test(email.trim())) {
      setErrores({ email: 'Ingresa un correo válido.' });
      return;
    }

    setEnviando(true);
    try {
      const data = await UsuarioService.solicitarCodigo(email.trim());
      setAviso(data.mensaje);
      setCodigoDemo(data.codigoDemo || null);
      setEtapa('confirmar');
    } catch (err) {
      setMensaje(err.message);
      if (err.errores) setErrores(err.errores);
    } finally {
      setEnviando(false);
    }
  };

  const confirmarCambio = async (e) => {
    e.preventDefault();
    setMensaje(null);
    setErrores({});

    if (password !== confirmar) {
      setErrores({ confirmar: 'Las contraseñas no coinciden.' });
      return;
    }

    setEnviando(true);
    try {
      const data = await UsuarioService.restablecerPassword(email.trim(), codigo, password);
      setAviso(data.mensaje);
      setEtapa('listo');
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      setMensaje(err.message);
      if (err.errores) setErrores(err.errores);
    } finally {
      setEnviando(false);
    }
  };

  const claseInput = (campo) =>
    `mt-1 block w-full rounded-lg border px-3 py-2.5 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-500/30 ${
      errores[campo] ? 'border-red-400' : 'border-slate-300 focus:border-blue-500'
    }`;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Recuperar contraseña</h1>
        <p className="mt-1 text-sm text-slate-500">
          {etapa === 'solicitar'
            ? 'Te enviaremos un código de verificación a tu correo.'
            : etapa === 'confirmar'
              ? 'Ingresa el código que recibiste y define tu nueva contraseña.'
              : 'Todo listo.'}
        </p>

        <div className="mt-6">
          <MensajeError mensaje={mensaje} />
          <MensajeExito mensaje={aviso} />

          {codigoDemo && etapa === 'confirmar' && (
            <p className="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              Entorno de demostración — tu código es{' '}
              <strong className="font-mono text-base tracking-widest">{codigoDemo}</strong>
            </p>
          )}

          {etapa === 'solicitar' && (
            <form onSubmit={solicitar} noValidate className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={claseInput('email')}
                  placeholder="tucorreo@ejemplo.com"
                />
                <ErrorCampo mensaje={errores.email} />
              </div>
              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {enviando ? 'Enviando…' : 'Enviar código'}
              </button>
            </form>
          )}

          {etapa === 'confirmar' && (
            <form onSubmit={confirmarCambio} noValidate className="space-y-4">
              <div>
                <label htmlFor="codigo" className="block text-sm font-medium text-slate-700">
                  Código de verificación
                </label>
                <input
                  id="codigo"
                  inputMode="numeric"
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                  className={`${claseInput('codigo')} text-center font-mono text-lg tracking-[0.5em]`}
                  placeholder="000000"
                />
                <ErrorCampo mensaje={errores.codigo} />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Nueva contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={claseInput('password')}
                />
                <ErrorCampo mensaje={errores.password} />
              </div>
              <div>
                <label htmlFor="confirmar" className="block text-sm font-medium text-slate-700">
                  Confirmar contraseña
                </label>
                <input
                  id="confirmar"
                  type="password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  className={claseInput('confirmar')}
                />
                <ErrorCampo mensaje={errores.confirmar} />
              </div>
              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {enviando ? 'Guardando…' : 'Cambiar contraseña'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEtapa('solicitar');
                  setAviso(null);
                  setCodigoDemo(null);
                }}
                className="w-full text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                Usar otro correo
              </button>
            </form>
          )}

          {etapa === 'listo' && (
            <p className="text-sm text-slate-600">Te llevaremos al inicio de sesión…</p>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-800">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
