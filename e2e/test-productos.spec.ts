import { test, expect } from '@playwright/test';

//Creacion de un nuevo producto
test('crearProducto', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '📦 Productos' }).click();
  await page.getByRole('button', { name: 'Agregar Producto' }).click();
  await page.getByRole('textbox', { name: 'Nombre del Producto *' }).click();
  await page.getByRole('textbox', { name: 'Nombre del Producto *' }).fill('Fibras sintetica');
  await page.getByRole('spinbutton', { name: 'Precio *' }).click();
  await page.getByRole('spinbutton', { name: 'Precio *' }).fill('40000');
  await page.getByRole('textbox', { name: 'Descripción *' }).click();
  await page.getByRole('textbox', { name: 'Descripción *' }).fill('polietireno');
  await page.getByRole('spinbutton', { name: 'Stock *' }).click();
  await page.getByRole('spinbutton', { name: 'Stock *' }).fill('49');
  await page.getByLabel('Categoría*').selectOption('68462cd621a3ee921e5db6fb');
  await page.getByLabel('Proveedor*').selectOption('68687a04ccc62f877cbf1034');
  await page.getByRole('button', { name: 'Guardar Producto' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
});

//Edicion de un producto ya creado
test('editarProducto', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '📦 Productos' }).click();
  await page.getByRole('button', { name: 'Editar producto' }).first().click();
  await page.getByRole('textbox', { name: 'Descripción *' }).click();
  await page.getByRole('textbox', { name: 'Descripción *' }).click();
  await page.getByRole('textbox', { name: 'Descripción *' }).click();
  await page.getByRole('textbox', { name: 'Descripción *' }).press('ArrowLeft');
  await page.getByRole('textbox', { name: 'Descripción *' }).fill('poliestireno');
  await page.getByRole('button', { name: 'Actualizar Producto' }).click();
  await expect(page.getByText('Producto guardado')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
});

//Creacion de un producto con un nombre ya existente
test('duplicadoProducto', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '📦 Productos' }).click();
  await page.getByRole('button', { name: 'Agregar Producto' }).click();
  await page.getByRole('textbox', { name: 'Nombre del Producto *' }).click();
  await page.getByRole('textbox', { name: 'Nombre del Producto *' }).fill('Fibra sintetica');
  await page.getByRole('textbox', { name: 'Descripción *' }).click();
  await page.getByRole('textbox', { name: 'Descripción *' }).fill('mnbvc');
  await page.getByRole('spinbutton', { name: 'Precio *' }).click();
  await page.getByRole('spinbutton', { name: 'Precio *' }).fill('2000');
  await page.getByRole('spinbutton', { name: 'Stock *' }).click();
  await page.getByRole('spinbutton', { name: 'Stock *' }).fill('32');
  await page.getByLabel('Categoría*').selectOption('68462cd621a3ee921e5db6fb');
  await page.getByLabel('Proveedor*').selectOption('68687a04ccc62f877cbf1034');
  await page.getByRole('button', { name: 'Guardar Producto' }).click();
  await expect(page.getByText('Ya existe un producto con ese')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
  await page.getByRole('button', { name: '×' }).click();
});

//Activar un producto que ha sido desactivado
test('activacionProducto', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '📦 Productos' }).click();
  await page.locator('tr:nth-child(4) > td:nth-child(8) > .switch > .slider').click();
  await page.getByRole('button', { name: 'OK' }).click();
});

//Desactivar un producto que ha sido desactivado
test('desactivacionProducto', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '📦 Productos' }).click();
  await page.locator('tr:nth-child(2) > td:nth-child(8) > .switch > .slider').click();
  await page.getByRole('button', { name: 'OK' }).click();
});

//Mostrar los productos que esten activos en el filtro
test('activoProducto', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '📦 Productos' }).click();
  await page.getByLabel('Estado del Producto', { exact: true }).selectOption('activos');
});

//Mostrar los productos que esten desactivados en el filtro
test('desactivoProducto', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '📦 Productos' }).click();
  await page.getByLabel('Estado del Producto', { exact: true }).selectOption('inactivos');
});