import { test, expect } from '@playwright/test';

//Creacion de un nuevo proveedor
test('nuevoProveedor', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  //Cuando se inicie sesion, seleccionar la seccion de proveedores
  await page.getByRole('link', { name: '🧑 Proveedores' }).click();
  //Hacer click en el boton de nuevo proveedor
  await page.getByRole('button', { name: 'Nuevo Proveedor' }).click();
  //Llenar los campos necesarios para la creacion del proveedor
  await page.getByRole('textbox', { name: 'Nombre del Proveedor *' }).click();
  await page.getByRole('textbox', { name: 'Nombre del Proveedor *' }).fill('anamaria');
  await page.getByRole('textbox', { name: 'Empresa (opcional)' }).click();
  await page.getByRole('textbox', { name: 'Empresa (opcional)' }).fill('coca cola');
  await page.getByRole('textbox', { name: 'Teléfono *' }).click();
  await page.getByRole('textbox', { name: 'Teléfono *' }).fill('325432');
  await page.getByRole('textbox', { name: 'Correo Electrónico *' }).click();
  await page.getByRole('textbox', { name: 'Correo Electrónico *' }).fill('anamaria@maria.com');
  await page.getByRole('textbox', { name: 'Dirección *' }).click();
  await page.getByRole('textbox', { name: 'Dirección *' }).fill('centro');
  await page.getByRole('textbox', { name: 'País *' }).click();
  await page.getByRole('textbox', { name: 'País *' }).fill('Colombia');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Proveedor guardado')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
});

//Editar un proveedor ya creado
test('editarProveedor', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '🧑 Proveedores' }).click();
  await page.getByRole('button', { name: 'Editar proveedor' }).first().click();
  await page.getByRole('textbox', { name: 'Nombre del Proveedor *' }).click();
  await page.getByRole('textbox', { name: 'Nombre del Proveedor *' }).fill('mariaa');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
});

//Inhabilitar un proveedor ya creado
test('inhabilitarProveedor', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '🧑 Proveedores' }).click();
  await page.locator('tr:nth-child(3) > td:nth-child(6) > .switch > .slider').click();
  await page.getByRole('button', { name: 'Sí, desactivar' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
});

//Habilitar un proveedor que ha sido inhabilitado
test('habilitarProveedor', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '🧑 Proveedores' }).click();
  await page.locator('tr:nth-child(4) > td:nth-child(6) > .switch > .slider').click();
  await page.getByRole('button', { name: 'Sí, activar' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
});

//Revision de los productos de un proveedor
test('productosProveedor', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '🧑 Proveedores' }).click();
  await page.getByRole('button', { name: 'Ver (4)' }).click();
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
});

//Revision cuando un proveedor no tiene productos asociados
test('noproductosProveedor', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '🧑 Proveedores' }).click();
  await expect(page.getByRole('button', { name: 'Ver (0)' }).nth(2)).toBeVisible();
  await page.getByRole('button', { name: 'Ver (0)' }).nth(2).click();
  await expect(page.locator('#root')).toContainText('Este proveedor no tiene productos asociados.');
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
});