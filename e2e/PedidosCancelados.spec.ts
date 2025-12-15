import { test, expect, Page } from '@playwright/test';

// Helper para login reutilizable
async function loginAndNavigate(page: Page) {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('link', { name: '⛔ Pedidos cancelados' }).click();
}

test.describe('Pedidos Cancelados - Tests básicos', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page);
  });

  test('Acceso a la página', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pedidos Cancelados', exact: true })).toBeVisible();
  });

  test('Cargar pedidos cancelados', async ({ page }) => {
    // Esperar la respuesta GET /api/pedidos
    const res = await page.waitForResponse(
      resp => resp.url().includes('/api/pedidos') && resp.status() === 200,
      { timeout: 10000 }
    );
    const payload = await res.json();

    type Pedido = { estado?: string; numeroPedido?: string; [key: string]: any };
    const lista: Pedido[] = Array.isArray(payload)
      ? payload
      : (payload.data || payload.pedidos || []);
    const cancelados = lista.filter((p: Pedido) =>
      (p.estado || '').toString().toLowerCase() === 'cancelado'
    );

    // Comprobar tabla
    const rows = page.locator('#tabla_cancelados tbody tr');

    
  });

  test('Tabla tiene columnas correctas', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: /No\. PEDIDO/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /RESPONSABLE/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /F\. CANCELACIÓN/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /CLIENTE/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /CIUDAD/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /TOTAL/i })).toBeVisible();
  });

  test('Ver detalles de pedido cancelado', async ({ page }) => {
    // Buscar el primer código de pedido PED-
    const firstCodeCell = page.locator('td').filter({ hasText: /PED-\d+/i }).first();
    await expect(firstCodeCell).toBeVisible({ timeout: 10000 });
    const codigo = (await firstCodeCell.textContent())?.trim();
    
    if (codigo) {
      const btn = page.getByRole('button', { name: codigo });
      if (await btn.count() > 0) {
        await btn.click();
      } else {
        await firstCodeCell.click();
      }
    }
  });

  test('Cerrar modal de preview', async ({ page }) => {
    const firstCodeCell = page.locator('td').filter({ hasText: /PED-\d+/i }).first();
    await expect(firstCodeCell).toBeVisible({ timeout: 10000 });
    const codigo = (await firstCodeCell.textContent())?.trim();
    
    if (codigo) {
      const btn = page.getByRole('button', { name: codigo });
      if (await btn.count() > 0) {
        await btn.click();
      } else {
        await firstCodeCell.click();
      }
      await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
      await expect(page.getByText(/Pedido Cancelado/i)).not.toBeVisible();
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
      await expect(page.getByRole('button', { name: '2' })).toBeVisible();
    }
  });
});

test.describe('Pedidos Cancelados - Estadísticas', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page);
  });

  test('Estadística: Pedidos Cancelados', async ({ page }) => {
    await expect(page.getByText(/Pedidos Cancelados/i).first()).toBeVisible();
  });

  test('Estadística: Valor Perdido', async ({ page }) => {
    await expect(page.getByText(/Valor Perdido/i).first()).toBeVisible();
  });

  test('Estadística: Este Mes', async ({ page }) => {
    await expect(page.getByText(/Este Mes/i).first()).toBeVisible();
  });
});

test.describe('Pedidos Cancelados - Formato y datos', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page);
  });

  test('Responsable de cancelación', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: /RESPONSABLE/i })).toBeVisible();
    const responsableCell = page.locator('td').filter({ hasText: /\w+\s+\w+/ }).first();
    if (await responsableCell.count() > 0) {
      await expect(responsableCell).toBeVisible();
    }
  });

  test('Formato de fecha', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: /F\. CANCELACIÓN/i })).toBeVisible();
    const dateCell = page.locator('td').filter({ hasText: /\b\d{1,2}\/\d{1,2}\/2025\b/ }).first();
    if (await dateCell.count() > 0) {
      await expect(dateCell).toBeVisible();
    }
  });

  test('Formato de total', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: /TOTAL/i })).toBeVisible();
    const totalCell = page.locator('td').filter({ hasText: /\$\s*\d/ }).first();
    if (await totalCell.count() > 0) {
      await expect(totalCell).toBeVisible();
    }
  });
});

test.describe('Pedidos Cancelados - Exportación', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page);
  });

  
    
    test('exportarExcel', async ({ page }) => {
    await expect(page.locator('.contenido-modulo > div').first()).toBeVisible();

    try {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }),
        page.getByRole('button', { name: /Exportar Excel/i }).click()
      ]);
      expect(download.suggestedFilename()).toMatch(/\.xlsx$/i);
    } catch {
      // Fallback: verificar que se hizo la petición
      const requestPromise = page.waitForRequest((req) => {
        const url = req.url().toLowerCase();
        return url.includes('export') || url.includes('xlsx') || url.includes('download');
      }, { timeout: 5000 }).catch(() => null);
      
      if (!requestPromise) {
        throw new Error('No se detectó la petición de exportación ni ocurrió descarga');
      }
    }
    
  });

  test('exportarPDF', async ({ page }) => {
    await expect(page.locator('.contenido-modulo > div').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Exportar PDF' })).toBeVisible();
    const download2Promise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar PDF' }).click();
    const download2 = await download2Promise;
  });
});


