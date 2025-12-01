import { test, expect } from '@playwright/test';


// Editar informacion de perfil propio
test('editar-perfil', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: 'Avatar usuario', exact: true }).click();
  await page.getByRole('button', { name: 'Editar Perfil' }).click();
  await page.getByLabel('Primer nombre').click();
  await page.getByLabel('Primer nombre').fill('Top');
  await page.getByLabel('Primer apellido').click();
  await page.getByLabel('Primer apellido').fill('User');
  await page.getByLabel('Segundo nombre').click();
  await page.getByLabel('Segundo nombre').fill('');
  await page.locator('button').filter({ hasText: 'Guardar Cambios' }).click();
  await expect(page.getByText('Perfil actualizado correctamente')).toBeVisible();
})

// cambiar contraseña propia como user 'admin'
test('cambiar-contraseña', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: 'Avatar usuario', exact: true }).click();
  await page.getByRole('button', { name: 'Editar Perfil' }).click();
  await page.locator('button').filter({ hasText: 'Cambiar Contraseña' }).click();
  await page.getByPlaceholder('Mínimo 6 caracteres').click();
  await page.getByPlaceholder('Mínimo 6 caracteres').fill('admin123');
  await page.getByPlaceholder('Repite la contraseña').click();
  await page.getByPlaceholder('Repite la contraseña').fill('admin123');
  await page.locator('button').filter({ hasText: 'Guardar Cambios' }).click();
  await expect(page.getByText('Tu sesión expirará. Debes')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(page.getByRole('heading', { name: 'Portal JLA Global Company' })).toBeVisible();
})


test('cerrar-sesion', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.locator('#btn-menu').click();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.getByText('¿Seguro que quieres cerrar').click();
  await page.getByRole('button', { name: 'Sí, cerrar sesión' }).click();
  await expect(page.getByRole('heading', { name: 'Portal JLA Global Company' })).toBeVisible();
})
