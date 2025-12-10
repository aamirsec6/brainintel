/**
 * Customer Personas
 * Predefined customer behavior patterns for realistic data generation
 */

export interface CustomerPersona {
  type: string;
  description: string;
  purchaseFrequency: { min: number; max: number }; // purchases per month
  avgOrderValue: { min: number; max: number };
  preferredChannels: string[];
  preferredCategories: string[];
  cartAbandonmentRate: number; // 0-1
  returnRate: number; // 0-1
  loyaltyScore: number; // 0-1
  crossChannelBehavior: boolean;
  seasonalBuying: boolean;
}

export const personas: CustomerPersona[] = [
  {
    type: 'VIP_HIGH_VALUE',
    description: 'High-value customers with frequent purchases',
    purchaseFrequency: { min: 4, max: 8 },
    avgOrderValue: { min: 10000, max: 50000 },
    preferredChannels: ['app', 'web', 'pos'],
    preferredCategories: ['Electronics', 'Fashion', 'Home'],
    cartAbandonmentRate: 0.1,
    returnRate: 0.05,
    loyaltyScore: 0.9,
    crossChannelBehavior: true,
    seasonalBuying: true,
  },
  {
    type: 'FREQUENT_BUYER',
    description: 'Regular customers with consistent purchases',
    purchaseFrequency: { min: 2, max: 5 },
    avgOrderValue: { min: 2000, max: 15000 },
    preferredChannels: ['web', 'app'],
    preferredCategories: ['Fashion', 'Beauty', 'Grocery'],
    cartAbandonmentRate: 0.2,
    returnRate: 0.1,
    loyaltyScore: 0.7,
    crossChannelBehavior: true,
    seasonalBuying: false,
  },
  {
    type: 'BROWSER',
    description: 'Customers who browse but rarely purchase',
    purchaseFrequency: { min: 0, max: 1 },
    avgOrderValue: { min: 500, max: 5000 },
    preferredChannels: ['web', 'app'],
    preferredCategories: ['Fashion', 'Beauty', 'Electronics'],
    cartAbandonmentRate: 0.8,
    returnRate: 0.15,
    loyaltyScore: 0.3,
    crossChannelBehavior: false,
    seasonalBuying: false,
  },
  {
    type: 'BUDGET_CONSCIOUS',
    description: 'Price-sensitive customers looking for deals',
    purchaseFrequency: { min: 1, max: 3 },
    avgOrderValue: { min: 500, max: 5000 },
    preferredChannels: ['web', 'whatsapp'],
    preferredCategories: ['Grocery', 'Books', 'Fashion'],
    cartAbandonmentRate: 0.4,
    returnRate: 0.2,
    loyaltyScore: 0.5,
    crossChannelBehavior: false,
    seasonalBuying: true,
  },
  {
    type: 'POS_ONLY',
    description: 'Traditional customers who prefer in-store',
    purchaseFrequency: { min: 1, max: 4 },
    avgOrderValue: { min: 1000, max: 20000 },
    preferredChannels: ['pos'],
    preferredCategories: ['Grocery', 'Home', 'Fashion'],
    cartAbandonmentRate: 0.05,
    returnRate: 0.1,
    loyaltyScore: 0.8,
    crossChannelBehavior: false,
    seasonalBuying: true,
  },
  {
    type: 'MOBILE_FIRST',
    description: 'Young customers who primarily use mobile app',
    purchaseFrequency: { min: 2, max: 6 },
    avgOrderValue: { min: 1000, max: 10000 },
    preferredChannels: ['app', 'web'],
    preferredCategories: ['Electronics', 'Fashion', 'Beauty', 'Sports'],
    cartAbandonmentRate: 0.3,
    returnRate: 0.12,
    loyaltyScore: 0.6,
    crossChannelBehavior: true,
    seasonalBuying: false,
  },
  {
    type: 'CHURNED',
    description: 'Previously active but now inactive customers',
    purchaseFrequency: { min: 0, max: 0.5 },
    avgOrderValue: { min: 1000, max: 10000 },
    preferredChannels: ['web', 'app'],
    preferredCategories: ['Fashion', 'Electronics'],
    cartAbandonmentRate: 0.9,
    returnRate: 0.25,
    loyaltyScore: 0.2,
    crossChannelBehavior: false,
    seasonalBuying: false,
  },
];

export function getRandomPersona(): CustomerPersona {
  return personas[Math.floor(Math.random() * personas.length)];
}

export function getPersonaByType(type: string): CustomerPersona | undefined {
  return personas.find(p => p.type === type);
}

export function assignPersonaToCustomer(_customerIndex: number): CustomerPersona {
  // Distribute personas realistically
  // 10% VIP, 30% Frequent, 20% Browser, 15% Budget, 10% POS, 10% Mobile, 5% Churned
  const rand = Math.random();
  
  if (rand < 0.1) return getPersonaByType('VIP_HIGH_VALUE')!;
  if (rand < 0.4) return getPersonaByType('FREQUENT_BUYER')!;
  if (rand < 0.6) return getPersonaByType('BROWSER')!;
  if (rand < 0.75) return getPersonaByType('BUDGET_CONSCIOUS')!;
  if (rand < 0.85) return getPersonaByType('POS_ONLY')!;
  if (rand < 0.95) return getPersonaByType('MOBILE_FIRST')!;
  return getPersonaByType('CHURNED')!;
}

