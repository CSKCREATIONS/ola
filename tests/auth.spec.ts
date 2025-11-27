import { test, expect } from '@playwright/test';


// test para login de usuario admin
test('login-exitoso', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Usuario' }).press('Tab');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
});

// intento de login con credenciales invalidas
test('login-mal', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('jla317');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('jla317');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByText('Usuario o contraseña')).toBeVisible();
  await expect(page.locator('form')).toContainText('Usuario o contraseña incorrectos');
});

// login para usuario deshabilitado 'jla242' 
test('login-usuario-deshabilitado', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('jla242');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('jla242');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByText('Usuario deshabilitado')).toBeVisible();
});

//test de redireccion a /RecuperarContraseña cuando es la primera vez iniciando sesion en el sistema
test('cambiar-contraseña-primer-login', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('jla366');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('jla366');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('heading', { name: 'Por favor cambie su contraseña' })).toBeVisible();
});

// test de envio de email con nueva contraseña para usuario con email 'fsharyk@gmail.com'
test('recuperar-contraseña', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Recupérala aquí' }).click();
  await expect(page.getByText('Escribe tu correo electrónico')).toBeVisible();
  await page.getByRole('textbox', { name: 'Correo electrónico' }).click();
  await page.getByRole('textbox', { name: 'Correo electrónico' }).fill('fsharyk');
  await page.getByRole('textbox', { name: 'Correo electrónico' }).press('Alt+6');
  await page.getByRole('textbox', { name: 'Correo electrónico' }).press('Alt+4');
  await page.getByRole('textbox', { name: 'Correo electrónico' }).fill('fsharyk@gmail.com');
  await page.getByRole('button', { name: 'Recuperar contraseña' }).click();
  await expect(page.getByText('Revisa tu correo electrónico')).toBeVisible();
});

//correo no almacenado en la base de datos
test('recuperar-contraseña-correo-invalido', async ({ page }) => {
  await page.goto('/');
 
});