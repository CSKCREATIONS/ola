import { test, expect } from '@playwright/test';

// Configuración para TODOS los tests
test.beforeEach(async ({ page }) => {
  // Siempre hacer login antes de cada test
  await page.goto('/');
  
  // Verificar si ya estamos logueados
  const isLoggedIn = await page.getByRole('link', { name: '🧾 Orden de compra' }).isVisible().catch(() => false);
  
  if (!isLoggedIn) {
    // Si no estamos logueados, hacer login
    await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
    await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    
    // Esperar a que el login sea exitoso
    await expect(page.getByRole('link', { name: '🧾 Orden de compra' })).toBeVisible();
  }
});

//Creacion de una nueva orden de compra
test('crearOrden', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '🧾 Orden de compra' }).click();
  await page.getByRole('button', { name: 'Nueva Orden' }).click();
  await page.getByLabel('Proveedor *').selectOption('68687a04ccc62f877cbf1034');
  await page.getByRole('combobox').nth(1).selectOption('6928afe3426018ed8a2c029b');
  await page.getByRole('spinbutton', { name: 'IVA (%)' }).click();
  await page.getByRole('spinbutton', { name: 'IVA (%)' }).fill('011');
  await page.getByRole('button', { name: 'Agregar Producto' }).click();
  await page.getByRole('button', { name: 'Guardar Orden' }).click();
  await expect(page.getByText('Orden de compra creada')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
});

//Crear una orden de compra sin agregar productos
test('sinProductoOrden', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '🧾 Orden de compra' }).click();
  await page.getByRole('button', { name: 'Nueva Orden' }).click();
  await page.getByLabel('Proveedor *').selectOption('68687a04ccc62f877cbf1034');
  await page.getByRole('button', { name: 'Guardar Orden' }).click();
  await expect(page.getByText('Debes agregar al menos un')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
});

//Elimincion de un producto al estar creando una orden de compra
test('eliminarOrdenCreacion', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '🧾 Orden de compra' }).click();
  await page.getByRole('button', { name: 'Nueva Orden' }).click();
  await page.getByLabel('Proveedor *').selectOption('68687a04ccc62f877cbf1034');
  await page.getByRole('combobox').nth(1).selectOption('6928afe3426018ed8a2c029b');
  await page.getByRole('button', { name: 'Agregar Producto' }).click();
  await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
});

//Lectura de una orden de compra que ya ha sido creada
test('lecturaOrden', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '🧾 Orden de compra' }).click();
  await page.getByRole('button', { name: 'OC-1764475837927-xnUKellsl' }).click();
  await page.getByText('Cerrar', { exact: true }).click();
});

//Eliminar una orden de compra
test('eliminarOrden', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '🧾 Orden de compra' }).click();
  //Seleccionar la orden de compra que se desea eliminar
  await page.getByRole('row', { name: 'OC-1764550871666-SHSzZoUV8' }).getByLabel('Eliminar orden').click();
  await page.getByRole('button', { name: 'Sí, eliminar' }).click();
  await expect(page.getByText('La orden ha sido eliminada')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
})

//Editar una orden de compra
test('editarOrden', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '🧾 Orden de compra' }).click();
  await page.getByRole('button', { name: 'OC-1764550903222-FWOeVf4YR' }).click();
  await page.getByText('Cerrar', { exact: true }).click();
  await page.getByRole('button', { name: 'Editar orden' }).nth(2).click();
  await page.locator('.btn-profesional').first().click();
  await page.getByLabel('Producto').selectOption('6928afe3426018ed8a2c029b');
  await page.getByRole('button', { name: 'Guardar' }).click();
})


//Marcar aprobada una orden de compra
test('enviarOrden', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '🧾 Orden de compra' }).click();
  await page.getByRole('button', { name: 'OC-1764550903222-FWOeVf4YR' }).click();
  await page.getByRole('button', { name: 'Enviar correo', exact: true }).click();
  await page.getByRole('textbox', { name: 'ejemplo@correo.com' }).fill('fsharyk@gmail.com');
  await page.getByRole('button', { name: '📧 Enviar Orden' }).click();
  await expect(page.getByText('La orden de compra ha sido')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
})

//Marcar aprobada una orden de compra
test('aprobarOrden', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('textbox', { name: 'Contraseña' }).press('Enter');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '🧾 Orden de compra' }).click();
  await page.getByRole('button', { name: 'Pendiente' }).nth(4).click();
  await page.getByRole('button', { name: 'Marcar como Completada' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
})