import { test, expect } from '@playwright/test';

//Crear una nueva categoria
test('crearCategoria', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  //Dar click en la seccion de categorias
  await page.getByRole('link', { name: '🗂️ Categorías' }).click();
  //Agregar una nueva categoria
  await page.getByRole('button', { name: 'Agregar Categoría' }).click();
  //Llenar los campos necesarios para la creacion de la categoria
  await page.getByRole('textbox', { name: 'Nombre de la Categoría *' }).click();
  await page.getByRole('textbox', { name: 'Nombre de la Categoría *' }).fill('sintenticas');
  await page.getByRole('textbox', { name: 'Descripción *' }).click();
  await page.getByRole('textbox', { name: 'Descripción *' }).fill('deportivas');
  await expect(page.getByRole('button', { name: 'Crear' })).toBeVisible();
  await page.getByRole('button', { name: 'Crear' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
});

//Editar categoria ya creada 
test('editarCategoria', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '🗂️ Categorías' }).click();
  await page.getByRole('button', { name: 'Editar categoría' }).first().click();
  await page.getByRole('textbox', { name: 'Descripción *' }).click();
  await page.getByRole('textbox', { name: 'Descripción *' }).fill('adidasss');
  await expect(page.getByRole('button', { name: 'Actualizar' })).toBeVisible();
  await page.getByRole('button', { name: 'Actualizar' }).click();
  await expect(page.getByText('Categoría actualizada')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
});

//Desactivar categoria
test('desactivarCategoria', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '🗂️ Categorías' }).click();
  await page.locator('tr:nth-child(2) > td:nth-child(4) > .switch > .slider').click();
  await page.getByRole('button', { name: 'Sí, desactivar' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
});

//Activar categoria
test('activarCategoria', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '🗂️ Categorías' }).click();
  await page.locator('tr:nth-child(3) > td:nth-child(4) > .switch > .slider').click();
  await page.getByRole('button', { name: 'Sí, activar' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
});

//Crear una categoria con el mismo nombre
test('duplicadoCategoria', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '🗂️ Categorías' }).click();
  await page.getByRole('button', { name: 'Agregar Categoría' }).click();
  await page.getByRole('textbox', { name: 'Nombre de la Categoría *' }).click();
  await page.getByRole('textbox', { name: 'Nombre de la Categoría *' }).fill('Gramas sinteticas');
  await page.getByRole('textbox', { name: 'Descripción *' }).click();
  await page.getByRole('textbox', { name: 'Descripción *' }).fill('na');
  await page.getByRole('button', { name: 'Crear' }).click();
  await expect(page.getByText('Ya existe una categoría con')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
});