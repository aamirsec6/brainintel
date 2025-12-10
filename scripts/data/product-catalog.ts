/**
 * Product Catalog Data
 * Realistic product catalog with SKUs, categories, brands, and price ranges
 */

export interface Product {
  sku: string;
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  tags: string[];
  seasonal?: boolean;
  trending?: boolean;
}

export const categories = {
  Electronics: {
    subcategories: ['Smartphones', 'Laptops', 'Headphones', 'Smart Watches', 'Tablets', 'Cameras'],
    brands: ['Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Realme', 'Sony', 'Bose', 'JBL'],
    priceRange: { min: 2000, max: 150000 },
  },
  Fashion: {
    subcategories: ['Men\'s Clothing', 'Women\'s Clothing', 'Footwear', 'Accessories', 'Bags', 'Watches'],
    brands: ['Zara', 'H&M', 'Nike', 'Adidas', 'Puma', 'Levi\'s', 'Allen Solly', 'Fossil'],
    priceRange: { min: 500, max: 50000 },
  },
  Home: {
    subcategories: ['Furniture', 'Kitchen Appliances', 'Home Decor', 'Bedding', 'Storage', 'Lighting'],
    brands: ['IKEA', 'Godrej', 'Whirlpool', 'LG', 'Philips', 'Prestige', 'Bajaj'],
    priceRange: { min: 1000, max: 100000 },
  },
  Beauty: {
    subcategories: ['Skincare', 'Makeup', 'Hair Care', 'Fragrances', 'Men\'s Grooming', 'Wellness'],
    brands: ['Lakme', 'Maybelline', 'L\'Oreal', 'Nivea', 'Garnier', 'The Body Shop', 'Forest Essentials'],
    priceRange: { min: 200, max: 10000 },
  },
  Sports: {
    subcategories: ['Fitness Equipment', 'Sports Apparel', 'Outdoor Gear', 'Yoga', 'Cycling', 'Running'],
    brands: ['Nike', 'Adidas', 'Reebok', 'Decathlon', 'Under Armour', 'Puma'],
    priceRange: { min: 500, max: 30000 },
  },
  Books: {
    subcategories: ['Fiction', 'Non-Fiction', 'Academic', 'Children\'s Books', 'Comics', 'Self-Help'],
    brands: ['Penguin', 'HarperCollins', 'Scholastic', 'Arihant', 'McGraw Hill'],
    priceRange: { min: 100, max: 2000 },
  },
  Grocery: {
    subcategories: ['Fresh Produce', 'Pantry Staples', 'Beverages', 'Snacks', 'Dairy', 'Frozen Foods'],
    brands: ['Amul', 'Britannia', 'Tata', 'Haldiram\'s', 'Parle', 'Coca-Cola', 'Pepsi'],
    priceRange: { min: 50, max: 5000 },
  },
  Toys: {
    subcategories: ['Action Figures', 'Board Games', 'Educational Toys', 'Outdoor Toys', 'Puzzles', 'Dolls'],
    brands: ['LEGO', 'Hasbro', 'Funskool', 'Fisher-Price', 'Barbie', 'Hot Wheels'],
    priceRange: { min: 200, max: 10000 },
  },
};

export const seasonalProducts: Record<string, string[]> = {
  'winter': ['Heaters', 'Warm Clothing', 'Hot Beverages', 'Blankets', 'Winter Accessories'],
  'summer': ['Air Conditioners', 'Coolers', 'Summer Clothing', 'Cold Beverages', 'Sunscreen'],
  'monsoon': ['Umbrellas', 'Raincoats', 'Waterproof Bags', 'Indoor Games', 'Hot Beverages'],
  'festival': ['Home Decor', 'Clothing', 'Gifts', 'Sweets', 'Electronics'],
};

export const trendingProducts = [
  'Smartphones',
  'Wireless Earbuds',
  'Smart Watches',
  'Laptops',
  'Fitness Trackers',
  'Air Fryers',
  'Skincare Products',
  'Yoga Mats',
];

export function generateProduct(category: string, index: number): Product {
  const catData = categories[category as keyof typeof categories];
  if (!catData) {
    throw new Error(`Unknown category: ${category}`);
  }

  const subcategory = catData.subcategories[Math.floor(Math.random() * catData.subcategories.length)];
  const brand = catData.brands[Math.floor(Math.random() * catData.brands.length)];
  
  // Generate realistic price within range
  const basePrice = Math.floor(
    catData.priceRange.min + 
    Math.random() * (catData.priceRange.max - catData.priceRange.min)
  );
  
  // Round to nearest 100 for realistic pricing
  const roundedPrice = Math.round(basePrice / 100) * 100;
  
  const minPrice = Math.max(catData.priceRange.min, roundedPrice * 0.7);
  const maxPrice = Math.min(catData.priceRange.max, roundedPrice * 1.3);

  const sku = `${category.substring(0, 3).toUpperCase()}-${brand.substring(0, 3).toUpperCase()}-${String(index).padStart(6, '0')}`;
  
  const name = `${brand} ${subcategory} ${index % 10 === 0 ? 'Pro' : index % 5 === 0 ? 'Plus' : ''}`.trim();
  
  const tags: string[] = [category.toLowerCase(), subcategory.toLowerCase(), brand.toLowerCase()];
  
  // Add seasonal tag
  const seasons = Object.keys(seasonalProducts);
  const currentSeason = seasons[Math.floor(Math.random() * seasons.length)];
  if (seasonalProducts[currentSeason].some(p => subcategory.includes(p) || name.includes(p))) {
    tags.push(currentSeason);
  }
  
  // Add trending tag
  const isTrending = trendingProducts.some(t => subcategory.includes(t) || name.includes(t));
  
  return {
    sku,
    name,
    category,
    subcategory,
    brand,
    basePrice: roundedPrice,
    minPrice: Math.round(minPrice / 100) * 100,
    maxPrice: Math.round(maxPrice / 100) * 100,
    tags,
    seasonal: tags.includes(currentSeason),
    trending: isTrending,
  };
}

export function getProductByCategory(category: string, index: number): Product {
  return generateProduct(category, index);
}

export function getRandomProduct(): Product {
  const categoryList = Object.keys(categories);
  const category = categoryList[Math.floor(Math.random() * categoryList.length)];
  return generateProduct(category, Math.floor(Math.random() * 10000));
}

