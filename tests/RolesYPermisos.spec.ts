import { test, expect } from '@playwright/test';

//Crear rol
test('crear-rol', async ({ page }) => {
  await page.goto('/');
  
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
  await expect(page.getByText('Rol deshabilitado')).toBeVisible
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
  await expect(page.getByText('Esta accion le impedirá el')).toBeVisible();
  await page.getByRole('button', { name: 'Sí, confirmar' }).click();
  await expect(page.getByText('Rol deshabilitado')).toBeVisible
});

