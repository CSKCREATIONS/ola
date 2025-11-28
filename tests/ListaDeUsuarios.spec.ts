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

//intentar crear usuario pero ya es existente an la base de datos
test('crear-usuario-existente', async ({ page }) => {
  await page.goto('/');
  
})


//deshabilitar usuario 'jla185' luze@gmail.com
test('deshabilitar-usuario', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '👥 Lista de usuarios' }).click();
  await page.locator('tr:nth-child(2) > td:nth-child(6) > .switch > .slider').click();
  await expect(page.getByText('Esta acción le impedirá el')).toBeVisible();
  await page.getByRole('button', { name: 'Sí, Deshabilitar' }).click();
  await expect(page.getByText('Usuario deshabilitado correctamente')).toBeVisible();
})

//habilitar usuario 
test('habilitar usuario', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '👥 Lista de usuarios' }).click();
  await page.locator('tr:nth-child(2) > td:nth-child(6) > .switch > .slider').click();
  await expect(page.getByText('Esta acción le permitirá el ingreso al sistema')).toBeVisible();
  await page.getByRole('button', { name: 'Sí, Habilitar' }).click();
  await expect(page.getByText('Usuario habilitado correctamente')).toBeVisible();
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

//eliminar usuario 'jla679' 'pepito@gmail.com'
test('eliminar-usuario', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '👥 Lista de usuarios' }).click();
  await page.getByRole('button', { name: 'Eliminar usuario jla679' }).click();
  await page.getByRole('button', { name: 'Sí, eliminar' }).click();
  await expect(page.getByText('Usuario eliminado')).toBeVisible();
})

