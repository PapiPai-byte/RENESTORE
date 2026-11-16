import { pool } from '../src/db';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function main() {
  const adminResult = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@renestore.com', password: 'admin123' }),
  });
  const adminData = await adminResult.json() as any;
  console.log('=== ADMIN LOGIN ===');
  console.log('Status:', adminResult.status);
  console.log('Has accessToken:', !!adminData.accessToken);
  console.log('Has refreshToken:', !!adminData.refreshToken);
  console.log('User role:', adminData.user?.role);
  const adminToken = adminData.accessToken;

  const userResult = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@renestore.com', password: 'user123' }),
  });
  const userData = await userResult.json() as any;
  console.log('\n=== USER LOGIN ===');
  console.log('Status:', userResult.status);
  console.log('Has accessToken:', !!userData.accessToken);
  console.log('User role:', userData.user?.role);
  const userToken = userData.accessToken;
  const userRefresh = userData.refreshToken;

  // GET /products (public)
  console.log('\n=== GET /products (public) ===');
  const productsResult = await fetch(`${BASE_URL}/api/products`);
  const products = await productsResult.json() as any[];
  console.log('Status:', productsResult.status);
  console.log('Count:', products.length);
  console.log('First product has numeric price:', typeof products[0]?.price === 'number');

  // GET /products with filters
  console.log('\n=== GET /products?category=Laptops&sort=price_desc ===');
  const filtered = await fetch(`${BASE_URL}/api/products?category=Laptops&sort=price_desc`);
  const laptops = await filtered.json() as any[];
  console.log('Status:', filtered.status);
  console.log('Count:', laptops.length);
  console.log('All Laptops?', laptops.every((p: any) => p.category === 'Laptops'));
  console.log('Sorted desc?', laptops.every((p: any, i: number) => i === 0 || p.price <= laptops[i - 1].price));

  // GET /auth/me with admin token
  console.log('\n=== GET /auth/me (admin) ===');
  const meAdmin = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const meAdminData = await meAdmin.json() as any;
  console.log('Status:', meAdmin.status);
  console.log('Role:', meAdminData.role);

  // GET /auth/me with user token
  console.log('\n=== GET /auth/me (user) ===');
  const meUser = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const meUserData = await meUser.json() as any;
  console.log('Status:', meUser.status);
  console.log('Role:', meUserData.role);

  // GET /auth/me without token (expect 401)
  console.log('\n=== GET /auth/me (no token) ===');
  const meNoToken = await fetch(`${BASE_URL}/api/auth/me`);
  console.log('Status:', meNoToken.status, '(expect 401)');

  // GET /orders with user token (expect 403)
  console.log('\n=== GET /api/orders (user token) ===');
  const ordersUser = await fetch(`${BASE_URL}/api/orders`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  console.log('Status:', ordersUser.status, '(expect 403)');

  // GET /orders with admin token
  console.log('\n=== GET /api/orders (admin) ===');
  const ordersAdmin = await fetch(`${BASE_URL}/api/orders`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const ordersData = await ordersAdmin.json() as any[];
  console.log('Status:', ordersAdmin.status);
  console.log('Count:', ordersData.length);
  console.log('First order has numeric totalAmount:', typeof ordersData[0]?.totalAmount === 'number');
  console.log('First order items are arrays:', Array.isArray(ordersData[0]?.items));

  // GET /analytics/descriptive
  console.log('\n=== GET /api/analytics/descriptive ===');
  const desc = await fetch(`${BASE_URL}/api/analytics/descriptive`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const descData = await desc.json() as any;
  console.log('Status:', desc.status);
  console.log('KPIs all numbers:',
    typeof descData.kpis.totalRevenue === 'number' &&
    typeof descData.kpis.totalOrders === 'number' &&
    typeof descData.kpis.avgOrderValue === 'number' &&
    typeof descData.kpis.profitMargin === 'number' &&
    typeof descData.kpis.totalCustomers === 'number'
  );
  console.log('salesByMonth count:', descData.salesByMonth?.length);
  console.log('salesByCategory count:', descData.salesByCategory?.length);
  console.log('topProducts count:', descData.topProducts?.length);
  console.log('salesByCity count:', descData.salesByCity?.length);
  console.log('campaignPerformance count:', descData.campaignPerformance?.length);
  const cp = descData.campaignPerformance?.[0];
  if (cp) {
    console.log('campaignPerformance fields all numbers:',
      typeof cp.spend === 'number' && typeof cp.clicks === 'number' &&
      typeof cp.conversions === 'number' && typeof cp.conversionRate === 'number' &&
      typeof cp.costPerConversion === 'number' && typeof cp.roi === 'number'
    );
  }

  // GET /analytics/predictive
  console.log('\n=== GET /api/analytics/predictive?months=6 ===');
  const pred = await fetch(`${BASE_URL}/api/analytics/predictive?months=6`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const predData = await pred.json() as any;
  console.log('Status:', pred.status);
  console.log('method is string:', typeof predData.method === 'string');
  console.log('equation is string:', typeof predData.equation === 'string');
  console.log('rSquared is number:', typeof predData.rSquared === 'number');
  console.log('history count:', predData.history?.length);
  console.log('forecast count:', predData.forecast?.length);
  console.log('channelModels count:', predData.channelModels?.length);
  const cm = predData.channelModels?.[0];
  if (cm) {
    console.log('channelModel fields all numbers:',
      typeof cm.slope === 'number' && typeof cm.intercept === 'number' && typeof cm.rSquared === 'number'
    );
  }

  // POST /analytics/prescriptive
  console.log('\n=== POST /api/analytics/prescriptive ===');
  const prescr = await fetch(`${BASE_URL}/api/analytics/prescriptive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      totalBudget: 100000,
      minPerChannel: { Facebook: 5000, 'Google Ads': 5000, Email: 2000, TikTok: 3000, Instagram: 3000 },
      maxPerChannel: { Facebook: 50000, 'Google Ads': 50000, Email: 20000, TikTok: 30000, Instagram: 25000 },
    }),
  });
  const prescrData = await prescr.json() as any;
  console.log('Status:', prescr.status);
  console.log('method is string:', typeof prescrData.method === 'string');
  console.log('allocation count:', prescrData.allocation?.length);
  console.log('totalExpectedRevenue is number:', typeof prescrData.totalExpectedRevenue === 'number');
  console.log('stockRecommendations count:', prescrData.stockRecommendations?.length);
  console.log('explanation is string:', typeof prescrData.explanation === 'string');
  const alloc = prescrData.allocation?.[0];
  if (alloc) {
    console.log('allocation fields all numbers:',
      typeof alloc.recommendedSpend === 'number' && typeof alloc.expectedRevenue === 'number' && typeof alloc.expectedRoi === 'number'
    );
  }

  // POST /orders as user
  console.log('\n=== POST /api/orders (user) ===');
  const orderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({
      paymentMethod: 'GCash',
      items: [{ productId: 1, quantity: 1 }],
    }),
  });
  const orderData = await orderRes.json() as any;
  console.log('Status:', orderRes.status);
  if (orderRes.status === 201) {
    console.log('Order created:', JSON.stringify({ id: orderData.id, totalAmount: orderData.totalAmount, status: orderData.status }));
    console.log('totalAmount is number:', typeof orderData.totalAmount === 'number');
    console.log('items is array:', Array.isArray(orderData.items));
  } else {
    console.log('Error:', JSON.stringify(orderData));
  }

  // GET /customers as admin
  console.log('\n=== GET /api/customers (admin) ===');
  const custRes = await fetch(`${BASE_URL}/api/customers`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const custData = await custRes.json() as any[];
  console.log('Status:', custRes.status);
  console.log('Count:', custData.length);
  console.log('First customer has numeric id:', typeof custData[0]?.id === 'number');

  // POST /auth/refresh
  console.log('\n=== POST /auth/refresh ===');
  const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: userRefresh }),
  });
  const refreshData = await refreshRes.json() as any;
  console.log('Status:', refreshRes.status);
  console.log('Has new accessToken:', !!refreshData.accessToken);
  console.log('Has new refreshToken:', !!refreshData.refreshToken);
  console.log('User role:', refreshData.user?.role);

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
