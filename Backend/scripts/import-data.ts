import { pool } from '../src/db/index';
import * as fs from 'node:fs';
import * as path from 'node:path';

type CsvRow = { line: number; values: Record<string, string> };

interface ImportSummary {
  table: string;
  rowsRead: number;
  imported: number;
  invalid: number;
  skipped: boolean;
  errors: string[];
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      values.push(value.trim());
      value = '';
    } else {
      value += char;
    }
  }
  values.push(value.trim());
  return values;
}

function readCsv(filePath: string, expectedHeaders: string[]): CsvRow[] | null {
  return readCsvWithHeaders(filePath, [expectedHeaders]);
}

function readCsvWithHeaders(filePath: string, acceptedHeaders: string[][]): CsvRow[] | null {
  if (!fs.existsSync(filePath)) return null;

  const lines = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/);
  const headerLine = lines.shift() || '';
  const headers = parseCsvLine(headerLine);
  const expectedHeaders = acceptedHeaders.find(expected =>
    headers.length === expected.length && headers.every((header, i) => header === expected[i])
  );
  if (!expectedHeaders) {
    const headerOptions = acceptedHeaders.map(expected => expected.join(',')).join(' OR ');
    throw new Error(`${path.basename(filePath)} must have these exact headers: ${headerOptions}`);
  }

  return lines.flatMap((line, index) => {
    if (!line.trim()) return [];
    const values = parseCsvLine(line);
    if (values.length !== headers.length) {
      return [{ line: index + 2, values: { __error: `Expected ${headers.length} columns; found ${values.length}` } }];
    }
    return [{
      line: index + 2,
      values: Object.fromEntries(headers.map((header, i) => [header, values[i]])),
    }];
  });
}

function integer(value: string, field: string, minimum = 0): number {
  if (!/^-?\d+$/.test(value)) throw new Error(`${field} must be an integer`);
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < minimum) throw new Error(`${field} must be at least ${minimum}`);
  return result;
}

function amount(value: string, field: string, minimum = 0): number {
  if (value.trim() === '') throw new Error(`${field} is required`);
  const result = Number(value);
  if (!Number.isFinite(result) || result < minimum) throw new Error(`${field} must be a number at least ${minimum}`);
  return result;
}

function dateOnly(value: string, field: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${field} must use YYYY-MM-DD`);
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`${field} is not a valid calendar date`);
  }
  return value;
}

function required(value: string, field: string): string {
  if (!value.trim()) throw new Error(`${field} is required`);
  return value.trim();
}

function optionalHttpUrl(value: string, field: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(`${field} must be a valid absolute URL`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${field} must use http or https`);
  }
  return trimmed;
}

function summary(table: string, rows: CsvRow[] | null): ImportSummary {
  return {
    table,
    rowsRead: rows?.length || 0,
    imported: 0,
    invalid: 0,
    skipped: rows === null,
    errors: [],
  };
}

async function attemptRow(
  client: Awaited<ReturnType<typeof pool.connect>>,
  result: ImportSummary,
  row: CsvRow,
  insert: () => Promise<boolean>
): Promise<void> {
  if (row.values.__error) {
    result.invalid++;
    result.errors.push(`Row ${row.line}: ${row.values.__error}`);
    return;
  }

  try {
    await client.query('BEGIN');
    const inserted = await insert();
    await client.query(inserted ? 'COMMIT' : 'ROLLBACK');
    if (inserted) {
      result.imported++;
    } else {
      result.invalid++;
      result.errors.push(`Row ${row.line}: ID already exists; existing record was kept`);
    }
  } catch (error) {
    await client.query('ROLLBACK');
    result.invalid++;
    result.errors.push(`Row ${row.line}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main(): Promise<void> {
  const client = await pool.connect();
  const importDir = path.resolve('data/import');
  const summaries: ImportSummary[] = [];

  try {
    const supplierRows = readCsv(path.join(importDir, 'suppliers.csv'), ['id', 'name']);
    const supplierSummary = summary('suppliers', supplierRows);
    summaries.push(supplierSummary);
    const supplierNames = new Set<string>();
    if (supplierRows) {
      for (const row of supplierRows) {
        await attemptRow(client, supplierSummary, row, async () => {
          const id = integer(row.values.id, 'id', 1);
          const name = required(row.values.name, 'name');
          supplierNames.add(name);
          const result = await client.query(
            'INSERT INTO suppliers (id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id',
            [id, name]
          );
          return result.rowCount === 1;
        });
      }
    }

    const supplierIdsResult = await client.query('SELECT id FROM suppliers');
    const supplierIds = new Set<number>(supplierIdsResult.rows.map((row: { id: number }) => Number(row.id)));
    const productIdsResult = await client.query('SELECT id FROM products');
    const productIds = new Set<number>(productIdsResult.rows.map((row: { id: number }) => Number(row.id)));
    const customerIdsResult = await client.query('SELECT id FROM customers');
    const customerIds = new Set<number>(customerIdsResult.rows.map((row: { id: number }) => Number(row.id)));
    const channels = new Set(['Facebook', 'Google Ads', 'Email', 'TikTok', 'Instagram']);
    const categories = new Set(['Tools', 'Accessories', 'Computers', 'Laptops']);
    const segments = new Set(['Regular', 'Premium', 'Business']);
    const paymentMethods = new Set(['Card', 'GCash', 'COD', 'Bank Transfer']);
    const statuses = new Set(['pending', 'completed', 'cancelled']);

    const productRows = readCsvWithHeaders(path.join(importDir, 'products.csv'), [
      ['product_name', 'category', 'brand', 'cost_price', 'selling_price', 'stock', 'reorder_level', 'supplier', 'image_url'],
      ['id', 'name', 'category', 'brand', 'cost_price', 'selling_price', 'stock', 'reorder_level', 'supplier_id'],
    ]);
    const productSummary = summary('products', productRows);
    summaries.push(productSummary);
    if (productRows) {
      for (const row of productRows) {
        await attemptRow(client, productSummary, row, async () => {
          const usesSupplierName = Object.prototype.hasOwnProperty.call(row.values, 'product_name');
          const id = usesSupplierName ? null : integer(row.values.id, 'id', 1);
          const name = required(usesSupplierName ? row.values.product_name : row.values.name, 'product_name');
          const category = required(row.values.category, 'category');
          const brand = required(row.values.brand, 'brand');
          const cost = amount(row.values.cost_price, 'cost_price');
          const price = amount(row.values.selling_price, 'selling_price');
          const stock = integer(row.values.stock, 'stock');
          const reorderLevel = integer(row.values.reorder_level, 'reorder_level');
          const imageUrl = usesSupplierName ? optionalHttpUrl(row.values.image_url, 'image_url') : null;
          if (!categories.has(category)) throw new Error(`Unknown category "${category}"`);
          let supplierId: number;
          let supplierWasInserted = false;
          if (usesSupplierName) {
            const supplierName = required(row.values.supplier, 'supplier');
            const duplicate = await client.query(
              'SELECT id FROM products WHERE name = $1 AND category = $2 AND brand = $3 LIMIT 1',
              [name, category, brand]
            );
            if (duplicate.rowCount) throw new Error('Product already exists; existing record was kept');

            if (!supplierNames.has(supplierName)) {
              supplierNames.add(supplierName);
              supplierSummary.rowsRead++;
              supplierSummary.skipped = false;
            }
            const insertedSupplier = await client.query(
              'INSERT INTO suppliers (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id',
              [supplierName]
            );
            if (insertedSupplier.rowCount === 1) {
              supplierWasInserted = true;
              supplierId = Number(insertedSupplier.rows[0].id);
            } else {
              const existingSupplier = await client.query(
                'SELECT id FROM suppliers WHERE name = $1 LIMIT 1',
                [supplierName]
              );
              if (!existingSupplier.rowCount) throw new Error(`Supplier "${supplierName}" could not be resolved`);
              supplierId = Number(existingSupplier.rows[0].id);
            }
            supplierIds.add(supplierId);
          } else {
            supplierId = integer(row.values.supplier_id, 'supplier_id', 1);
            if (!supplierIds.has(supplierId)) throw new Error(`supplier_id ${supplierId} does not exist`);
          }

          const values = [name, category, brand, cost, price, stock, reorderLevel, supplierId];
          const result = usesSupplierName
            ? await client.query(
              `INSERT INTO products (name, category, brand, cost, price, stock, reorder_level, supplier_id, image_url)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
              [...values, imageUrl]
            )
            : await client.query(
              `INSERT INTO products (id, name, category, brand, cost, price, stock, reorder_level, supplier_id)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING RETURNING id`,
              [id, ...values]
            );
          if (result.rowCount === 1) {
            productIds.add(Number(result.rows[0].id));
            if (supplierWasInserted) supplierSummary.imported++;
          }
          return result.rowCount === 1;
        });
      }
    }

    const customerRows = readCsv(path.join(importDir, 'customers.csv'), [
      'id', 'name', 'city', 'registration_date', 'segment',
    ]);
    const customerSummary = summary('customers', customerRows);
    summaries.push(customerSummary);
    if (customerRows) {
      for (const row of customerRows) {
        await attemptRow(client, customerSummary, row, async () => {
          const id = integer(row.values.id, 'id', 1);
          const name = required(row.values.name, 'name');
          const city = required(row.values.city, 'city');
          const registrationDate = dateOnly(row.values.registration_date, 'registration_date');
          const segment = required(row.values.segment, 'segment');
          if (!segments.has(segment)) throw new Error(`Unknown segment "${segment}"`);
          const result = await client.query(
            `INSERT INTO customers (id, name, city, signup_date, segment)
             VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING id`,
            [id, name, city, registrationDate, segment]
          );
          if (result.rowCount === 1) customerIds.add(id);
          return result.rowCount === 1;
        });
      }
    }

    const orderRows = readCsv(path.join(importDir, 'orders.csv'), [
      'id', 'customer_id', 'product_id', 'quantity', 'total_amount', 'order_date', 'payment_method', 'status', 'shipping_cost',
    ]);
    const orderSummary = summary('orders', orderRows);
    summaries.push(orderSummary);
    if (orderRows) {
      for (const row of orderRows) {
        await attemptRow(client, orderSummary, row, async () => {
          const id = integer(row.values.id, 'id', 1);
          const customerId = integer(row.values.customer_id, 'customer_id', 1);
          const productId = integer(row.values.product_id, 'product_id', 1);
          const quantity = integer(row.values.quantity, 'quantity', 1);
          const total = amount(row.values.total_amount, 'total_amount');
          const orderDate = dateOnly(row.values.order_date, 'order_date');
          const paymentMethod = required(row.values.payment_method, 'payment_method');
          const status = required(row.values.status, 'status');
          const shippingCost = amount(row.values.shipping_cost, 'shipping_cost');
          if (!customerIds.has(customerId)) throw new Error(`customer_id ${customerId} does not exist`);
          if (!productIds.has(productId)) throw new Error(`product_id ${productId} does not exist`);
          if (!paymentMethods.has(paymentMethod)) throw new Error(`Unknown payment_method "${paymentMethod}"`);
          if (!statuses.has(status)) throw new Error(`Unknown status "${status}"`);
          if (shippingCost > total) throw new Error('shipping_cost cannot exceed total_amount');

          const inserted = await client.query(
            `INSERT INTO orders (id, customer_id, total_amount, order_date, payment_method, status, shipping_cost)
             VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING RETURNING id`,
            [id, customerId, total, orderDate, paymentMethod, status, shippingCost]
          );
          if (inserted.rowCount !== 1) return false;
          await client.query(
            'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1,$2,$3,$4)',
            [id, productId, quantity, (total - shippingCost) / quantity]
          );
          return true;
        });
      }
    }

    const campaignRows = readCsv(path.join(importDir, 'marketing_campaigns.csv'), [
      'id', 'channel', 'start_date', 'end_date', 'budget_spent', 'impressions', 'clicks', 'orders_generated', 'revenue_generated',
    ]);
    const campaignSummary = summary('marketing_campaigns', campaignRows);
    summaries.push(campaignSummary);
    if (campaignRows) {
      for (const row of campaignRows) {
        await attemptRow(client, campaignSummary, row, async () => {
          const id = integer(row.values.id, 'id', 1);
          const channel = required(row.values.channel, 'channel');
          const startDate = dateOnly(row.values.start_date, 'start_date');
          const endDate = dateOnly(row.values.end_date, 'end_date');
          const spend = amount(row.values.budget_spent, 'budget_spent');
          const impressions = integer(row.values.impressions, 'impressions');
          const clicks = integer(row.values.clicks, 'clicks');
          const orders = integer(row.values.orders_generated, 'orders_generated');
          const revenue = amount(row.values.revenue_generated, 'revenue_generated');
          if (!channels.has(channel)) throw new Error(`Unknown channel "${channel}"`);
          if (endDate < startDate) throw new Error('end_date cannot be before start_date');
          if (clicks > impressions) throw new Error('clicks cannot exceed impressions');
          const result = await client.query(
            `INSERT INTO marketing_campaigns
              (id, channel, start_date, end_date, budget, spend, impressions, clicks, conversions, orders_generated, revenue_generated)
             VALUES ($1,$2,$3,$4,$5,$5,$6,$7,$8,$8,$9) ON CONFLICT DO NOTHING RETURNING id`,
            [id, channel, startDate, endDate, spend, impressions, clicks, orders, revenue]
          );
          return result.rowCount === 1;
        });
      }
    }

    const purchaseRows = readCsv(path.join(importDir, 'inventory_purchases.csv'), [
      'id', 'supplier', 'product_id', 'quantity', 'unit_cost', 'purchase_date', 'lead_time_days',
    ]);
    const purchaseSummary = summary('inventory_purchases', purchaseRows);
    summaries.push(purchaseSummary);
    if (purchaseRows) {
      for (const row of purchaseRows) {
        await attemptRow(client, purchaseSummary, row, async () => {
          const id = integer(row.values.id, 'id', 1);
          const supplier = required(row.values.supplier, 'supplier');
          const productId = integer(row.values.product_id, 'product_id', 1);
          const quantity = integer(row.values.quantity, 'quantity', 1);
          const unitCost = amount(row.values.unit_cost, 'unit_cost');
          const purchaseDate = dateOnly(row.values.purchase_date, 'purchase_date');
          const leadTime = integer(row.values.lead_time_days, 'lead_time_days');
          if (!productIds.has(productId)) throw new Error(`product_id ${productId} does not exist`);
          const result = await client.query(
            `INSERT INTO inventory_purchases (id, supplier, product_id, quantity, unit_cost, purchase_date, lead_time_days)
             VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING RETURNING id`,
            [id, supplier, productId, quantity, unitCost, purchaseDate, leadTime]
          );
          return result.rowCount === 1;
        });
      }
    }

    for (const table of ['suppliers', 'products', 'customers', 'orders', 'marketing_campaigns', 'inventory_purchases']) {
      await client.query(
        `SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), EXISTS (SELECT 1 FROM ${table}))`,
        [table]
      );
    }

    console.log('Import report (existing records are never deleted or overwritten):');
    for (const result of summaries) {
      console.log(
        `${result.table}: ${result.skipped ? 'no CSV supplied' : `${result.rowsRead} read, ${result.imported} imported, ${result.invalid} rejected`}`
      );
      for (const error of result.errors) console.log(`  - ${error}`);
    }

    console.log('Current row counts:');
    for (const table of ['products', 'customers', 'orders', 'marketing_campaigns', 'inventory_purchases']) {
      const count = await client.query(`SELECT COUNT(*) AS count FROM ${table}`);
      console.log(`  ${table}: ${count.rows[0].count}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error('Import failed:', error);
  process.exitCode = 1;
});
