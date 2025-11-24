import { test, expect } from '@playwright/test';

//test para la creacion de un usuario 
//EL USUARIO NO DEBE DE EXISTIR EN LA BD
test('crear-usuario', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '👥 Lista de usuarios' }).click();
  await page.getByRole('button', { name: 'Crear Usuario' }).click();
  await page.getByRole('textbox', { name: 'Primer Nombre *' }).fill('pepito');
  await page.getByRole('textbox', { name: 'Primer Apellido *' }).click();
  await page.getByRole('textbox', { name: 'Primer Apellido *' }).fill('perez');
  await page.getByLabel('Rol del Usuario *').selectOption('Administrador');
  await page.getByRole('textbox', { name: 'Correo Electrónico *' }).click();
  await page.getByRole('textbox', { name: 'Correo Electrónico *' }).fill('pepito');
  await page.getByRole('textbox', { name: 'Correo Electrónico *' }).press('Alt+ControlOrMeta+@');
  await page.getByRole('textbox', { name: 'Correo Electrónico *' }).fill('pepito');
  await page.getByRole('textbox', { name: 'Correo Electrónico *' }).press('Alt+ControlOrMeta+@');
  await page.getByRole('textbox', { name: 'Correo Electrónico *' }).fill('pepito');
  await page.getByRole('textbox', { name: 'Correo Electrónico *' }).press('Alt+6');
  await page.getByRole('textbox', { name: 'Correo Electrónico *' }).press('Alt+4');
  await page.getByRole('textbox', { name: 'Correo Electrónico *' }).fill('pepito@gmail.com');
  await page.getByRole('button', { name: 'Crear Usuario' }).nth(1).click();
  await expect(page.getByRole('heading', { name: 'Usuario creado correctamente' })).toBeVisible();
});

//test de NO cracion de usuario porque ya existe
test('no-crear-usuario', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '👥 Lista de usuarios' }).click();
  await page.getByRole('button', { name: 'Crear Usuario' }).click();
  await page.getByRole('textbox', { name: 'Primer Nombre *' }).fill('pepito');
  await page.getByRole('textbox', { name: 'Primer Apellido *' }).click();
  await page.getByRole('textbox', { name: 'Primer Apellido *' }).fill('perez');
  await page.getByLabel('Rol del Usuario *').selectOption('Administrador');
  await page.getByRole('textbox', { name: 'Correo Electrónico *' }).click();
  await page.getByRole('textbox', { name: 'Correo Electrónico *' }).fill('pepito');
  await page.getByRole('textbox', { name: 'Correo Electrónico *' }).press('Alt+6');
  await page.getByRole('textbox', { name: 'Correo Electrónico *' }).press('Alt+4');
  await page.getByRole('textbox', { name: 'Correo Electrónico *' }).fill('pepito@gmail.com');
  await page.getByRole('button', { name: 'Crear Usuario' }).nth(1).click();
  await expect(page.getByText('Error: Usuario o Email ya')).toBeVisible();
});

//test para deshabilitar al usuario 'julian'
test('deshabilitar-usuario', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Usuario' }).press('Tab');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '👥 Lista de usuarios' }).click();
  await page.locator('tr:nth-child(9) > td:nth-child(6) > .switch > .slider').click();
  await page.getByRole('button', { name: 'Sí, Deshabilitar' }).click();
});

//test para habilitar al usuario 'julian'
test('Habilitar-usuario', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Usuario' }).press('Tab');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '👥 Lista de usuarios' }).click();
  await page.locator('tr:nth-child(9) > td:nth-child(6) > .switch > .slider').click();
  await page.getByRole('button', { name: 'Sí, Habilitar' }).click();
});

//test para editar el usuario 'fsharyk'
test('editar-usuario', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Usuario' }).press('Tab');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '👥 Lista de usuarios' }).click();
  await page.locator('tr:nth-child(10) > td:nth-child(9) > .action-buttons > .action-btn.edit').click();
  await expect(page.getByText('Editar Usuario')).toBeVisible();
  await page.getByLabel('Segundo nombre').click();
  await page.getByLabel('Segundo nombre').fill('Tatiana');
  await page.getByLabel('Segundo apellido').click();
  await page.getByLabel('Segundo apellido').fill('Bejarano');
  await page.locator('button').filter({ hasText: 'Cambiar Contraseña' }).click();
  await page.getByPlaceholder('Dejar vacío para no cambiar').click();
  await page.getByPlaceholder('Dejar vacío para no cambiar').fill('admin123');
  await page.getByPlaceholder('Repite la contraseña').click();
  await page.getByPlaceholder('Repite la contraseña').fill('admin123');
  await page.locator('button').filter({ hasText: 'Guardar Cambios' }).click();
});

