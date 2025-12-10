/**
 * Realistic Data Seeding Script
 * Generates realistic customer profiles with authentic journeys, product catalogs, and behavioral patterns
 */
import { initDb } from '../shared/db/src/index';
import { dbConfig } from '../shared/config/src/index';
import { generateHash, normalizePhone, normalizeEmail } from '../shared/utils/src/index';
import { generateProduct, getRandomProduct, categories } from './data/product-catalog';
import { assignPersonaToCustomer, CustomerPersona } from './data/customer-personas';
import { getRandomAddress } from './data/addresses';

const TOTAL_CUSTOMERS = 500;
const DUPLICATE_RATE = 0.1; // 10% will have duplicates

const firstNames = [
  'Aamir', 'Priya', 'Rahul', 'Anjali', 'Vikram', 'Neha', 'Arjun', 'Pooja', 'Karan', 'Riya',
  'Amit', 'Sneha', 'Rohan', 'Divya', 'Sanjay', 'Kavya', 'Aditya', 'Meera', 'Nikhil', 'Shreya',
  'Raj', 'Ananya', 'Vivek', 'Kriti', 'Siddharth', 'Isha', 'Ravi', 'Pallavi', 'Manish', 'Swati',
];
const lastNames = [
  'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Shah', 'Verma', 'Reddy', 'Joshi', 'Mehta',
  'Nair', 'Kapoor', 'Chopra', 'Malhotra', 'Agarwal', 'Bhatia', 'Khanna', 'Desai', 'Pandey', 'Rao',
  'Iyer', 'Menon', 'Nair', 'Pillai', 'Krishnan', 'Sundaram', 'Venkatesh', 'Raman', 'Subramanian',
];

interface CustomerProfile {
  id: string;
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
  persona: CustomerPersona;
  address: ReturnType<typeof getRandomAddress>;
}

interface JourneyEvent {
  eventType: string;
  source: string;
  timestamp: Date;
  product?: ReturnType<typeof getRandomProduct>;
  sessionId?: string;
  abandoned?: boolean;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generatePhone(index: number): string {
  const prefix = randomItem(['98', '99', '97', '96', '95', '94', '93', '92', '91', '90', '88', '87']);
  const number = (1000000000 + index).toString().substring(1);
  return `+91${prefix}${number}`;
}

function generateEmail(firstName: string, lastName: string, index: number): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'rediffmail.com'];
  const variations = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${randomInt(10, 99)}`,
    `${lastName.toLowerCase()}${firstName.toLowerCase()}`,
  ];
  const base = variations[index % variations.length];
  return `${base}${index > 0 ? index : ''}@${randomItem(domains)}`;
}

function generateJourney(persona: CustomerPersona, startDate: Date): JourneyEvent[] {
  const journey: JourneyEvent[] = [];
  const sessionId = `session-${Date.now()}-${randomInt(1000, 9999)}`;
  
  // Calculate number of touchpoints based on persona
  const numTouchpoints = randomInt(2, 8);
  const channels = persona.preferredChannels;
  const categories = persona.preferredCategories;
  
  let currentDate = new Date(startDate);
  let converted = false;
  let cartAbandoned = false;
  
  for (let i = 0; i < numTouchpoints; i++) {
    // Time between touchpoints (hours)
    const hoursBetween = randomInt(1, persona.crossChannelBehavior ? 48 : 24);
    currentDate = new Date(currentDate.getTime() + hoursBetween * 60 * 60 * 1000);
    
    const channel = channels[Math.floor(Math.random() * channels.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const product = generateProduct(category, randomInt(1, 1000));
    
    // Determine event type based on journey stage
    let eventType: string;
    if (i === 0) {
      eventType = 'view'; // First touchpoint
    } else if (i === numTouchpoints - 1 && !converted && Math.random() > persona.cartAbandonmentRate) {
      eventType = 'purchase';
      converted = true;
    } else if (i > 0 && i < numTouchpoints - 1 && Math.random() < 0.6) {
      eventType = 'add_to_cart';
      if (Math.random() < persona.cartAbandonmentRate && !cartAbandoned) {
        cartAbandoned = true;
        // Add abandoned cart event
        journey.push({
          eventType: 'cart_abandoned',
          source: channel,
          timestamp: new Date(currentDate.getTime() + randomInt(30, 120) * 60 * 1000),
          product,
          sessionId,
          abandoned: true,
        });
      }
    } else if (Math.random() < 0.3) {
      eventType = 'wishlist';
    } else {
      eventType = 'view';
    }
    
    journey.push({
      eventType,
      source: channel,
      timestamp: currentDate,
      product,
      sessionId,
      abandoned: false,
    });
  }
  
  // Add return/exchange events for some customers
  if (converted && Math.random() < persona.returnRate) {
    const returnDate = new Date(currentDate.getTime() + randomInt(1, 7) * 24 * 60 * 60 * 1000);
    journey.push({
      eventType: 'return',
      source: persona.preferredChannels[0],
      timestamp: returnDate,
      product: journey[journey.length - 1].product,
      sessionId: `session-${Date.now()}-return`,
      abandoned: false,
    });
  }
  
  return journey;
}

async function seedData() {
  console.log('🌱 Starting realistic data seeding...\n');

  const db = initDb(dbConfig);
  await db.connect();

  // Step 1: Create product catalog in memory
  console.log('📦 Generating product catalog...');
  const productCatalog: Map<string, ReturnType<typeof getRandomProduct>> = new Map();
  const categoryList = Object.keys(categories);
  
  for (let i = 0; i < 200; i++) {
    const category = categoryList[Math.floor(Math.random() * categoryList.length)];
    const product = generateProduct(category, i);
    productCatalog.set(product.sku, product);
  }
  console.log(`✅ Generated ${productCatalog.size} products\n`);

  const profiles: CustomerProfile[] = [];
  const allEvents: Array<{
    profileId: string;
    event: JourneyEvent;
    identifiers: { phone: string; email: string };
  }> = [];

  // Step 2: Create customer profiles with personas
  console.log('👥 Creating customer profiles with personas...');

  for (let i = 0; i < TOTAL_CUSTOMERS; i++) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const phone = generatePhone(i);
    const email = generateEmail(firstName, lastName, i);
    const persona = assignPersonaToCustomer(i);
    const address = getRandomAddress();

    // Calculate realistic metrics based on persona
    const monthsActive = randomInt(1, 24);
    const purchasesPerMonth = randomInt(
      persona.purchaseFrequency.min,
      persona.purchaseFrequency.max
    );
    const totalOrders = Math.floor(purchasesPerMonth * monthsActive * randomFloat(0.7, 1.3));
    const avgOrderValue = randomInt(persona.avgOrderValue.min, persona.avgOrderValue.max);
    const totalSpent = totalOrders * avgOrderValue * randomFloat(0.8, 1.2);
    const ltv = totalSpent * (1 + persona.loyaltyScore * 0.5);

    const firstSeenDate = new Date();
    firstSeenDate.setDate(firstSeenDate.getDate() - randomInt(30, 730));

    const query = `
      INSERT INTO customer_profile (
        first_name,
        last_name,
        full_name,
        primary_phone,
        primary_email,
        city,
        state,
        country,
        postal_code,
        total_orders,
        total_spent,
        avg_order_value,
        ltv,
        first_seen_at,
        last_seen_at,
        last_purchase_at,
        segment
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id
    `;

    const lastPurchaseDate = totalOrders > 0 
      ? new Date(firstSeenDate.getTime() + randomInt(1, monthsActive * 30) * 24 * 60 * 60 * 1000)
      : null;

    const result = await db.query(query, [
      firstName,
      lastName,
      `${firstName} ${lastName}`,
      phone,
      email,
      address.city,
      address.state,
      address.country,
      address.postalCode,
      totalOrders,
      Math.round(totalSpent),
      Math.round(avgOrderValue),
      Math.round(ltv),
      firstSeenDate.toISOString(),
      lastPurchaseDate?.toISOString() || firstSeenDate.toISOString(),
      lastPurchaseDate?.toISOString() || null,
      persona.type,
    ]);

    const profileId = result.rows[0].id;
    profiles.push({ id: profileId, phone, email, firstName, lastName, persona, address });

    // Add identifiers
    const phoneHash = generateHash(normalizePhone(phone));
    const emailHash = generateHash(normalizeEmail(email));

    await db.query(
      `INSERT INTO profile_identifier (profile_id, type, value, value_hash) 
       VALUES ($1, 'phone', $2, $3) 
       ON CONFLICT DO NOTHING`,
      [profileId, phone, phoneHash]
    );

    await db.query(
      `INSERT INTO profile_identifier (profile_id, type, value, value_hash) 
       VALUES ($1, 'email', $2, $3) 
       ON CONFLICT DO NOTHING`,
      [profileId, email, emailHash]
    );

    // Generate realistic journey
    const journey = generateJourney(persona, firstSeenDate);
    for (const journeyEvent of journey) {
      allEvents.push({
        profileId,
        event: journeyEvent,
        identifiers: { phone, email },
      });
    }

    if (i % 50 === 0) {
      console.log(`  ✓ Created ${i} profiles with journeys...`);
    }
  }

  console.log(`✅ Created ${TOTAL_CUSTOMERS} profiles with realistic journeys!\n`);

  // Step 3: Insert events
  console.log('📊 Inserting realistic events...');
  let eventCount = 0;

  for (const { event, identifiers } of allEvents) {
    const product = event.product || getRandomProduct();
    const price = event.eventType === 'purchase' || event.eventType === 'add_to_cart'
      ? randomInt(product.minPrice, product.maxPrice)
      : null;

    await db.query(
      `INSERT INTO customer_raw_event (
        source,
        event_type,
        event_ts,
        identifiers,
        payload,
        status
      ) VALUES ($1, $2, $3, $4, $5, 'accepted')`,
      [
        event.source,
        event.eventType,
        event.timestamp.toISOString(),
        JSON.stringify(identifiers),
        JSON.stringify({
          sku: product.sku,
          product_name: product.name,
          category: product.category,
          subcategory: product.subcategory,
          brand: product.brand,
          price: price,
          quantity: event.eventType === 'purchase' ? randomInt(1, 3) : null,
          session_id: event.sessionId,
          tags: product.tags,
          abandoned: event.abandoned || false,
        }),
      ]
    );

    eventCount++;
  }

  console.log(`✅ Inserted ${eventCount} realistic events!\n`);

  // Step 4: Create duplicate profiles for merge testing
  console.log('🔗 Creating duplicate profiles to test merging...');
  const duplicatesToCreate = Math.floor(TOTAL_CUSTOMERS * DUPLICATE_RATE);

  for (let i = 0; i < duplicatesToCreate; i++) {
    const original = profiles[i];
    
    // Create duplicate with different email but same phone
    const duplicateEmail = `${original.firstName.toLowerCase()}.${original.lastName.toLowerCase()}${i}@newdomain.com`;

    const dupQuery = `
      INSERT INTO customer_profile (
        first_name,
        last_name,
        full_name,
        primary_phone,
        primary_email,
        city,
        state,
        total_orders,
        total_spent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;

    const dupResult = await db.query(dupQuery, [
      original.firstName,
      original.lastName,
      `${original.firstName} ${original.lastName}`,
      original.phone, // Same phone!
      duplicateEmail, // Different email
      original.address.city,
      original.address.state,
      randomInt(1, 5),
      randomInt(1000, 10000),
    ]);

    const dupId = dupResult.rows[0].id;

    // Add phone identifier (will match!)
    const phoneHash = generateHash(normalizePhone(original.phone));
    await db.query(
      `INSERT INTO profile_identifier (profile_id, type, value, value_hash) 
       VALUES ($1, 'phone', $2, $3) 
       ON CONFLICT DO NOTHING`,
      [dupId, original.phone, phoneHash]
    );

    // Add different email
    const emailHash = generateHash(normalizeEmail(duplicateEmail));
    await db.query(
      `INSERT INTO profile_identifier (profile_id, type, value, value_hash) 
       VALUES ($1, 'email', $2, $3) 
       ON CONFLICT DO NOTHING`,
      [dupId, duplicateEmail, emailHash]
    );
  }

  console.log(`✅ Created ${duplicatesToCreate} duplicate profiles!\n`);

  // Step 5: Show statistics
  console.log('═══════════════════════════════════════════');
  console.log('📊 REALISTIC DATA SEEDING COMPLETE');
  console.log('═══════════════════════════════════════════\n');

  const stats = await db.query(`
    SELECT 
      (SELECT COUNT(*) FROM customer_profile) as profiles,
      (SELECT COUNT(*) FROM profile_identifier) as identifiers,
      (SELECT COUNT(*) FROM customer_raw_event) as events,
      (SELECT COUNT(*) FROM identity_merge_log) as merges,
      (SELECT COUNT(DISTINCT source) FROM customer_raw_event) as channels,
      (SELECT COUNT(DISTINCT event_type) FROM customer_raw_event) as event_types
  `);

  const s = stats.rows[0];
  console.log(`✅ Total Profiles:    ${s.profiles}`);
  console.log(`✅ Total Identifiers: ${s.identifiers}`);
  console.log(`✅ Total Events:      ${s.events}`);
  console.log(`✅ Total Merges:      ${s.merges}`);
  console.log(`✅ Channels:         ${s.channels}`);
  console.log(`✅ Event Types:      ${s.event_types}\n`);

  // Persona distribution
  const personaStats = await db.query(`
    SELECT segment, COUNT(*) as count
    FROM customer_profile
    WHERE segment IS NOT NULL
    GROUP BY segment
    ORDER BY count DESC
  `);

  console.log('👥 Persona Distribution:');
  for (const row of personaStats.rows) {
    console.log(`   ${row.segment}: ${row.count} customers`);
  }
  console.log('');

  console.log('🎯 Next Steps:');
  console.log('1. Open dashboard: http://localhost:3100');
  console.log('2. View customers: http://localhost:3100/customers');
  console.log('3. Check analytics: http://localhost:3100/analytics');
  console.log('4. Test merge with duplicate phone numbers\n');

  await db.close();
  console.log('✨ Done!\n');
}

seedData().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
