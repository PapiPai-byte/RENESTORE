import { hashPassword } from '../utils/password';
import { users, customers, products, orders, orderItems, transactions, marketingCampaigns, faqs } from './schema';
import { db } from './index';
import { eq } from 'drizzle-orm';

const adminPasswordHash = await hashPassword('admin123');
const userPasswordHash = await hashPassword('user123');

// Create admin and user accounts
const [adminUser, regularUser] = await db
  .insert(users)
  .values([
    { name: 'Admin User', email: 'admin@renestore.com', passwordHash: adminPasswordHash, role: 'admin' },
    { name: 'Juan Dela Cruz', email: 'user@renestore.com', passwordHash: userPasswordHash, role: 'user' },
  ])
  .returning();

// Create customer linked to the regular user
const [customer] = await db
  .insert(customers)
  .values({
    userId: regularUser.id,
    name: 'Juan Dela Cruz',
    email: 'user@renestore.com',
    city: 'Manila',
    segment: 'Regular',
  })
  .returning();

const philippineCities = ['Manila', 'Quezon City', 'Makati', 'Cebu City', 'Davao'];
const segments = ['Regular', 'Premium', 'Business'] as const;
const channels = ['Facebook', 'Google Ads', 'Email', 'TikTok', 'Instagram'] as const;

// Seed 60 customers
const customerNames = [
  'Juan Dela Cruz', 'Maria Santos', 'Pedro Reyes', 'Ana Garcia', 'Jose Rodriguez',
  'Linda Fernandez', 'Carlos Mendoza', 'Rosa Bautista', 'Miguel Torres', 'Elena Cruz',
  'Ramon Silva', 'Teresa Gomez', 'Antonio Ramos', 'Carmen Lopez', 'Francisco Diaz',
  'Soledad Morales', 'Ricardo Vargas', 'Isabella Castro', 'Andres Ortiz', 'Lucia Medina',
  'Diego Flores', 'Patricia Jimenez', 'Roberto Ruiz', 'Gabriela Herrera', 'Fernando Aguilar',
  'Adriana Navarro', 'Alejandro Torres', 'Valeria Rivas', 'Sebastian Ramos', 'Camila Perez',
  'Mateo Sanchez', 'Valentina Ramirez', 'Emiliano Torres', 'Helena Jiménez', 'Santiago Ortiz',
  'Mariana Vargas', 'Nicolás Moreno', 'Ximena Suárez', 'Lucas Castillo', 'Sofía Reyes',
  'Daniel Guerrero', 'Paula Mendoza', 'Andrés Castro', 'Daniela Flores', 'Javier Morales',
  'Carolina Ruiz', 'Rodrigo Peña', 'Andrea Segura', 'Felipe Espinoza', 'Natalia Ponce',
  'Gonzalo Ríos', 'Catalina Soto', 'Tomás Delgado', 'Alejandra Fuentes', 'Martín Rojas',
  'Victoria Campos', 'Ignacio Peña', 'Clara Guzmán', 'Enrique Paredes', 'Paulina Contreras',
];

const seededCustomers = await db
  .insert(customers)
  .values(
    Array.from({ length: 60 }, (_, i) => ({
      name: customerNames[i] ?? `Customer ${i + 1}`,
      email: `customer${i + 1}@renestore.com`,
      city: philippineCities[i % philippineCities.length],
      segment: segments[i % segments.length],
    }))
  )
  .returning();

// Override the first customer with the real user link
await db.update(customers).set({ userId: regularUser.id }).where(eq(customers.id, customer.id));

// Seed 60 products (15 per category)
const productData = [
  // Tools (15)
  { name: 'Pro Cordless Drill 20V', category: 'Tools' as const, brand: 'Bosch', price: 6500, cost: 3500, stock: 30 },
  { name: 'Impact Driver Kit', category: 'Tools' as const, brand: 'DeWalt', price: 8999, cost: 5200, stock: 22 },
  { name: 'Reciprocating Saw', category: 'Tools' as const, brand: 'Makita', price: 7500, cost: 4000, stock: 18 },
  { name: 'Angle Grinder 4.5"', category: 'Tools' as const, brand: 'Bosch', price: 3200, cost: 1800, stock: 40 },
  { name: 'Circular Saw 7-1/4"', category: 'Tools' as const, brand: 'DeWalt', price: 5800, cost: 3200, stock: 25 },
  { name: 'Rotary Hammer Drill', category: 'Tools' as const, brand: 'Makita', price: 12500, cost: 7000, stock: 12 },
  { name: 'Jigsaw Pro', category: 'Tools' as const, brand: 'Bosch', price: 4200, cost: 2400, stock: 35 },
  { name: 'Orbital Sander', category: 'Tools' as const, brand: 'Makita', price: 3800, cost: 2000, stock: 28 },
  { name: 'Power Tool Combo 5-Pack', category: 'Tools' as const, brand: 'DeWalt', price: 18999, cost: 12000, stock: 10 },
  { name: 'Hammer Drill Set', category: 'Tools' as const, brand: 'Bosch', price: 9500, cost: 5500, stock: 15 },
  { name: 'Precision Screwdriver Set 64pc', category: 'Tools' as const, brand: 'iFixit', price: 1299, cost: 600, stock: 60 },
  { name: 'Soldering Station Pro', category: 'Tools' as const, brand: 'Weller', price: 4500, cost: 2800, stock: 18 },
  { name: 'Wire Strripper Auto', category: 'Tools' as const, brand: 'Klein', price: 1899, cost: 900, stock: 45 },
  { name: 'Digital Multimeter', category: 'Tools' as const, brand: 'Fluke', price: 3500, cost: 1800, stock: 32 },
  { name: 'Heat Gun 2000W', category: 'Tools' as const, brand: 'Bosch', price: 2800, cost: 1500, stock: 25 },
  // Accessories (15)
  { name: 'Mechanical Keyboard RGB', category: 'Accessories' as const, brand: 'Logitech', price: 4999, cost: 2500, stock: 50 },
  { name: 'Wireless Mouse Pro', category: 'Accessories' as const, brand: 'Razer', price: 3499, cost: 1800, stock: 35 },
  { name: 'USB-C Docking Station', category: 'Accessories' as const, brand: 'Dell', price: 8999, cost: 5000, stock: 22 },
  { name: 'Monitor 27" 4K IPS', category: 'Accessories' as const, brand: 'Samsung', price: 28500, cost: 18000, stock: 15 },
  { name: 'Webcam HD 1080p', category: 'Accessories' as const, brand: 'Logitech', price: 2999, cost: 1500, stock: 40 },
  { name: 'Noise Cancelling Headphones', category: 'Accessories' as const, brand: 'Sony', price: 8999, cost: 5000, stock: 28 },
  { name: 'Gaming Mouse Pad XL', category: 'Accessories' as const, brand: 'Razer', price: 1299, cost: 500, stock: 60 },
  { name: 'USB Hub 7-Port', category: 'Accessories' as const, brand: 'Anker', price: 1899, cost: 800, stock: 45 },
  { name: 'Laptop Stand Aluminum', category: 'Accessories' as const, brand: 'Rain Design', price: 2499, cost: 1200, stock: 35 },
  { name: 'External SSD 1TB', category: 'Accessories' as const, brand: 'Samsung', price: 5999, cost: 3500, stock: 30 },
  { name: 'HDMI Cable 2.1 2m', category: 'Accessories' as const, brand: 'Belkin', price: 899, cost: 300, stock: 80 },
  { name: 'Wireless Charger Pad', category: 'Accessories' as const, brand: 'Anker', price: 1499, cost: 600, stock: 55 },
  { name: 'Surge Protector 12-Outlet', category: 'Accessories' as const, brand: 'APC', price: 2299, cost: 1100, stock: 40 },
  { name: 'Desk Lamp LED', category: 'Accessories' as const, brand: 'BenQ', price: 3200, cost: 1600, stock: 30 },
  { name: 'Cable Management Kit', category: 'Accessories' as const, brand: 'J-Chief', price: 1299, cost: 400, stock: 70 },
  // Computers (15)
  { name: 'Desktop PC Master', category: 'Computers' as const, brand: 'ReneTech', price: 65000, cost: 45000, stock: 18 },
  { name: 'All-in-One Desktop AIO 27"', category: 'Computers' as const, brand: 'Apple', price: 85000, cost: 60000, stock: 8 },
  { name: 'Workstation Tower Pro', category: 'Computers' as const, brand: 'Lenovo', price: 95000, cost: 70000, stock: 5 },
  { name: 'Budget Desktop i3', category: 'Computers' as const, brand: 'HP', price: 28999, cost: 18000, stock: 25 },
  { name: 'Mini PC N100', category: 'Computers' as const, brand: 'Intel', price: 18999, cost: 12000, stock: 30 },
  { name: 'Gaming Desktop RTX 4070', category: 'Computers' as const, brand: 'ReneTech', price: 78000, cost: 55000, stock: 10 },
  { name: 'Home Office PC', category: 'Computers' as const, brand: 'Dell', price: 42000, cost: 28000, stock: 20 },
  { name: 'Creative Workstation', category: 'Computers' as const, brand: 'Apple', price: 120000, cost: 85000, stock: 4 },
  { name: 'Entry Level Desktop', category: 'Computers' as const, brand: 'HP', price: 22000, cost: 14000, stock: 35 },
  { name: 'Mid-Range Desktop i5', category: 'Computers' as const, brand: 'Lenovo', price: 52000, cost: 35000, stock: 15 },
  { name: 'Compact ITX Build', category: 'Computers' as const, brand: 'ASUS', price: 55000, cost: 38000, stock: 12 },
  { name: 'Server Tower', category: 'Computers' as const, brand: 'Dell', price: 150000, cost: 110000, stock: 3 },
  { name: 'Graphics Workstation', category: 'Computers' as const, brand: 'HP', price: 110000, cost: 80000, stock: 6 },
  { name: 'Thin Client PC', category: 'Computers' as const, brand: 'Lenovo', price: 25000, cost: 16000, stock: 22 },
  { name: 'Budget AIO 22"', category: 'Computers' as const, brand: 'HP', price: 38000, cost: 25000, stock: 14 },
  // Laptops (15)
  { name: 'Pro Gaming Laptop X1', category: 'Laptops' as const, brand: 'ReneTech', price: 89999, cost: 65000, stock: 12 },
  { name: 'Business Laptop Pro 15', category: 'Laptops' as const, brand: 'Dell', price: 72500, cost: 52000, stock: 25 },
  { name: 'Budget Laptop 14', category: 'Laptops' as const, brand: 'HP', price: 34999, cost: 24000, stock: 40 },
  { name: 'Ultrabook Slim 13', category: 'Laptops' as const, brand: 'Apple', price: 68000, cost: 48000, stock: 18 },
  { name: 'Creator Laptop 17"', category: 'Laptops' as const, brand: 'ASUS', price: 95000, cost: 70000, stock: 8 },
  { name: 'Student Notebook 15', category: 'Laptops' as const, brand: 'Lenovo', price: 29999, cost: 19000, stock: 45 },
  { name: '2-in-1 Convertible', category: 'Laptops' as const, brand: 'HP', price: 52000, cost: 35000, stock: 15 },
  { name: 'Business UltraBook 14', category: 'Laptops' as const, brand: 'Dell', price: 65000, cost: 45000, stock: 20 },
  { name: 'Gaming Laptop ROG', category: 'Laptops' as const, brand: 'ASUS', price: 85000, cost: 60000, stock: 10 },
  { name: 'Chromebook 11"', category: 'Laptops' as const, brand: 'Lenovo', price: 18999, cost: 12000, stock: 50 },
  { name: 'MacBook Air M3', category: 'Laptops' as const, brand: 'Apple', price: 59999, cost: 42000, stock: 22 },
  { name: 'MacBook Pro 14" M4', category: 'Laptops' as const, brand: 'Apple', price: 115000, cost: 85000, stock: 6 },
  { name: 'ThinkPad T Series', category: 'Laptops' as const, brand: 'Lenovo', price: 62000, cost: 44000, stock: 16 },
  { name: 'Budget Gaming Laptop', category: 'Laptops' as const, brand: 'Acer', price: 42000, cost: 28000, stock: 20 },
  { name: 'Workstation Mobile', category: 'Laptops' as const, brand: 'ReneTech', price: 98000, cost: 72000, stock: 7 },
];

const seededProducts = await db.insert(products).values(productData).returning();

// Seed 150+ orders across 12 months
const months = [
  '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
  '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
];

const allCustomers = [customer, ...seededCustomers];
const statuses = ['pending', 'completed', 'cancelled'] as const;

// Generate campaigns for each channel
const campaignData = channels.flatMap((channel, ci) => {
  const names = {
    Facebook: ['Facebook Spring Sale', 'Facebook Summer Promo', 'Facebook Holiday Blast'],
    'Google Ads': ['Google Search Branded', 'Google Shopping Feed', 'Google Display Retargeting'],
    Email: ['Email Newsletter Q1', 'Email Flash Sale', 'Email Loyalty Rewards'],
    TikTok: ['TikTok Influencer Collab', 'TikTok viral Challenge', 'TikTok Shop Live'],
    Instagram: ['Instagram Reels Campaign', 'Instagram Story Ads', 'Instagram Shop Launch'],
  };
  return names[channel].map((name, ni) => ({
    name,
    channel,
    startDate: new Date(`2025-${String((ni * 4) + 1).padStart(2, '0')}-01`),
    endDate: new Date(`2025-${String((ni * 4) + 3).padStart(2, '0')}-28`),
    budget: [30000, 25000, 20000, 15000, 18000][ci],
    spend: [28000, 23000, 18000, 14000, 16000][ci],
    clicks: [12000, 9500, 3200, 15000, 8000][ci],
    conversions: [480, 420, 160, 375, 240][ci],
  }));
});

const seededCampaigns = await db.insert(marketingCampaigns).values(campaignData).returning();

// Generate 160 orders spread across 12 months
const seededOrders: typeof orders.$inferInsert[] = [];
const seededOrderItems: typeof orderItems.$inferInsert[] = [];
const seededTransactions: typeof transactions.$inferInsert[] = [];

for (let m = 0; m < 12; m++) {
  const monthOrders = 12 + Math.floor(Math.random() * 5); // 12-16 orders per month
  for (let o = 0; o < monthOrders; o++) {
    const numItems = 1 + Math.floor(Math.random() * 4); // 1-4 items per order
    const itemIds = new Set<number>();
    while (itemIds.size < numItems) {
      itemIds.add(Math.floor(Math.random() * seededProducts.length) + 1);
    }

    let total = 0;
    const items = Array.from(itemIds).map((pid) => {
      const prod = seededProducts[pid - 1];
      const qty = 1 + Math.floor(Math.random() * 3);
      const unitPrice = prod.price;
      total += unitPrice * qty;
      seededOrderItems.push({
        orderId: 0, // placeholder
        productId: pid,
        quantity: qty,
        unitPrice,
      });
      return { productId: pid, quantity: qty, unitPrice };
    });

    const day = 1 + Math.floor(Math.random() * 28);
    const orderDate = new Date(`${months[m]}-${String(day).padStart(2, '0')}T${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`);
    const status = Math.random() < 0.1 ? 'cancelled' : Math.random() < 0.15 ? 'pending' : 'completed';

    seededOrders.push({
      customerId: allCustomers[Math.floor(Math.random() * allCustomers.length)].id,
      campaignId: seededCampaigns[Math.floor(Math.random() * seededCampaigns.length)].id,
      orderDate,
      totalAmount: total,
      status,
    });
  }
}

// Insert orders and fix orderItems with real IDs
const insertedOrders = await db.insert(orders).values(seededOrders).returning();
for (let i = 0; i < insertedOrders.length; i++) {
  const orderItemsForOrder = seededOrderItems.filter((_, idx) => {
    // Distribute order items proportionally
    const start = Math.floor((i / insertedOrders.length) * seededOrderItems.length);
    const end = Math.floor(((i + 1) / insertedOrders.length) * seededOrderItems.length);
    return idx >= start && idx < end;
  });

  for (const oi of orderItemsForOrder) {
    await db.insert(orderItems).values({ ...oi, orderId: insertedOrders[i].id });
  }

  // Create transaction for completed orders
  if (insertedOrders[i].status === 'completed') {
    const paymentMethods = ['Card', 'GCash', 'COD', 'Bank Transfer'] as const;
    seededTransactions.push({
      orderId: insertedOrders[i].id,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      amount: insertedOrders[i].totalAmount,
      status: 'completed',
    });
  }
}

await db.insert(transactions).values(seededTransactions);

// Decrement stock based on orders
for (const item of seededOrderItems) {
  const prod = seededProducts.find(p => p.id === item.productId);
  if (prod) {
    const newStock = Math.max(0, prod.stock - item.quantity);
    await db.update(products).set({ stock: newStock }).where(eq(products.id, item.productId));
  }
}

// Seed FAQs (idempotent - check existence first)
const existingFaqCount = await db.select({ count: faqs.id }).from(faqs).limit(1);
if (existingFaqCount.length === 0) {
  await db.insert(faqs).values([
    { question: 'What payment methods do you accept?', answer: 'We accept Card, GCash, COD (Cash on Delivery), and Bank Transfer. GCash and bank transfer orders are confirmed within 24 hours.', category: 'payment', page: 'checkout' },
    { question: 'How long does delivery take?', answer: 'Standard delivery is 3-7 business days within Metro Manila and 7-14 business days for provincial areas. Express shipping is available at checkout.', category: 'shipping', page: 'checkout' },
    { question: 'Do you offer a warranty on products?', answer: 'Yes. All ReneStore-branded products come with a 1-year manufacturer warranty. Third-party brands follow their respective warranty terms — check each product page for details.', category: 'warranty', page: 'product' },
    { question: 'Can I return or exchange an item?', answer: 'You may return or exchange items within 14 days of delivery if they are unused and in original packaging. Return shipping costs are covered only for defective items.', category: 'returns', page: 'product' },
    { question: 'Is my personal data safe on ReneStore?', answer: 'Absolutely. We use industry-standard encryption (TLS/SSL) and never store full credit card details on our servers. Payment processing is handled by secure third-party gateways.', category: 'privacy', page: 'all' },
    { question: 'How can I track my order?', answer: 'Once your order is shipped, you will receive a tracking number via email and SMS. You can also view order status anytime by logging into your ReneStore account under "My Orders."', category: 'shipping', page: 'checkout' },
    { question: 'Do you ship internationally?', answer: 'Currently we only ship within the Philippines. International shipping is planned for Q2 2026 — join our newsletter for updates.', category: 'shipping', page: 'all' },
    { question: 'How do I contact customer support?', answer: 'Reach us at support@renestore.com or through the live chat widget on this site. Our support team is available Monday to Saturday, 9 AM – 6 PM Philippine Time.', category: 'support', page: 'all' },
    { question: 'What is your price-match guarantee?', answer: 'If you find the same product at a lower advertised price from an authorized retailer within 30 days of purchase, contact support with proof and we will refund the difference.', category: 'pricing', page: 'product' },
    { question: 'Are your products genuine and authentic?', answer: 'Yes. ReneStore is an authorized reseller for all major brands we carry. Every product comes with a valid warranty card and proof of authenticity.', category: 'warranty', page: 'all' },
    { question: 'How do I create an account or register?', answer: 'Click the sign-up button on our homepage and enter your name, email, and a password. You can also register using your Google or Facebook account for faster checkout.', category: 'account', page: 'all' },
    { question: 'Can I cancel or modify my order after placing it?', answer: 'You may cancel or modify an order within 1 hour of placement before it enters processing. Go to My Orders and select Cancel or Edit—if the button is grayed out, contact support immediately.', category: 'orders', page: 'checkout' },
    { question: 'How long does a refund take to process?', answer: 'Refunds are processed within 3–5 business days after we receive the returned item. Card refunds appear on your statement in 5–7 days; GCash refunds are instant once approved.', category: 'returns', page: 'product' },
    { question: 'Do you offer free shipping?', answer: 'Orders above PHP 5,000 qualify for free standard shipping nationwide. For orders below PHP 5,000, a flat shipping fee of PHP 150 applies within Metro Manila and PHP 250 for provincial deliveries.', category: 'shipping', page: 'checkout' },
    { question: 'What is your warranty coverage?', answer: 'ReneStore-branded items come with a 1-year warranty covering manufacturing defects. Third-party brands follow their own warranty terms (typically 6 months to 1 year). Damage from misuse, accidents, or unauthorized repairs is not covered.', category: 'warranty', page: 'product' },
    { question: 'How do I track my shipment?', answer: 'A tracking number is sent to your email and SMS as soon as your order is shipped. Visit the courier website (LBC, J&T, or Shopee Xpress) and paste the tracking number to see real-time delivery updates.', category: 'shipping', page: 'checkout' },
    { question: 'Can I pay using installment or credit? ', answer: 'We accept installment payments through GCash Installment and Credit Card (0% interest for 3 months on purchases above PHP 10,000). Select the option at checkout.', category: 'payment', page: 'checkout' },
    { question: 'Do you have physical store locations?', answer: 'ReneStore operates online only at the moment. We plan to open a showrooms in Makati and Cebu City by mid-2026—follow us on social media for announcements.', category: 'support', page: 'all' },
    { question: 'How do I report a defective or wrong item received?', answer: 'Take photos of the item and packaging, then email support@renestore.com with your order number within 48 hours of delivery. We will arrange a replacement or full refund at no extra cost.', category: 'returns', page: 'product' },
    { question: 'Is there a loyalty or rewards program?', answer: 'Yes! ReneStore Rewards gives you 1% cashback on every purchase in points. Redeem points for discounts at checkout. Premium and Business segment customers enjoy an additional 2% bonus.', category: 'general', page: 'all' },
    { question: 'Can I place a bulk or wholesale order?', answer: 'Absolutely. For orders of 10+ units of the same product, email sales@renestore.com with your requirements. We offer volume discounts starting at 5% off for 10+ units and up to 15% off for 50+ units.', category: 'sales', page: 'all' },
    { question: 'What courier services do you use?', answer: 'We ship via LBC Express, J&T PH, and Shopee Xpress depending on your location. Express options (next-day Metro Manila) are available at checkout for an additional fee.', category: 'shipping', page: 'checkout' },
    { question: 'How do I leave a product review?', answer: 'After receiving your order, go to My Orders, click Leave Review next to the product, and rate it 1–5 stars with optional photos. Reviews help other shoppers make informed decisions.', category: 'general', page: 'product' },
    { question: 'Do you offer gift wrapping or custom packaging?', answer: 'Standard orders arrive in branded ReneStore packaging at no extra charge. Custom gift wrapping is not currently available, but you can add a handwritten note (up to 50 characters) at checkout for free.', category: 'shipping', page: 'checkout' },
    { question: 'What should I do if my discount code did not work?', answer: 'Discount codes must be entered at checkout before payment. Ensure the code has not expired, apply it to eligible items only, and check that your cart meets the minimum spend requirement. If issues persist, contact support with the code and screenshot.', category: 'pricing', page: 'checkout' },
    { question: 'Can I change my delivery address after ordering?', answer: 'Address changes are accepted within 1 hour of order placement, provided the package has not yet been handed to the courier. Email support@renestore.com immediately with your new address and order number.', category: 'shipping', page: 'checkout' },
    { question: 'Are laptops and computers compatible with Philippine power outlets?', answer: 'All electronic products sold by ReneStore are designed for 220V/60Hz Philippine power standards and come with Type A/B/C plugs. No voltage converter is needed.', category: 'product', page: 'product' },
    { question: 'What payment method is fastest for order confirmation?', answer: 'GCash and Bank Transfer orders are confirmed within 24 hours. Card payments are confirmed instantly. COD orders are confirmed once the courier picks up your payment upon delivery.', category: 'payment', page: 'checkout' },
    { question: 'Do you provide invoices for business purchases?', answer: 'Yes. Official receipts and VAT invoices are automatically generated and emailed to you after payment confirmation. They can also be downloaded from your Order Details page.', category: 'account', page: 'checkout' },
  ]);
}

console.log(`Seeded: ${adminUser.email} (admin), ${regularUser.email} (user)`);
console.log(`Customers: ${allCustomers.length}`);
console.log(`Products: ${seededProducts.length}`);
console.log(`Orders: ${insertedOrders.length}`);
console.log(`Transactions: ${seededTransactions.length}`);
console.log(`Campaigns: ${seededCampaigns.length}`);
console.log(`FAQs: inserted new FAQs`);
