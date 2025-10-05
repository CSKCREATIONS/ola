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
window.openModalUsuario = openModalUsuario;
window.openModalRol = openModalRol;