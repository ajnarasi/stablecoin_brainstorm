/**
 * Static Product Catalog - 20 items across categories
 * Each product has: id, name, description, price (USD), imageUrl, category, sku
 */

const catalog = [
  // --- Footwear ---
  {
    id: "prod_001",
    name: "Nike Air Max 90",
    description: "Classic lifestyle sneaker with visible Air cushioning and retro design.",
    price: "139.99",
    imageUrl: "https://assets.fiserv.demo/products/nike-air-max-90.jpg",
    category: "footwear",
    sku: "NIKE-AM90-001",
    sizes: [7, 8, 9, 10, 11, 12],
  },
  {
    id: "prod_002",
    name: "Adidas Ultraboost 23",
    description: "High-performance running shoe with Boost midsole and Primeknit upper.",
    price: "189.99",
    imageUrl: "https://assets.fiserv.demo/products/adidas-ultraboost-23.jpg",
    category: "footwear",
    sku: "ADI-UB23-002",
    sizes: [7, 8, 9, 10, 11, 12, 13],
  },
  {
    id: "prod_003",
    name: "New Balance 550",
    description: "Retro basketball-inspired sneaker with premium leather upper.",
    price: "109.99",
    imageUrl: "https://assets.fiserv.demo/products/nb-550.jpg",
    category: "footwear",
    sku: "NB-550-003",
    sizes: [6, 7, 8, 9, 10, 11, 12],
  },

  // --- Electronics ---
  {
    id: "prod_004",
    name: "Sony WH-1000XM5 Headphones",
    description: "Industry-leading noise cancelling wireless headphones with 30hr battery.",
    price: "349.99",
    imageUrl: "https://assets.fiserv.demo/products/sony-xm5.jpg",
    category: "electronics",
    sku: "SONY-XM5-004",
  },
  {
    id: "prod_005",
    name: "Apple AirPods Pro 2",
    description: "Active noise cancellation with Adaptive Audio and USB-C charging.",
    price: "249.99",
    imageUrl: "https://assets.fiserv.demo/products/airpods-pro-2.jpg",
    category: "electronics",
    sku: "AAPL-APP2-005",
  },
  {
    id: "prod_006",
    name: "Samsung Galaxy Tab S9",
    description: "11-inch AMOLED tablet with Snapdragon 8 Gen 2 and S Pen included.",
    price: "799.99",
    imageUrl: "https://assets.fiserv.demo/products/galaxy-tab-s9.jpg",
    category: "electronics",
    sku: "SAM-GTS9-006",
  },
  {
    id: "prod_007",
    name: "Anker 737 Power Bank",
    description: "24,000mAh portable charger with 140W max output and smart display.",
    price: "109.99",
    imageUrl: "https://assets.fiserv.demo/products/anker-737.jpg",
    category: "electronics",
    sku: "ANK-737-007",
  },
  {
    id: "prod_008",
    name: "Logitech MX Master 3S",
    description: "Advanced wireless mouse with MagSpeed scroll and 8K DPI sensor.",
    price: "99.99",
    imageUrl: "https://assets.fiserv.demo/products/mx-master-3s.jpg",
    category: "electronics",
    sku: "LOG-MXM3-008",
  },

  // --- Clothing ---
  {
    id: "prod_009",
    name: "Patagonia Better Sweater Jacket",
    description: "Classic fleece jacket made with 100% recycled polyester.",
    price: "149.00",
    imageUrl: "https://assets.fiserv.demo/products/patagonia-better-sweater.jpg",
    category: "clothing",
    sku: "PAT-BSJ-009",
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "prod_010",
    name: "Levi's 501 Original Jeans",
    description: "The original straight-fit jean with button fly and signature styling.",
    price: "69.50",
    imageUrl: "https://assets.fiserv.demo/products/levis-501.jpg",
    category: "clothing",
    sku: "LEV-501-010",
    sizes: ["28x30", "30x30", "32x30", "32x32", "34x32", "36x32"],
  },
  {
    id: "prod_011",
    name: "North Face Nuptse Vest",
    description: "Iconic 700-fill down vest with water-repellent finish.",
    price: "220.00",
    imageUrl: "https://assets.fiserv.demo/products/tnf-nuptse-vest.jpg",
    category: "clothing",
    sku: "TNF-NV-011",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "prod_012",
    name: "Uniqlo Ultra Light Down Jacket",
    description: "Featherweight packable down jacket with water-repellent shell.",
    price: "79.90",
    imageUrl: "https://assets.fiserv.demo/products/uniqlo-uld.jpg",
    category: "clothing",
    sku: "UNI-ULD-012",
    sizes: ["XS", "S", "M", "L", "XL"],
  },

  // --- Accessories ---
  {
    id: "prod_013",
    name: "Ray-Ban Wayfarer Classic",
    description: "Timeless sunglasses with polarized G-15 green lenses.",
    price: "163.00",
    imageUrl: "https://assets.fiserv.demo/products/rayban-wayfarer.jpg",
    category: "accessories",
    sku: "RB-WFC-013",
  },
  {
    id: "prod_014",
    name: "Herschel Supply Retreat Backpack",
    description: "Classic backpack with padded laptop sleeve and magnetic strap closures.",
    price: "89.99",
    imageUrl: "https://assets.fiserv.demo/products/herschel-retreat.jpg",
    category: "accessories",
    sku: "HER-RET-014",
  },
  {
    id: "prod_015",
    name: "Casio G-Shock GA-2100",
    description: "Slim octagonal watch with carbon core guard and 200m water resistance.",
    price: "99.99",
    imageUrl: "https://assets.fiserv.demo/products/gshock-ga2100.jpg",
    category: "accessories",
    sku: "CAS-GA21-015",
  },

  // --- Home ---
  {
    id: "prod_016",
    name: "Yeti Rambler 26oz Bottle",
    description: "Double-wall vacuum insulated stainless steel water bottle.",
    price: "40.00",
    imageUrl: "https://assets.fiserv.demo/products/yeti-rambler.jpg",
    category: "home",
    sku: "YET-R26-016",
  },
  {
    id: "prod_017",
    name: "Ember Mug 2",
    description: "Temperature-controlled smart mug that keeps drinks at the perfect temp.",
    price: "129.95",
    imageUrl: "https://assets.fiserv.demo/products/ember-mug-2.jpg",
    category: "home",
    sku: "EMB-MG2-017",
  },
  {
    id: "prod_018",
    name: "Philips Hue Starter Kit",
    description: "Smart LED bulb kit with bridge and 3 color-capable A19 bulbs.",
    price: "134.99",
    imageUrl: "https://assets.fiserv.demo/products/hue-starter.jpg",
    category: "home",
    sku: "PHI-HSK-018",
  },
  {
    id: "prod_019",
    name: "Dyson V15 Detect Vacuum",
    description: "Cordless vacuum with laser dust detection and LCD screen.",
    price: "749.99",
    imageUrl: "https://assets.fiserv.demo/products/dyson-v15.jpg",
    category: "home",
    sku: "DYS-V15-019",
  },
  {
    id: "prod_020",
    name: "Bose SoundLink Flex Speaker",
    description: "Portable Bluetooth speaker with deep bass and IP67 waterproof rating.",
    price: "149.00",
    imageUrl: "https://assets.fiserv.demo/products/bose-flex.jpg",
    category: "home",
    sku: "BOS-SLF-020",
  },
];

/**
 * Get all products, optionally filtered by category
 */
function getAllProducts(category = null) {
  if (category) {
    return catalog.filter((p) => p.category === category.toLowerCase());
  }
  return catalog;
}

/**
 * Get a single product by ID
 */
function getProductById(id) {
  return catalog.find((p) => p.id === id) || null;
}

/**
 * Search products by name or description
 */
function searchProducts(query) {
  const q = query.toLowerCase();
  return catalog.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
  );
}

module.exports = { getAllProducts, getProductById, searchProducts, catalog };
