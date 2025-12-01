import { test, expect } from '@playwright/test';

//Crear rol
test('crear-rol', async ({ page, browserName }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '🛡️ Roles y permisos' }).click();

  const roleName = `Supervisor ${browserName}`;
  await page.getByRole('button', { name: 'Crear Rol' }).click();
  await page.getByPlaceholder('Ej: Administrador, Vendedor,').click();
  await page.getByPlaceholder('Ej: Administrador, Vendedor,').fill(roleName);
  await page.getByLabel('Crear Nuevo Rol').getByText('Compras').click();
  await page.getByLabel('Crear Nuevo Rol').getByText('Órdenes de compra').click();
  await page.getByLabel('Crear Nuevo Rol').getByText('Historial de compras').click();
  await page.getByLabel('Crear Nuevo Rol').getByText('Proveedores').click();
  await page.getByLabel('Ver reportes').check();
  await page.locator('div').filter({ hasText: /^Productos$/ }).click();
  await page.getByLabel('Categorias').check();
  await page.getByLabel('Control de inventario').check();
  await page.getByLabel('Reportes', { exact: true }).check();
  await page.getByLabel('Crear Nuevo Rol').getByLabel('Ventas').check();
  await page.getByLabel('Lista de cotizaciones').check();
  await page.getByLabel('Ver pedidos').check();
  await page.getByLabel('Pedidos agendados').check();
  await page.getByLabel('Pedidos cancelados').check();
  await page.getByLabel('Pedidos entregados').check();
  await page.getByLabel('Crear Nuevo Rol').locator('button').filter({ hasText: 'Crear Rol' }).click();
  await expect(page.getByText('Rol creado correctamente')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Ok' }).click();
});

//intentar crear rol existente
test('crear-rol-existente', async ({ page, browserName }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '🛡️ Roles y permisos' }).click();

  const roleName = `Supervisor ${browserName}`;
  await page.getByRole('button', { name: 'Crear Rol' }).click();
  await page.getByPlaceholder('Ej: Administrador, Vendedor,').click();
  await page.getByPlaceholder('Ej: Administrador, Vendedor,').fill(roleName);
  await page.getByLabel('Crear Nuevo Rol').getByText('Compras').click();
  await page.getByLabel('Crear Nuevo Rol').getByText('Órdenes de compra').click();
  await page.getByLabel('Crear Nuevo Rol').getByText('Historial de compras').click();
  await page.getByLabel('Crear Nuevo Rol').getByText('Proveedores').click();
  await page.getByLabel('Ver reportes').check();
  await page.locator('div').filter({ hasText: /^Productos$/ }).click();
  await page.getByLabel('Categorias').check();
  await page.getByLabel('Control de inventario').check();
  await page.getByLabel('Reportes', { exact: true }).check();
  await page.getByLabel('Crear Nuevo Rol').getByLabel('Ventas').check();
  await page.getByLabel('Lista de cotizaciones').check();
  await page.getByLabel('Ver pedidos').check();
  await page.getByLabel('Pedidos agendados').check();
  await page.getByLabel('Pedidos cancelados').check();
  await page.getByLabel('Pedidos entregados').check();
  await page.getByLabel('Crear Nuevo Rol').locator('button').filter({ hasText: 'Crear Rol' }).click();

  await expect(page.getByText('El rol ya existe')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
});


test('editar-rol', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '🛡️ Roles y permisos' }).click();
  
  await page.getByRole('button', { name: 'Editar rol' }).first().click();
  await page.locator('input[name="group-#ec4899"]').check();
  await page.locator('button').filter({ hasText: 'Guardar Cambios' }).click();
  await expect(page.getByText('Rol actualizado')).toBeVisible();
});


test('deshabilitar-rol', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '🛡️ Roles y permisos' }).click();
  await page.locator('.slider').first().click();
  await expect(page.getByText('Esta accion le impedirá el')).toBeVisible();
  await page.getByRole('button', { name: 'Sí, confirmar' }).click();
  await expect(page.getByText('Rol deshabilitado')).toBeVisible();
});

test('habilitar-rol', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '🛡️ Roles y permisos' }).click();
  await page.locator('.slider').first().click();
  await expect(page.getByText('Esta accion le permitirá el')).toBeVisible();
  await page.getByRole('button', { name: 'Sí, confirmar' }).click();
  await expect(page.getByText('Rol habilitado')).toBeVisible();
});


