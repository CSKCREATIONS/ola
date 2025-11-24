import { test, expect } from '@playwright/test';


//test para login correcto
test('login-exitoso', async ({ page }) => {
  await page.goto('https://pangea.casacam.net/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByText('Bienvenid@ al sistema. Estos')).toBeVisible();
});

//test para credenciales invalidas
test('login-incorrecto', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('jla327');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('adminjla');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByText('Usuario o contraseña incorrectos')).toBeVisible();
});

//test para el cambio de contraseña al iniciar sesion por primera vez
//ESTE TEST SOLO FUNCIONA CUANDO EL CAMPO 'mustChangePassword' del usuario 'admin' es 'true'
test('cambiar-contraseña-primer-login', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('heading', { name: 'Por favor cambie su contraseña' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Nueva contraseña' }).click();
  await page.getByRole('textbox', { name: 'Nueva contraseña' }).fill('admin123');
  await page.getByRole('textbox', { name: 'Confirmar contraseña' }).click();
  await page.getByRole('textbox', { name: 'Confirmar contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Actualizar contraseña' }).click();
  await expect(page.getByText('Contraseña actualizada')).toBeVisible();

});

