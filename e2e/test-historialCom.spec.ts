import { test, expect } from '@playwright/test';

//Lectura de las ordenes de compra en el historial que han sido aprobadas
test('lecturaOrdenApro', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '📚 Historial de compras' }).click();
  await page.getByRole('button', { name: 'OC-1764099977014-qpHZXUU0X' }).click();
  await page.locator('button').filter({ hasText: /^Cerrar$/ }).click();
});

//Lectura de las compras creadas sin necesidad de una orden de compra
test('lecturaCompras', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Portal JLA Global CompanyIniciar sesión¿Has olvidado tu contraseña?Recupérala').click();
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  //Seleccionar la seccion de historial de compras
  await page.getByRole('link', { name: '📚 Historial de compras' }).click();
  //Seleccionar una compra creada sin orden de compra para ver sus detalles
  await page.getByRole('button', { name: 'COM-1764021316575-TSOBJ5' }).click();
  await page.locator('button').filter({ hasText: /^Cerrar$/ }).click();
});

//Lectura de las compras creadas sin necesidad de una orden de compra
test('creacionCompra', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  //Seleccionar la seccion de historial de compras
  await page.getByRole('link', { name: '📚 Historial de compras' }).click();
  //Seleccionar el boton para agregar una nueva compra
  await page.getByRole('button', { name: 'Nueva Compra' }).click();
  //Rellenar el formulario de nueva compra
  await page.getByLabel('Proveedor *').selectOption('68687a04ccc62f877cbf1034');
  await page.getByRole('button', { name: 'Agregar Producto' }).click();
  await page.getByLabel('Producto', { exact: true }).selectOption('6928afe3426018ed8a2c029b');
  //Guardar la nueva compra
  await page.getByRole('button', { name: 'Guardar Compra' }).click();
  await expect(page.getByText('Compra registrada')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
});

//Enviar por correo las ordenes de compra y/o compras aprobadas desde el historial
test('enviarCorreoCompra', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '📚 Historial de compras' }).click();
  await page.getByRole('button', { name: 'COM-1764021316575-TSOBJ5' }).click();
  await page.getByRole('button', { name: 'Enviar por correo' }).click();
  await page.getByRole('textbox', { name: 'ejemplo@correo.com' }).fill('fsharyk@gmail.com');
  await page.getByRole('button', { name: '📧 Enviar Compra' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
});

//Creacion de una nueva compra directamente 
test('crearCompra', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  //Seleccionar la seccion de historial de compras
  await page.getByRole('link', { name: '📚 Historial de compras' }).click();
  await page.getByRole('button', { name: 'Nueva Compra' }).click();
  await page.getByLabel('Proveedor *').selectOption('68687a04ccc62f877cbf1034');
  //Seleccionar y dar click en agregar producto
  await page.getByRole('button', { name: 'Agregar Producto' }).click();
  //LLenar los campos del producto
  await page.getByLabel('Producto', { exact: true }).selectOption('6928afe3426018ed8a2c029b');
  await page.getByRole('textbox', { name: 'Observaciones' }).click();
  await page.getByRole('textbox', { name: 'Observaciones' }).fill('na');
  await page.getByRole('button', { name: 'Guardar Compra' }).click();
  await expect(page.getByText('Compra registrada')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
});

//Creacion de compra no exitosa si seleccionar producto
test('noProducto', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '📚 Historial de compras' }).click();
  await page.getByRole('button', { name: 'Nueva Compra' }).click();
  await page.getByLabel('Proveedor *').selectOption('68687a04ccc62f877cbf1034');
  await page.getByRole('button', { name: 'Guardar Compra' }).click();
  await expect(page.getByText('Debe agregar al menos un')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
});

//Eliminar producto de una compra en proceso
test('eliminarProducto', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '📚 Historial de compras' }).click();
  await page.getByRole('button', { name: 'Nueva Compra' }).click();
  await page.getByLabel('Proveedor *').selectOption('68687a04ccc62f877cbf1034');
  await page.getByRole('button', { name: 'Agregar Producto' }).click();
  await page.getByLabel('Producto', { exact: true }).selectOption('686c914ab389c09c8a9ac1fb');
  //Cuando se esta realizando una compra, eliminar un producto agregado
  await page.getByRole('button', { name: 'Eliminar producto' }).click();
});

//Cuando se crea una compra sin seleccionar un proveedor
test('errorProveedorCom', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '📚 Historial de compras' }).click();
  await page.getByRole('button', { name: 'Nueva Compra' }).click();
  await page.getByRole('button', { name: 'Agregar Producto' }).click();
  await page.getByLabel('Producto', { exact: true }).selectOption('6928afe3426018ed8a2c029b');
  await page.getByRole('button', { name: 'Guardar Compra' }).click();
  await expect(page.getByText('Debe seleccionar un proveedor')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
});

//imprimir/guardar una compra en PDF
test('imprimirCom', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '📚 Historial de compras' }).click();
  await page.getByRole('button', { name: 'COM-1764021316575-TSOBJ5' }).click();
  //Cuando se selecione el archivo dar click en imprimir
  const page1Promise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Imprimir PDF' }).click();
  const page1 = await page1Promise;
});

//imprimir/guardar una ordencompra en PDF
test('imprimirOr', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '📚 Historial de compras' }).click();
  await page.getByRole('button', { name: '2', exact: true }).click();
  await page.getByRole('button', { name: 'OC-1764099977014-qpHZXUU0X' }).click();
  const page1Promise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Imprimir PDF' }).click();
  const page1 = await page1Promise;
});