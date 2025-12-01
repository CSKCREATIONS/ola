import { test, expect } from '@playwright/test';

//Crear usuario
test('crear-usuario', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Usuario' }).press('Tab');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '👥 Lista de usuarios' }).click();
  await page.getByRole('button', { name: 'Crear Usuario' }).click();
  await page.getByRole('textbox', { name: 'Primer Nombre *' }).click();
  await page.getByRole('textbox', { name: 'Primer Nombre *' }).fill('Raul');
  await page.getByRole('textbox', { name: 'Primer Apellido *' }).click();
  await page.getByRole('textbox', { name: 'Primer Apellido *' }).fill('Ramirez');
  await page.getByLabel('Rol del Usuario *').selectOption('Encargado de inventario');
  await page.getByRole('textbox', { name: 'Correo Electrónico *' }).click();
  await page.getByRole('textbox', { name: 'Correo Electrónico *' }).fill('gomezraul');
  await page.getByRole('textbox', { name: 'Correo Electrónico *' }).press('Alt+6');
  await page.getByRole('textbox', { name: 'Correo Electrónico *' }).press('Alt+4');
  await page.getByRole('textbox', { name: 'Correo Electrónico *' }).fill('gomezraul@gmail.com');
  await page.getByRole('button', { name: 'Crear Usuario' }).nth(1).click();
  await expect(page.getByRole('heading', { name: 'Usuario creado correctamente' })).toBeVisible();
});

//intentar crear usuario pero ya es existente en la base de datos
test('crear-usuario-existente', async ({ page }) => {
  await page.goto('/');
   await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Usuario' }).press('Tab');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '👥 Lista de usuarios' }).click();
  await page.getByRole('button', { name: 'Crear Usuario' }).click();
  await page.getByRole('textbox', { name: 'Primer Nombre *' }).click();
  await page.getByRole('textbox', { name: 'Primer Nombre *' }).fill('Tania');
  await page.getByRole('textbox', { name: 'Primer Apellido *' }).click();
  await page.getByRole('textbox', { name: 'Primer Apellido *' }).fill('Sacristan');
  await page.getByLabel('Rol del Usuario *').selectOption('Vendedor');
  await page.getByRole('textbox', { name: 'Correo Electrónico *' }).click();
  await page.getByRole('textbox', { name: 'Correo Electrónico *' }).fill('ejemplo@example.com');
  await page.getByRole('button', { name: 'Crear Usuario' }).nth(1).click();
  
  await page.getByText('Error: Usuario o Email ya existen').click();
})


//editar informacion de usuario
test('editar-info-usuario', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '👥 Lista de usuarios' }).click();
  await page.getByRole('button', { name: 'Editar usuario' }).nth(2).click();
  await page.getByLabel('Nombre de usuario').click();
  await page.getByLabel('Nombre de usuario').fill('orianajla');
  await page.locator('button').filter({ hasText: 'Guardar Cambios' }).click();
})

//eliminar usuario 
test('eliminar-usuario', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '👥 Lista de usuarios' }).click();
  await page.getByRole('button', { name: 'Eliminar usuario ' }).first().click();
  await page.getByRole('button', { name: 'Sí, eliminar' }).click();
  await expect(page.getByText('Usuario eliminado')).toBeVisible();
})

