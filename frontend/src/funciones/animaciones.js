
/*Funcion para desplegar los submenus de la barra lateral*/ 
/* global globalThis */
export function toggleSubMenu(menuId){
    const targetMenu = document.getElementById(menuId);
    if(!targetMenu) return;
    
    // Cerrar otros submenus abiertos (comportamiento de acordeón)
    const allSubmenus = document.querySelectorAll('.dropdown');
    for (const submenu of allSubmenus) {
        if (submenu.id !== menuId && submenu.classList.contains('visible')) {
            submenu.classList.remove('visible');
        }
    }
    
    // Toggle el submenu actual
    targetMenu.classList.toggle('visible');
}


/***Los elementos son traidos con su id**/
export function mostrarMenu(){
    const menuLateral = document.querySelector('#menu')
    const companyName = document.querySelector('.empresa-nombre')
    const contenido = document.querySelector('.content')
    const body = document.body
    
    const isShowing = menuLateral.classList.toggle('mostrar-menu')

    if (window.innerWidth > 768) {
        // Modo escritorio
        if (isShowing) {
            contenido.style.marginLeft = '280px'
            companyName.style.marginLeft = '200px'
            menuLateral.style.boxShadow = '0 0 5px 5px rgba(0,0,0,.5)'
        } else {
            contenido.style.marginLeft = '0'
            companyName.style.marginLeft = '0'
            menuLateral.style.boxShadow = 'none'
        }
    } else {
        // Modo móvil
        if (isShowing) {
            menuLateral.style.left = '0'
            menuLateral.style.boxShadow= '0 0 0 200vmax rgba(0,0,0,.5)';
            // Prevenir scroll del body cuando el menú está abierto
            body.style.overflow = 'hidden'
        } else {
            menuLateral.style.left = '-100%'
            menuLateral.style.boxShadow = 'none'
            body.style.overflow = ''
        }
    }
}

// Función para cerrar el menú al hacer clic fuera de él (opcional)
export function cerrarMenuAlClicExterno(event) {
    const menuLateral = document.querySelector('#menu')
    const btnMenu = document.querySelector('#btn-menu')
    
    if (window.innerWidth <= 768 && 
        menuLateral.classList.contains('mostrar-menu') &&
        !menuLateral.contains(event.target) && 
        !btnMenu.contains(event.target)) {
        mostrarMenu()
    }
}

// Agregar event listener para cerrar al hacer clic fuera (opcional)
document.addEventListener('click', cerrarMenuAlClicExterno)

export function cerrarMenu(){
    const menuLateral = document.querySelector('#menu')
    const companyName = document.querySelector('.empresa-nombre')
    companyName.style.marginLeft = '0px'
    menuLateral.classList.toggle('mostrar-menu')
    const contenido = document.querySelector('.content')
    contenido.style.marginLeft = '0 '
    menuLateral.style.boxShadow= 'none';
}




/**Funcion para abrir los popup */
export function openModal(modalId) {
    // Para modales antiguos que aún usan display
    const targetModal = document.getElementById(modalId);
    if (targetModal) {
        // Si es un <dialog>, usar su API si está disponible
        try {
            if (targetModal.tagName === 'DIALOG' && typeof targetModal.showModal === 'function') {
                targetModal.showModal();
                return;
            }
        } catch (e) {
            // Si ocurre un error al usar la API de <dialog>, registrarlo y seguir con el fallback por estilos
            console.warn('openModal: fallback to display due to dialog API error:', e);
        }

        targetModal.style.display = 'flex';
        return;
    }
    
    // Para los nuevos modales controlados por React
    if (modalId === 'agregar-usuario') {
        const opener = globalThis?.openModalUsuario ?? globalThis?.window?.openModalUsuario;
        opener?.();
    } else if (modalId === 'crear-rol') {
        const opener = globalThis?.openModalRol ?? globalThis?.window?.openModalRol;
        opener?.();
    }
}
export function closeModal(modalId) {
    const targetModal = document.getElementById(modalId);
    if (!targetModal) return;

    try {
        // Si es un <dialog> y soporta close(), usarlo
        if (targetModal.tagName === 'DIALOG' && typeof targetModal.close === 'function') {
            targetModal.close();
            return;
        }
    } catch (e) {
        // Registrar el error y seguir con el fallback por estilos
        console.warn('closeModal: fallback to style due to dialog API error:', e);
    }

    // Fallback: ocultar por CSS si existe style
    if (targetModal.style) targetModal.style.display = 'none';
}


// marca todos los checkbox
export function toggleCheckboxes(setSelected) {
    setSelected((prev) => {
            const allChecked = !Object.values(prev).every(Boolean);
            const acc = {};
            for (const key of Object.keys(prev)) {
                acc[key] = allChecked;
            }
            return acc;
    });
  }





  