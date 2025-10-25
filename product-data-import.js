// Khavho Groups - Product Data Import Script
// This script will populate the Firebase database with real product data

// Product code generation patterns
const PRODUCT_CATEGORIES = {
    'civil-works': {
        code: 'CIV',
        subcategories: {
            'CEM': 'Cement',
            'BRK': 'Bricks', 
            'SND': 'Sand',
            'STN': 'Stone',
            'STL': 'Steel/Rebar',
            'MSH': 'Mesh'
        }
    },
    'general-building': {
        code: 'BLD',
        subcategories: {
            'BRD': 'Boards',
            'TMB': 'Timber',
            'INS': 'Insulation',
            'PNT': 'Paint',
            'ROF': 'Roofing',
            'DOR': 'Doors'
        }
    },
    'electrical': {
        code: 'ELE',
        subcategories: {
            'GEN': 'Generators',
            'CBL': 'Cables',
            'WIR': 'Wire',
            'LGT': 'Lighting',
            'BRK': 'Breakers',
            'DBS': 'Distribution Boards'
        }
    },
    'mechanical': {
        code: 'MEC',
        subcategories: {
            'HVC': 'HVAC',
            'PMP': 'Pumps',
            'TNK': 'Tanks',
            'PIP': 'Pipes',
            'VLV': 'Valves'
        }
    },
    'general-procurement': {
        code: 'GEN',
        subcategories: {
            'IT': 'IT Equipment',
            'OFF': 'Office Furniture'
        }
    }
};

// Real product data from your list
const KHAVHO_PRODUCTS = [
    // Civil Works
    {
        productCode: 'KG-CIV-CEM-001',
        name: 'PPC Surebuild Cement 42.5N',
        category: 'civil-works',
        subcategory: 'CEM',
        unit: '1x Bag (50kg)',
        price: 115.00,
        description: 'High-quality cement suitable for all construction applications. PPC Surebuild 42.5N grade cement.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-CIV-BRK-001',
        name: 'Stock Clay Brick (NFP)',
        category: 'civil-works',
        subcategory: 'BRK',
        unit: '1x Brick (Single)',
        price: 2.50,
        description: 'Standard stock clay brick, NFP grade. Perfect for general construction and building work.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-CIV-BRK-002',
        name: 'Stock Clay Brick (NFP)',
        category: 'civil-works',
        subcategory: 'BRK',
        unit: '1x Pallet (500 Bricks)',
        price: 1200.00,
        description: 'Stock clay brick NFP grade sold by the pallet. Bulk pricing for construction projects.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-CIV-BRK-003',
        name: 'Face Brick (NFX)',
        category: 'civil-works',
        subcategory: 'BRK',
        unit: '1x Brick (Single)',
        price: 5.50,
        description: 'Premium face brick NFX grade for exposed brickwork and aesthetic applications.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-CIV-BRK-004',
        name: 'Face Brick (NFX)',
        category: 'civil-works',
        subcategory: 'BRK',
        unit: '1x Pallet (400 Bricks)',
        price: 2100.00,
        description: 'Face brick NFX grade sold by the pallet. Premium quality for exposed brickwork.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-CIV-SND-001',
        name: 'Building Sand',
        category: 'civil-works',
        subcategory: 'SND',
        unit: '1x Bag (40kg)',
        price: 35.00,
        description: 'Quality building sand suitable for concrete mixing and construction applications.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-CIV-SND-002',
        name: 'Building Sand',
        category: 'civil-works',
        subcategory: 'SND',
        unit: '1x m³ (cubic meter)',
        price: 420.00,
        description: 'Building sand sold in bulk by cubic meter. Ideal for large construction projects.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-CIV-SND-003',
        name: 'River Sand',
        category: 'civil-works',
        subcategory: 'SND',
        unit: '1x Bag (40kg)',
        price: 38.00,
        description: 'Premium river sand with excellent properties for construction and concrete work.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-CIV-SND-004',
        name: 'River Sand',
        category: 'civil-works',
        subcategory: 'SND',
        unit: '1x m³ (cubic meter)',
        price: 450.00,
        description: 'River sand sold in bulk by cubic meter for large-scale construction projects.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-CIV-STN-001',
        name: '19mm Crushed Stone',
        category: 'civil-works',
        subcategory: 'STN',
        unit: '1x Bag (40kg)',
        price: 40.00,
        description: '19mm crushed stone aggregate for concrete and construction applications.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-CIV-STN-002',
        name: '19mm Crushed Stone',
        category: 'civil-works',
        subcategory: 'STN',
        unit: '1x m³ (cubic meter)',
        price: 480.00,
        description: '19mm crushed stone sold in bulk for large construction and roadwork projects.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-CIV-STL-001',
        name: 'Rebar (Y10)',
        category: 'civil-works',
        subcategory: 'STL',
        unit: '1x Length (6m)',
        price: 105.00,
        description: 'Y10 reinforcement bar, 6-meter length. Essential for concrete reinforcement.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-CIV-STL-002',
        name: 'Rebar (Y12)',
        category: 'civil-works',
        subcategory: 'STL',
        unit: '1x Length (6m)',
        price: 145.00,
        description: 'Y12 reinforcement bar, 6-meter length. Heavy-duty concrete reinforcement.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-CIV-STL-003',
        name: 'Rebar (Y16)',
        category: 'civil-works',
        subcategory: 'STL',
        unit: '1x Length (6m)',
        price: 255.00,
        description: 'Y16 reinforcement bar, 6-meter length. Extra heavy-duty structural reinforcement.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-CIV-MSH-001',
        name: 'Reinforcing Mesh (Ref 100)',
        category: 'civil-works',
        subcategory: 'MSH',
        unit: '1x Sheet (6m x 2.4m)',
        price: 380.00,
        description: 'Reinforcing mesh Ref 100 grade. Pre-fabricated reinforcement for concrete slabs.',
        inStock: true,
        isAvailable: true
    },

    // General Building
    {
        productCode: 'KG-BLD-BRD-001',
        name: 'Gyproc Rhinoboard (9.5mm)',
        category: 'general-building',
        subcategory: 'BRD',
        unit: '1x Sheet (3.0m x 1.2m)',
        price: 189.00,
        description: 'Gyproc Rhinoboard 9.5mm thickness. High-quality drywall for interior applications.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-BLD-BRD-002',
        name: 'Gyproc Rhinoboard (12.5mm)',
        category: 'general-building',
        subcategory: 'BRD',
        unit: '1x Sheet (3.0m x 1.2m)',
        price: 240.00,
        description: 'Gyproc Rhinoboard 12.5mm thickness. Heavy-duty drywall for demanding applications.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-BLD-TMB-001',
        name: 'S5 Structural Pine',
        category: 'general-building',
        subcategory: 'TMB',
        unit: '1x Length (38x114mm, 6m)',
        price: 179.00,
        description: 'S5 grade structural pine timber, 38x114mm cross-section, 6-meter length.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-BLD-TMB-002',
        name: 'S5 Structural Pine',
        category: 'general-building',
        subcategory: 'TMB',
        unit: '1x Length (50x152mm, 6m)',
        price: 310.00,
        description: 'S5 grade structural pine timber, 50x152mm cross-section, 6-meter length.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-BLD-TMB-003',
        name: 'Brandering (Supa)',
        category: 'general-building',
        subcategory: 'TMB',
        unit: '1x Length (38x38mm, 6m)',
        price: 85.00,
        description: 'Supa grade brandering timber, 38x38mm cross-section, 6-meter length.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-BLD-INS-001',
        name: 'Fiberglass Insulation (135mm)',
        category: 'general-building',
        subcategory: 'INS',
        unit: '1x Roll (5m x 1.2m)',
        price: 310.00,
        description: '135mm thick fiberglass insulation roll. Excellent thermal performance for buildings.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-BLD-PNT-001',
        name: 'PVA Paint (Standard Acrylic, White)',
        category: 'general-building',
        subcategory: 'PNT',
        unit: '1x Bucket (20L)',
        price: 799.00,
        description: 'Standard white PVA acrylic paint, 20-liter bucket. Interior wall paint.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-BLD-PNT-002',
        name: 'Roof Paint (Acrylic, Charcoal)',
        category: 'general-building',
        subcategory: 'PNT',
        unit: '1x Bucket (20L)',
        price: 1150.00,
        description: 'Charcoal acrylic roof paint, 20-liter bucket. Weather-resistant exterior coating.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-BLD-ROF-001',
        name: 'IBR Roof Sheeting (0.5mm Galv)',
        category: 'general-building',
        subcategory: 'ROF',
        unit: '1x Per Metre',
        price: 145.00,
        description: 'IBR profile galvanized roof sheeting, 0.5mm thickness. Sold per linear meter.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-BLD-DOR-001',
        name: 'Steel Door Frame (Standard)',
        category: 'general-building',
        subcategory: 'DOR',
        unit: '1x Frame (813mm)',
        price: 450.00,
        description: 'Standard steel door frame, 813mm width. Pre-hung frame ready for installation.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-BLD-DOR-002',
        name: 'Hardboard Door (Interior)',
        category: 'general-building',
        subcategory: 'DOR',
        unit: '1x Door (Standard)',
        price: 380.00,
        description: 'Interior hardboard door, standard size. Suitable for residential applications.',
        inStock: true,
        isAvailable: true
    },

    // Electrical
    {
        productCode: 'KG-ELE-GEN-001',
        name: 'Silent Diesel Generator (100kVA)',
        category: 'electrical',
        subcategory: 'GEN',
        unit: '1x Unit (3-Phase)',
        price: 219999.00,
        description: 'Silent diesel generator, 100kVA capacity, 3-phase output. Industrial-grade power solution.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-ELE-GEN-002',
        name: 'Silent Diesel Generator (50kVA)',
        category: 'electrical',
        subcategory: 'GEN',
        unit: '1x Unit (3-Phase)',
        price: 145000.00,
        description: 'Silent diesel generator, 50kVA capacity, 3-phase output. Commercial power backup.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-ELE-CBL-001',
        name: 'Armoured Cable (4-core, 16mm²)',
        category: 'electrical',
        subcategory: 'CBL',
        unit: '1x Per Metre',
        price: 225.00,
        description: '4-core armoured cable, 16mm² cross-section. Heavy-duty electrical installation cable.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-ELE-CBL-002',
        name: 'Armoured Cable (4-core, 35mm²)',
        category: 'electrical',
        subcategory: 'CBL',
        unit: '1x Per Metre',
        price: 410.00,
        description: '4-core armoured cable, 35mm² cross-section. Industrial-grade electrical cable.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-ELE-WIR-001',
        name: 'Single Core Wire (2.5mm², Red)',
        category: 'electrical',
        subcategory: 'WIR',
        unit: '1x Roll (100m)',
        price: 489.00,
        description: 'Single core electrical wire, 2.5mm² red, 100-meter roll. Standard electrical installation.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-ELE-WIR-002',
        name: 'Single Core Wire (2.5mm², Black)',
        category: 'electrical',
        subcategory: 'WIR',
        unit: '1x Roll (100m)',
        price: 489.00,
        description: 'Single core electrical wire, 2.5mm² black, 100-meter roll. Standard electrical installation.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-ELE-WIR-003',
        name: 'Single Core Wire (1.5mm², Red)',
        category: 'electrical',
        subcategory: 'WIR',
        unit: '1x Roll (100m)',
        price: 320.00,
        description: 'Single core electrical wire, 1.5mm² red, 100-meter roll. Light electrical installation.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-ELE-LGT-001',
        name: 'LED High Bay Light (150W)',
        category: 'electrical',
        subcategory: 'LGT',
        unit: '1x Unit',
        price: 1299.00,
        description: 'LED high bay light, 150W power consumption. Industrial lighting solution.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-ELE-LGT-002',
        name: 'LED Flood Light (200W)',
        category: 'electrical',
        subcategory: 'LGT',
        unit: '1x Unit',
        price: 1499.00,
        description: 'LED flood light, 200W power consumption. Outdoor security and area lighting.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-ELE-BRK-001',
        name: 'Circuit Breaker (20A, DIN Rail)',
        category: 'electrical',
        subcategory: 'BRK',
        unit: '1x Unit (1-Pole)',
        price: 79.00,
        description: '20A circuit breaker, single pole, DIN rail mount. Residential electrical protection.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-ELE-BRK-002',
        name: 'Circuit Breaker (63A, DIN Rail)',
        category: 'electrical',
        subcategory: 'BRK',
        unit: '1x Unit (3-Pole)',
        price: 340.00,
        description: '63A circuit breaker, three pole, DIN rail mount. Industrial electrical protection.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-ELE-DBS-001',
        name: 'Distribution Board (18-Way, Surface)',
        category: 'electrical',
        subcategory: 'DBS',
        unit: '1x Unit (Empty)',
        price: 550.00,
        description: '18-way distribution board, surface mount, empty. Electrical panel for circuit distribution.',
        inStock: true,
        isAvailable: true
    },

    // Mechanical
    {
        productCode: 'KG-MEC-HVC-001',
        name: 'Air Conditioner (12,000 BTU)',
        category: 'mechanical',
        subcategory: 'HVC',
        unit: '1x Unit (Split, Non-Inverter)',
        price: 7499.00,
        description: '12,000 BTU split air conditioner, non-inverter type. Residential cooling solution.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-MEC-HVC-002',
        name: 'Air Conditioner (24,000 BTU)',
        category: 'mechanical',
        subcategory: 'HVC',
        unit: '1x Unit (Split, Non-Inverter)',
        price: 12999.00,
        description: '24,000 BTU split air conditioner, non-inverter type. Commercial cooling solution.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-MEC-PMP-001',
        name: 'Centrifugal Pump (2.2kW)',
        category: 'mechanical',
        subcategory: 'PMP',
        unit: '1x Unit (3-Phase)',
        price: 9499.00,
        description: 'Centrifugal pump, 2.2kW motor, 3-phase. Industrial water pumping solution.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-MEC-PMP-002',
        name: 'Submersible Sump Pump (0.75kW)',
        category: 'mechanical',
        subcategory: 'PMP',
        unit: '1x Unit (Auto)',
        price: 2800.00,
        description: 'Submersible sump pump, 0.75kW, automatic operation. Drainage and water removal.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-MEC-PMP-003',
        name: 'Borehole Pump Kit (0.75kW)',
        category: 'mechanical',
        subcategory: 'PMP',
        unit: '1x Kit (Pump + Motor)',
        price: 9999.00,
        description: 'Complete borehole pump kit, 0.75kW motor included. Water extraction solution.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-MEC-TNK-001',
        name: 'Water Storage Tank (JoJo)',
        category: 'mechanical',
        subcategory: 'TNK',
        unit: '1x Unit (5,000L)',
        price: 6800.00,
        description: 'JoJo water storage tank, 5,000-liter capacity. Residential water storage solution.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-MEC-TNK-002',
        name: 'Water Storage Tank (JoJo)',
        category: 'mechanical',
        subcategory: 'TNK',
        unit: '1x Unit (10,000L)',
        price: 11800.00,
        description: 'JoJo water storage tank, 10,000-liter capacity. Commercial water storage solution.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-MEC-PIP-001',
        name: 'Copper Pipe (22mm, Class 0)',
        category: 'mechanical',
        subcategory: 'PIP',
        unit: '1x Length (5.5m)',
        price: 780.00,
        description: 'Copper pipe, 22mm diameter, Class 0, 5.5-meter length. Premium plumbing solution.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-MEC-PIP-002',
        name: 'PVC Pipe (110mm, Class 10)',
        category: 'mechanical',
        subcategory: 'PIP',
        unit: '1x Length (6m)',
        price: 480.00,
        description: 'PVC pipe, 110mm diameter, Class 10, 6-meter length. Drainage and sewerage piping.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-MEC-VLV-001',
        name: 'Brass Gate Valve (50mm)',
        category: 'mechanical',
        subcategory: 'VLV',
        unit: '1x Unit',
        price: 420.00,
        description: 'Brass gate valve, 50mm diameter. High-quality water control valve.',
        inStock: true,
        isAvailable: true
    },

    // General Procurement (Office)
    {
        productCode: 'KG-GEN-IT-001',
        name: 'Business Laptop',
        category: 'general-procurement',
        subcategory: 'IT',
        unit: '1x Unit (Core i5, 16GB RAM)',
        price: 16999.00,
        description: 'Business laptop with Intel Core i5 processor and 16GB RAM. Professional computing solution.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-GEN-IT-002',
        name: 'Business Desktop PC Set',
        category: 'general-procurement',
        subcategory: 'IT',
        unit: '1x Set (Core i5, 16GB, 24" Monitor)',
        price: 12499.00,
        description: 'Complete desktop PC set with Core i5, 16GB RAM, and 24-inch monitor. Office workstation.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-GEN-IT-003',
        name: 'Multi-Function Laser Printer',
        category: 'general-procurement',
        subcategory: 'IT',
        unit: '1x Unit (Print/Scan/Copy)',
        price: 5999.00,
        description: 'Multi-function laser printer with print, scan, and copy capabilities. Office productivity.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-GEN-IT-004',
        name: 'Network Switch (24-Port Gigabit)',
        category: 'general-procurement',
        subcategory: 'IT',
        unit: '1x Unit (Unmanaged)',
        price: 2450.00,
        description: '24-port gigabit network switch, unmanaged. Office network infrastructure.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-GEN-OFF-001',
        name: 'Ergonomic Office Chair',
        category: 'general-procurement',
        subcategory: 'OFF',
        unit: '1x Unit (High-Back)',
        price: 2899.00,
        description: 'Ergonomic office chair with high back support. Professional seating solution.',
        inStock: true,
        isAvailable: true
    },
    {
        productCode: 'KG-GEN-OFF-002',
        name: 'Office Desk (1.6m)',
        category: 'general-procurement',
        subcategory: 'OFF',
        unit: '1x Unit',
        price: 2200.00,
        description: 'Office desk, 1.6-meter width. Professional workspace furniture.',
        inStock: true,
        isAvailable: true
    }
];

// Function to generate next product code for a category/subcategory
function generateNextProductCode(category, subcategory) {
    const categoryCode = PRODUCT_CATEGORIES[category]?.code;
    if (!categoryCode) return null;
    
    // This will be implemented to check existing codes and generate the next one
    // For now, return a placeholder format
    return `KG-${categoryCode}-${subcategory}-XXX`;
}

// Function to add timestamp fields
function addTimestampFields(product) {
    return {
        ...product,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stock: 50, // Default stock level
        lowStockAlert: 10, // Default low stock threshold
        status: 'active',
        tags: [],
        imageUrl: generateImagePath(name), // Auto-generate based on product name
        supplier: 'Khavho Groups',
        region: 'Gauteng/Limpopo'
    };
}

// Generate image path based on product name
function generateImagePath(productName) {
    if (!productName) return '';
    
    // Convert product name to URL-friendly format
    const imageName = productName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    
    // Return path for WebP image (will fallback to JPG automatically)
    return `/images/${imageName}.webp`;
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.KHAVHO_PRODUCTS = KHAVHO_PRODUCTS;
    window.PRODUCT_CATEGORIES = PRODUCT_CATEGORIES;
    window.generateNextProductCode = generateNextProductCode;
    window.addTimestampFields = addTimestampFields;
}

console.log('✅ Khavho Products data loaded successfully!');
console.log(`📦 Total products: ${KHAVHO_PRODUCTS.length}`);
console.log(`🏢 Categories: ${Object.keys(PRODUCT_CATEGORIES).length}`);