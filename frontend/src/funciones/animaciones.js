
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
    menuLateral.classList.toggle('mostrar-menu')

    if (window.innerWidth > 768) {
        // En computadoras de escritorio, el contenido se mueve hacia la derecha
        contenido.style.marginLeft = '250px'
        companyName.style.marginLeft = '200px'
        menuLateral.style.boxShadow= '0 0 5px 5px  rgba(0,0,0,.5)';
    } else{
        // En dispositivos moviles, el contenido se sombrea
        menuLateral.style.boxShadow= '0 0 0 200vmax rgba(0,0,0,.5)';
    }

}

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
    targetModal.style.display = 'none'
}


// marca todos los checkbox
export function toggleCheckboxes(setSelected) {
    setSelected((prev) => {
      const allChecked = !Object.values(prev).every(Boolean);
      return Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: allChecked }), {});
    });
  }





  