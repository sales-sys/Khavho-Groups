// Firebase Products System for Khavho Groups
// Integrated with existing website structure - ECOMMERCE VERSION

// Global variables
let productsData = [];
let currentFilter = 'all';
let unsubscribeProducts = null;

// AUTOMATIC PRODUCT LOADING - NO MANUAL INTERVENTION
// Multiple attempts for maximum reliability
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, starting immediate product loading...');
    
    // Immediate attempts with different timings
    setTimeout(automaticProductLoad, 100);
    setTimeout(automaticProductLoad, 500);
    setTimeout(automaticProductLoad, 1000);
});

window.addEventListener('load', function() {
    console.log('🚀 Window loaded, additional loading attempts...');
    
    // Additional attempts after window load
    setTimeout(automaticProductLoad, 200);
    setTimeout(automaticProductLoad, 1500);
});

// AUTOMATIC PRODUCT LOADING FUNCTION
function automaticProductLoad() {
    // Don't reload if already loaded
    if (productsData.length > 0) {
        console.log('✅ Products already loaded:', productsData.length);
        return;
    }
    
    console.log('🔄 Automatic product loading initiated...');
    
    if (!window.db) {
        console.log('⏳ Database not ready yet...');
        return;
    }
    
    console.log('✅ Database ready, loading products...');
    
    // Try to load products from Firebase (security rules allow read: if true)
    window.db.collection('products').get()
        .then((snapshot) => {
            console.log('✅ Firebase query successful! Products found:', snapshot.size);
            
            if (snapshot.size === 0) {
                console.log('⚠️ No products in Firebase, loading demos...');
                if (productsData.length === 0) {
                    loadDemoProducts();
                }
                return;
            }

            // Load real products from Firebase
            productsData = [];
            snapshot.forEach((doc) => {
                const product = { id: doc.id, ...doc.data() };
                console.log('📦 Product loaded:', product.name, '- Category:', product.category);
                productsData.push(product);
            });
            
            console.log('✅ Total products loaded from Firebase:', productsData.length);
            
            // Update shared function immediately
            window.getSharedProducts = function() {
                return productsData;
            };
            
            // Display products automatically
            displayProducts(productsData);
            
            // Notify other scripts
            window.dispatchEvent(new CustomEvent('productsUpdated', {
                detail: { products: productsData }
            }));
            
            console.log('🎉 Products automatically loaded and displayed!');
            
        })
        .catch((error) => {
            console.error('❌ Firebase error:', error.code, error.message);
            console.log('🆘 Loading demo products as fallback...');
            loadDemoProducts();
        });
}

// Emergency fallback demo products
function loadDemoProducts() {
    console.log('🆘 Loading demo products as fallback...');
    
    productsData = [
        {
            id: 'demo-1',
            name: 'Construction Management Services',
            category: 'construction',
            price: 50000,
            description: 'Professional construction project management and oversight services for large-scale projects.',
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=300'
        },
        {
            id: 'demo-2', 
            name: 'Investment Portfolio Management',
            category: 'investment',
            price: 25000,
            description: 'Comprehensive investment portfolio management and advisory services for optimal returns.',
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=300'
        },
        {
            id: 'demo-3',
            name: 'Financial Consulting Services',
            category: 'financial',
            price: 15000,
            description: 'Expert financial consulting and strategic planning services for business growth.',
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=300'
        },
        {
            id: 'demo-4',
            name: 'Business Strategy Consulting',
            category: 'consulting',
            price: 20000,
            description: 'Strategic business consulting and development services for market expansion.',
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=300'
        }
    ];
    
    console.log('🎯 Demo products created:', productsData.length);
    
    // Update getSharedProducts immediately
    window.getSharedProducts = function() {
        return productsData;
    };
    
    // Force display demo products NOW
    console.log('🎨 Displaying demo products immediately...');
    displayProducts(productsData);
    
    // Update scripts.js
    window.dispatchEvent(new CustomEvent('productsUpdated', {
        detail: { products: productsData }
    }));
    
    console.log('✅ Demo products loaded and displayed successfully!');
}

// Function to get products data for other scripts
function getSharedProducts() {
    return productsData;
}

// Function to update product filter from other scripts
function updateProductFilter(filter) {
    console.log('🔍 Updating product filter to:', filter);
    currentFilter = filter;
    displayProducts(productsData);
}

// Make functions globally available immediately
window.getSharedProducts = getSharedProducts;
window.updateProductFilter = updateProductFilter;

// Also provide a fallback for early calls
if (!window.getSharedProducts) {
    window.getSharedProducts = function() {
        console.log('getSharedProducts called before initialization, returning empty array');
        return [];
    };
}

// Display products in the existing grid
function displayProducts(products) {
    console.log('🎨 displayProducts called with', products.length, 'products, filter:', currentFilter);
    
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) {
        console.error('❌ Products grid element not found!');
        return;
    }
    
    console.log('✅ Products grid found, clearing content...');

    // Clear existing content
    productsGrid.innerHTML = '';

    if (products.length === 0) {
        console.log('⚠️ No products to display');
        showNoProducts();
        return;
    }

    // Filter products based on current filter
    const filteredProducts = filterProductsByCategory(products, currentFilter);
    console.log('🔍 Filtered products:', filteredProducts.length, 'for category:', currentFilter);

    if (filteredProducts.length === 0) {
        console.log('⚠️ No products in category:', currentFilter);
        showNoProductsInCategory();
        return;
    }

    // Create product cards
    console.log('🎯 Creating product cards...');
    filteredProducts.forEach((product, index) => {
        const productCard = createProductCard(product, index);
        productsGrid.appendChild(productCard);
        console.log('✅ Added card for:', product.name);
    });

    // Initialize Lucide icons if they exist
    if (typeof lucide !== 'undefined') {
        console.log('🎨 Initializing Lucide icons...');
        lucide.createIcons();
    } else {
        console.log('⚠️ Lucide icons not available');
    }
    
    console.log('🎉 Display complete!');
}

// Create individual product card with ECOMMERCE features
function createProductCard(product, index) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    // Determine availability
    const isAvailable = product.available !== false && product.stock !== 0;
    const price = product.price || 'Contact for Quote';
    
    // Handle undefined or null category
    const category = product.category || 'other';
    const description = product.description || 'No description available';
    
    card.innerHTML = `
        <div class="product-image">
            ${product.imageUrl ? 
                `<img src="${getImageUrl(product.imageUrl)}" alt="${product.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                <div class="product-icon" style="display: none;">
                    <i data-lucide="${getProductIcon(category)}"></i>
                </div>` :
                `<div class="product-icon">
                    <i data-lucide="${getProductIcon(category)}"></i>
                </div>`
            }
            ${!isAvailable ? '<div class="product-badge out-of-stock">Out of Stock</div>' : ''}
        </div>
        <div class="product-content">
            <div class="product-category">${getCategoryDisplayName(category)}</div>
            <h3 class="product-title">${product.name}</h3>
            <p class="product-description">${description}</p>
            <div class="product-price">R${typeof price === 'number' ? price.toLocaleString() : price}</div>
            <div class="product-actions">
                <button class="add-to-cart-btn ${isAvailable ? 'available' : 'unavailable'}" 
                        onclick="${isAvailable ? `addToCart('${product.id}')` : 'showOutOfStockMessage()'}"
                        ${!isAvailable ? 'disabled' : ''}>
                    <i data-lucide="${isAvailable ? 'shopping-cart' : 'x-circle'}"></i>
                    ${isAvailable ? 'Add to Cart' : 'Out of Stock'}
                </button>
                <button class="contact-whatsapp-btn" onclick="contactViaWhatsApp('${product.name}')">
                    <i data-lucide="message-circle"></i>
                    WhatsApp
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Filter products by category
function filterProductsByCategory(products, category) {
    if (category === 'all') {
        return products;
    }
    return products.filter(product => product.category === category);
}

// Get product icon based on category
function getProductIcon(category) {
    const icons = {
        'construction': 'hard-hat',
        'investment': 'trending-up',
        'financial': 'banknote',
        'consulting': 'users',
        'other': 'briefcase'
    };
    return icons[category] || 'package';
}

// Get category display name
function getCategoryDisplayName(category) {
    const names = {
        'construction': 'Construction',
        'investment': 'Investment',
        'financial': 'Financial',
        'consulting': 'Consulting',
        'other': 'Other'
    };
    return names[category] || 'Product';
}

// Convert Google Drive share URL to direct image URL
function getImageUrl(url) {
    if (url && url.includes('drive.google.com')) {
        const fileId = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (fileId) {
            return `https://drive.google.com/uc?export=view&id=${fileId[1]}`;
        }
    }
    return url || '';
}

// Shopping cart functions
function addToCart(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }
    
    console.log('🛒 Adding to cart:', product.name);
    
    // Get existing cart from localStorage
    let cart = JSON.parse(localStorage.getItem('khavho_cart') || '[]');
    
    // Check if product already in cart
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            category: product.category,
            quantity: 1,
            addedAt: new Date().toISOString()
        });
    }
    
    // Save to localStorage
    localStorage.setItem('khavho_cart', JSON.stringify(cart));
    
    // Update cart display
    updateCartDisplay();
    
    // Show success message
    showNotification(`${product.name} added to cart!`, 'success');
}

function updateCartDisplay() {
    const cart = JSON.parse(localStorage.getItem('khavho_cart') || '[]');
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    
    // Update cart count in header
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
        cartCountElement.style.display = cartCount > 0 ? 'inline' : 'none';
    }
    
    // Update cart badge if it exists (fallback)
    const cartBadge = document.querySelector('.cart-badge');
    if (cartBadge) {
        cartBadge.textContent = cartCount;
        cartBadge.style.display = cartCount > 0 ? 'inline' : 'none';
    }
}

function showOutOfStockMessage() {
    const message = 'This product is currently out of stock. Please contact us for availability.';
    if (typeof showNotification === 'function') {
        showNotification(message, 'warning');
    } else {
        alert(`ℹ️ ${message}`);
    }
}

// Contact via WhatsApp
function contactViaWhatsApp(productName) {
    const phoneNumber = '+27123456789'; // Replace with your actual WhatsApp business number
    const message = `Hi! I'm interested in: ${productName}. Can you provide more information?`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Setup filter buttons
function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
        });
    });
}

function showNoProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div class="no-products-message">
                <h3>No Products Available</h3>
                <p>Please check back later for new products.</p>
            </div>
        `;
    }
}

function showNoProductsInCategory() {
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div class="no-products-message">
                <h3>No Products in This Category</h3>
                <p>Try selecting a different category or view all products.</p>
            </div>
        `;
    }
}

// Global filter function for buttons
function filterProducts(category) {
    console.log('🔍 filterProducts called with category:', category);
    
    try {
        // Update filter buttons active state
        const allButtons = document.querySelectorAll('.filter-btn');
        console.log('Found', allButtons.length, 'filter buttons');
        
        allButtons.forEach(btn => {
            btn.classList.remove('active');
            console.log('Removed active from button:', btn.textContent);
        });
        
        // Find and activate the clicked button
        const clickedBtn = event ? event.target : document.querySelector(`.filter-btn[onclick*="${category}"]`);
        if (clickedBtn) {
            clickedBtn.classList.add('active');
            console.log('Activated button:', clickedBtn.textContent);
        } else {
            console.log('Could not find button for category:', category);
        }
        
        // Update current filter and display products
        currentFilter = category;
        console.log('Filter updated to:', currentFilter);
        
        if (productsData.length > 0) {
            console.log('Displaying products with new filter...');
            displayProducts(productsData);
        } else {
            console.log('No products data available for filtering');
        }
        
    } catch (error) {
        console.error('Error in filterProducts:', error);
    }
}

// Make functions globally available
window.filterProducts = filterProducts;
window.addToCart = addToCart;
window.contactViaWhatsApp = contactViaWhatsApp;
window.updateCartDisplay = updateCartDisplay;

// Initialize cart display on page load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        updateCartDisplay();
    }, 1000);
});

console.log('Firebase Products System loaded successfully!');