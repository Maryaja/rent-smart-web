import apiClient from './apiClient';

export const UsuarioService = {
  /* Función inicia sesión */
  iniciarSesion(email, password) {
    return apiClient.post('/auth/login', { email, password }, { silencioso: true });
  },

  /* Función registro de usuarios */
  registrarCliente(datos) {
    return apiClient.post('/auth/registro', datos, { silencioso: true });
  },

  /* Paso 1 de la recuperación: solicita el código al correo */
  solicitarCodigo(email) {
    return apiClient.post('/auth/recuperar', { email }, { silencioso: true });
  },

  /* Paso 2 de la recuperación: confirma el código y define la nueva contraseña */
  restablecerPassword(email, codigo, password) {
    return apiClient.post('/auth/recuperar', { email, codigo, password }, { silencioso: true });
  },
};

export default UsuarioService;
