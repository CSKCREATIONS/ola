// Controlador de modales moderno
let modalStates = {
  usuario: null,
  rol: null
};

// Funciones para registrar los modales
export const registerModalUsuario = (setVisible) => {
  modalStates.usuario = setVisible;
};

export const registerModalRol = (setVisible) => {
  modalStates.rol = setVisible;
};

// Funciones para abrir los modales
export const openModalUsuario = () => {
  if (modalStates.usuario) {
    modalStates.usuario(true);
  }
};

export const openModalRol = () => {
  if (modalStates.rol) {
    modalStates.rol(true);
  }
};

// Hacer las funciones disponibles globalmente
/* global globalThis */
if (typeof globalThis !== 'undefined') {
  try {
    // Prefer attaching to globalThis so code works in different environments
    globalThis.openModalUsuario = openModalUsuario;
    globalThis.openModalRol = openModalRol;
  } catch (error_) {
    // Fallback to window if assignment to globalThis fails for any reason
    try {
      if (globalThis.window !== undefined) {
        globalThis.window.openModalUsuario = openModalUsuario;
        globalThis.window.openModalRol = openModalRol;
      }
    } catch (error__) {
      // If even fallback fails, log the error but do not throw
      // This keeps the module safe in restrictive environments
      // eslint-disable-next-line no-console
      console.warn('Could not attach modal openers to global object:', error_, error__);
    }
  }
}