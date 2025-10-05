// Firebase Products System for Khavho Groups
// Integrated with existing website structure - ECOMMERCE VERSION

// Wait for Firebase to be initialized by firebase-config.js
document.addEventListener('DOMContentLoaded', function() {
    // Wait a moment for Firebase to initialize
    setTimeout(() => {
        if (window.firebase && window.db) {
            console.log('✅ Initializing Firebase Products System...');
            initializeProducts();
            setupFilterButtons();
        } else {
            console.error('❌ Firebase not initialized properly');
            // Try again after more time
            setTimeout(() => {
                if (window.firebase && window.db) {
                    console.log('✅ Initializing Firebase Products System (retry)...');
                    initializeProducts();
                    setupFilterButtons();
                } else {
                    console.error('❌ Firebase initialization failed completely');
                }
            }, 2000);
        }
    }, 100);
});

// Also try on window load as backup
window.addEventListener('load', function() {
    setTimeout(() => {
        if (window.firebase && window.db && (!productsData || productsData.length === 0)) {
            console.log('🔄 Window load backup - initializing products...');
            initializeProducts();
        }
    }, 1000);
});

// Use global Firebase instances (no redeclaration)
// const db is already available from firebase-config.js via window.db

// Global variables
let productsData = [];
let currentFilter = 'all';
let unsubscribeProducts = null;

// Function to get products data for other scripts
function getSharedProducts() {
    return productsData;
}

// Function to update product filter from other scripts
function updateProductFilter(filter) {
    console.log('🔍 Updating product filter to:', filter);
    currentFilter = filter;
    // Re-display products with new filter
    displayProducts(productsData);
}

// Make functions globally available immediately
window.getSharedProducts = getSharedProducts;
window.updateProductFilter = updateProductFilter;

// Also make initializeProducts available for manual triggering
window.initializeProducts = function() {
    if (window.firebase && window.db) {
        initializeProducts();
    } else {
        console.error('Firebase not available for manual initialization');
    }
};

// Also provide a fallback for early calls
if (!window.getSharedProducts) {
    window.getSharedProducts = function() {
        console.log('getSharedProducts called before initialization, returning empty array');
        return [];
    };
}

// Initialize products from Firebase - AUTOMATIC DIRECT LOADING
function initializeProducts() {
    console.log('🚀 Setting up Firebase products system...');
    
    try {
        // Clean up existing listener
        if (unsubscribeProducts) {
            unsubscribeProducts();
        }

        // Show loading state
        showProductsLoading();

        // Check if Firebase is properly initialized
        if (!window.db) {
            console.error('❌ Firebase database not initialized');
            showProductsError('Database connection failed.');
            return;
        }

        console.log('📦 Loading products directly from Firebase...');
        
        // Use direct loading method (works reliably without authentication issues)
        window.db.collection('products').get()
            .then((snapshot) => {
                console.log('✅ Products found:', snapshot.size, 'documents');
                
                if (snapshot.empty) {
                    console.log('⚠️ No products in database');
                    showProductsError('No products found. Please add products in the admin panel.');
                    return;
                }
                
                // Load products immediately
                productsData = [];
                snapshot.forEach((doc) => {
                    const productData = { id: doc.id, ...doc.data() };
                    console.log('📦 Product loaded:', productData.name || 'Unnamed', productData.category || 'No category');
                    productsData.push(productData);
                });
                
                console.log('✅ Total products loaded:', productsData.length);
                
                // Update global getSharedProducts immediately
                window.getSharedProducts = function() {
                    return productsData;
                };
                
                displayProducts(productsData);
                
                // Trigger update event for scripts.js
                window.dispatchEvent(new CustomEvent('productsUpdated', {
                    detail: { products: productsData }
                }));
                
                console.log('🛒 Products are ready for shopping!');
                
            })
            .catch((error) => {
                console.error('❌ Product loading failed:', error);
                showProductsError('Failed to load products: ' + error.message);
            });

    } catch (error) {
        console.error('❌ Error in product initialization:', error);
        showProductsError('Unable to initialize products: ' + error.message);
    }
}

// Display products in the existing grid
function displayProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) {
        console.error('Products grid not found');
        return;
    }

    // Clear existing content
    productsGrid.innerHTML = '';

    if (products.length === 0) {
        showNoProducts();
        return;
    }

    // Filter products based on current filter
    const filteredProducts = filterProductsByCategory(products, currentFilter);

    if (filteredProducts.length === 0) {
        showNoProductsInCategory();
        return;
    }

    // Create product cards
    filteredProducts.forEach((product, index) => {
        const productCard = createProductCard(product, index);
        productsGrid.appendChild(productCard);
    });

    // Initialize Lucide icons if they exist
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Create individual product card with ECOMMERCE features
function createProductCard(product, index) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    // Determine availability
    const isAvailable = product.available !== false && product.stock !== 0;
    const price = product.price || 'Contact for Quote';
    
    card.innerHTML = `
        <div class="product-image">
            ${product.imageUrl ? 
                `<img src="${getImageUrl(product.imageUrl)}" alt="${product.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                <div class="product-icon" style="display: none;">
                    <i data-lucide="${getProductIcon(product.category)}"></i>
                </div>` :
                `<div class="product-icon">
                    <i data-lucide="${getProductIcon(product.category)}"></i>
                </div>`
            }
            ${!isAvailable ? '<div class="product-badge out-of-stock">Out of Stock</div>' : ''}
        </div>
        <div class="product-content">
            <div class="product-category">${getCategoryDisplayName(product.category)}</div>
            <h3 class="product-title">${product.name}</h3>
            <p class="product-description">${product.description}</p>
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
    
    console.log('🛒 Cart updated:', cartCount, 'items');
}

function showOutOfStockMessage() {
    showNotification('This product is currently out of stock', 'warning');
}

function showNotification(message, type = 'info') {
    // Simple notification system
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // You can enhance this with a proper notification UI later
    if (type === 'success') {
        alert(`✅ ${message}`);
    } else if (type === 'warning') {
        alert(`⚠️ ${message}`);
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

// Show loading state
function showProductsLoading() {
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div class="loading-products">
                <i data-lucide="loader" class="animate-spin"></i>
                Loading products...
            </div>
        `;
    }
}

// Show error state
function showProductsError(message) {
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div class="error-products">
                <i data-lucide="alert-circle"></i>
                ${message}
            </div>
        `;
    }
}

// Show no products state
function showNoProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <i data-lucide="package"></i>
                No products available
            </div>
        `;
    }
}

// Show no products in category
function showNoProductsInCategory() {
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <i data-lucide="filter"></i>
                No products available in this category
            </div>
        `;
    }
}

// Global filter function for buttons
function filterProducts(category) {
    console.log('🔍 Filtering products by:', category);
    currentFilter = category;
    displayProducts(productsData);
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

console.log('🛒 Firebase Products System loaded successfully!');