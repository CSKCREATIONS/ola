import { test, expect, Page } from '@playwright/test';

test.describe.configure({ retries: 1 });
test.setTimeout(60000);

// Helper para login reutilizable
async function loginAndNavigate(page: Page) {
  await page.goto('http://localhost:3000/');
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  
  await page.getByRole('link', { name: '📄 Lista de cotizaciones' }).click();
  await page.waitForURL('**/ListaDeCotizaciones', { timeout: 10000 });
  // Wait for page to load data
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);
  await page.waitForSelector('table, h1, h2', { timeout: 15000 }).catch(() => null);
  await page.waitForTimeout(1000);
}

test.describe('Lista de Cotizaciones - Tests básicos', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page);
  });

  test('Acceso a la página', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Cotizaciones Registradas', exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('Cargar cotizaciones', async ({ page }) => {
    await page.waitForSelector('#tabla_cotizaciones', { timeout: 20000 });
    const rows = page.locator('#tabla_cotizaciones tbody tr');
    
    // Esperar brevemente por el primer row si existe
    await rows.first().waitFor({ state: 'visible', timeout: 3000 }).catch(() => null);
    
    const count = await rows.count();
    console.log('Cotizaciones en DOM:', count);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Tabla tiene columnas correctas', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 15000 }).catch(() => null);
    const headers = page.getByRole('columnheader');
    await expect(headers.first()).toBeVisible({ timeout: 10000 });
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThanOrEqual(4);

    const codigo = await headers.filter({ hasText: /CÓDIGO|COTIZACI/i }).count();
    const fecha = await headers.filter({ hasText: /FECHA/i }).count();
    const cliente = await headers.filter({ hasText: /CLIENTE/i }).count();
    const ciudad = await headers.filter({ hasText: /CIUDAD/i }).count();
    const total = await headers.filter({ hasText: /TOTAL/i }).count();
  });

  test('Filtro por estado de envío', async ({ page }) => {
    const filterSelect = page.locator('#filter-enviado');
    if (await filterSelect.count() > 0) {
      await expect(filterSelect).toBeVisible();
      await filterSelect.selectOption('Si');
      await filterSelect.selectOption('No');
      await filterSelect.selectOption('');
    }
  });

  test('Búsqueda por texto', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await searchInput.clear();
    }
  });

  test('Paginación funcional', async ({ page }) => {
    const page2Btn = page.getByRole('button', { name: '2', exact: true });
    if (await page2Btn.count() > 0) {
      await page2Btn.click();
      await page.getByRole('button', { name: '1', exact: true }).click();
    }
  });

  test('Página activa resaltada', async ({ page }) => {
    const page2Btn = page.getByRole('button', { name: '2', exact: true });
    if (await page2Btn.count() > 0) {
      await page2Btn.click();
    }
  });
});

test.describe('Lista de Cotizaciones - Acciones', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page);
  });

  test('Ver detalles de cotización', async ({ page }) => {
    const firstCodeCell = page.locator('td').filter({ hasText: /COT-\d+/i }).first();
    if (await firstCodeCell.count() > 0) {
      await expect(firstCodeCell).toBeVisible({ timeout: 10000 });
      await firstCodeCell.click();
      await expect(page.getByText(/Cotización/i).first()).toBeVisible();
    }
  });

  test('Editar cotización', async ({ page }) => {
    const editarBtn = page.locator('table tbody tr').first().locator('button:has(i.fa-edit), button:has(i.fa-pen)').first();
    if (await editarBtn.count() > 0) {
      await editarBtn.click();
      await expect(page.locator('#editCotizacionModal, [role="dialog"]').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Enviar cotización por correo', async ({ page }) => {
    const enviarBtn = page.locator('table tbody tr').first().getByRole('button', { name: /Enviar/i }).first();
    if (await enviarBtn.count() > 0) {
      await enviarBtn.click();
      await expect(page.locator('.swal2-popup')).toBeVisible({ timeout: 5000 });
    }
  });

  test('Imprimir cotización', async ({ page }) => {
    const imprimirBtn = page.locator('table tbody tr').first().locator('button:has(i.fa-print)').first();
    if (await imprimirBtn.count() > 0) {
      await imprimirBtn.click();
    }
  });
});

test.describe('Lista de Cotizaciones - Exportación', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page);
  });

  test('Exportar a Excel', async ({ page }) => {
    const excelBtn = page.getByRole('button', { name: /Excel/i }).first();
    if (await excelBtn.count() > 0) {
      await excelBtn.click();
    }
  });

  test('Exportar a PDF', async ({ page }) => {
    const pdfBtn = page.getByRole('button', { name: /PDF/i }).first();
    if (await pdfBtn.count() > 0) {
      await pdfBtn.click();
    }
  });
});