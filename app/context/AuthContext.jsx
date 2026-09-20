'use client';

/*
 * Función para verificar el usuario autenticado y rol activo
 * Implementado con Context API + useReducer, sin dependencias externas
 * La sesión se persiste en localStorage para que al recargar la página el usuario siga con la sesión activa
 */

import { createContext, useContext, useEffect, useMemo, useReducer, useCallback } from 'react';
import UsuarioService from '@/app/services/usuarioService';
import { guardarToken } from '@/app/services/apiClient';

const CLAVE_SESION = 'rentsmart.sesion';

const estadoInicial = {
  usuario: null,
  cliente: null,
  cargando: true, // true mientras se restaura la sesión del localStorage
  error: null,
};

function reducer(estado, accion) {
  switch (accion.tipo) {
    case 'RESTAURAR':
      return { ...estado, ...accion.payload, cargando: false, error: null };
    case 'LISTO':
      return { ...estado, cargando: false };
    case 'INICIO_PETICION':
      return { ...estado, cargando: true, error: null };
    case 'SESION_INICIADA':
      return {
        usuario: accion.payload.usuario,
        cliente: accion.payload.cliente || null,
        cargando: false,
        error: null,
      };
    case 'ERROR':
      return { ...estado, cargando: false, error: accion.payload };
    case 'SESION_CERRADA':
      return { usuario: null, cliente: null, cargando: false, error: null };
    default:
      return estado;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [estado, dispatch] = useReducer(reducer, estadoInicial);

  // Restaurar la sesión
  useEffect(() => {
    try {
      const crudo = window.localStorage.getItem(CLAVE_SESION);
      if (crudo) {
        const sesion = JSON.parse(crudo);
        dispatch({ tipo: 'RESTAURAR', payload: { usuario: sesion.usuario, cliente: sesion.cliente } });
        return;
      }
    } catch (e) {
      console.warn('No se pudo restaurar la sesión:', e);
    }
    dispatch({ tipo: 'LISTO' });
  }, []);

  const persistir = useCallback((usuario, cliente, token) => {
    try {
      window.localStorage.setItem(CLAVE_SESION, JSON.stringify({ usuario, cliente }));
      guardarToken(token);
    } catch (e) {
      console.warn('No se pudo guardar la sesión:', e);
    }
  }, []);

  const iniciarSesion = useCallback(
    async (email, password) => {
      dispatch({ tipo: 'INICIO_PETICION' });
      try {
        const data = await UsuarioService.iniciarSesion(email, password);
        persistir(data.usuario, data.cliente, data.token);
        dispatch({ tipo: 'SESION_INICIADA', payload: data });
        return data.usuario;
      } catch (e) {
        dispatch({ tipo: 'ERROR', payload: e.message });
        throw e;
      }
    },
    [persistir]
  );

  const registrarse = useCallback(
    async (datos) => {
      dispatch({ tipo: 'INICIO_PETICION' });
      try {
        const data = await UsuarioService.registrarCliente(datos);
        persistir(data.usuario, data.cliente, data.token);
        dispatch({ tipo: 'SESION_INICIADA', payload: data });
        return data.usuario;
      } catch (e) {
        dispatch({ tipo: 'ERROR', payload: e.message });
        throw e;
      }
    },
    [persistir]
  );

  const cerrarSesion = useCallback(() => {
    try {
      window.localStorage.removeItem(CLAVE_SESION);
      guardarToken(null);
    } catch {
      /* ignorar */
    }
    dispatch({ tipo: 'SESION_CERRADA' });
  }, []);

  const valor = useMemo(() => {
    const rol = estado.usuario ? estado.usuario.rol : null;
    return {
      ...estado,
      rol,
      autenticado: Boolean(estado.usuario),
      esAdministrador: rol === 'administrador',
      esOperador: rol === 'operador',
      esPersonal: rol === 'administrador' || rol === 'operador',
      esCliente: rol === 'cliente',
      clienteId: estado.cliente ? estado.cliente.id : estado.usuario?.clienteId ?? null,
      iniciarSesion,
      registrarse,
      cerrarSesion,
    };
  }, [estado, iniciarSesion, registrarse, cerrarSesion]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return contexto;
}

/* Ruta de inicio según el rol: administrador/operador → panel | cliente → su portal. */
export function rutaInicioPorRol(rol) {
  return rol ? '/' : '/login';
}
