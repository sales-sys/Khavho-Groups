// Firebase Products System for Khavho Groups
// Integrated with existing website structure - ECOMMERCE VERSION

// Creative notification system (ADMIN ONLY)
function showNotification(message, type = 'info', duration = 4000) {
    // Only show notifications on admin pages
    if (!window.location.pathname.includes('admin')) {
        return; // Exit early for non-admin pages
    }
    
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = getNotificationIcon(type);
    notification.innerHTML = `
        <span class="notification-icon">${icon}</span>
        <div class="notification-content">
            <strong>${getNotificationTitle(type)}</strong><br>
            ${message}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 400);
    }, duration);
}

function getNotificationIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        loading: '⏳',
        info: 'ℹ️'
    };
    return icons[type] || icons.info;
}

function getNotificationTitle(type) {
    const titles = {
        success: 'Success!',
        error: 'Error!',
        loading: 'Loading...',
        info: 'Info'
    };
    return titles[type] || titles.info;
}

// Global variables
let productsData = [];
let currentFilter = 'all';
let unsubscribeProducts = null;

// AUTOMATIC PRODUCT LOADING - NO MANUAL INTERVENTION  
// Single coordinated loading system with duplicate protection
let productsLoaded = false;
let loadingInProgress = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, starting product loading...');
    
    // Initialize cart display
    updateCartDisplay();
    
    // Single coordinated loading attempt
    setTimeout(() => {
        if (!productsLoaded && !loadingInProgress) {
            automaticProductLoad();
        }
    }, 500);
});

window.addEventListener('load', function() {
    console.log('🚀 Window loaded, checking if products need loading...');
    
    // Additional attempt only if products haven't loaded yet
    setTimeout(() => {
        if (!productsLoaded && !loadingInProgress) {
            automaticProductLoad();
        }
    }, 1000);
    
    // FAILSAFE: If after 5 seconds still nothing loaded AND Firebase exists, retry once more
    setTimeout(() => {
        if (!productsLoaded && window.db) {
            console.error('⚠️ FAILSAFE: Products still not loaded after 5s, retrying Firebase query...');
            automaticProductLoad();
        } else if (!productsLoaded && !window.db) {
            console.error('⚠️ FAILSAFE: Firebase not initialized, loading demo products...');
            loadDemoProducts();
        }
    }, 5000);
});

// AUTOMATIC PRODUCT LOADING FUNCTION
function automaticProductLoad() {
    // Don't reload if already loaded or loading in progress
    if (productsLoaded || loadingInProgress) {
        console.log('✅ Products already loaded or loading in progress');
        return;
    }
    
    if (productsData.length > 0) {
        console.log('✅ Products already in memory:', productsData.length);
        productsLoaded = true;
        return;
    }
    
    console.log('🔄 Automatic product loading initiated...');
    loadingInProgress = true;
    
    if (!window.db) {
        console.error('⚠️ Firebase database not initialized! Loading demo products...');
        loadingInProgress = false;
        loadDemoProducts();
        return;
    }
    
    console.log('✅ Database ready, loading products from Firebase...');
    console.log('🔍 Firebase config:', {
        projectId: window.firebase.app().options.projectId,
        hasDb: !!window.db,
        dbType: window.db ? window.db.constructor.name : 'N/A'
    });
    
    // Try to load products from Firebase (security rules allow read: if true)
    console.log('🔍 Querying collection: "products"...');
    window.db.collection('products').get()
        .then((snapshot) => {
            console.log('✅✅✅ Firebase query SUCCESSFUL! Products found:', snapshot.size);
            console.log('📊 Snapshot details:', {
                empty: snapshot.empty,
                size: snapshot.size,
                docs: snapshot.docs.length
            });
            
            if (snapshot.size === 0) {
                console.error('❌❌❌ FIREBASE PRODUCTS COLLECTION IS EMPTY! ❌❌❌');
                console.error('Please add products to the "products" collection in Firebase Firestore!');
                console.error('Database path: khavho-groups > Firestore > products collection');
                
                // Show error message on page
                const productsGrid = document.getElementById('productsGrid');
                if (productsGrid) {
                    productsGrid.innerHTML = `
                        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: #fee; border-radius: 12px; border: 2px solid #c00;">
                            <h2 style="color: #c00; margin-bottom: 20px;">⚠️ No Products Found in Firebase</h2>
                            <p style="color: #666; margin-bottom: 10px;">The Firebase "products" collection is empty.</p>
                            <p style="color: #666;">Please add products to the database or check your Firebase configuration.</p>
                        </div>
                    `;
                }
                
                loadingInProgress = false;
                return;
            }

            // Load real products from Firebase
            productsData = [];
            let productCount = 0;
            snapshot.forEach((doc) => {
                productCount++;
                const product = { id: doc.id, ...doc.data() };
                
                console.log(`📦 Product #${productCount}:`, {
                    id: product.id,
                    name: product.name,
                    category: product.category,
                    price: product.price,
                    hasImageUrl: !!product.imageUrl,
                    imageUrl: product.imageUrl
                });
                
                // Only generate imageUrl if not already set in Firebase
                if (!product.imageUrl && product.name) {
                    const encodedName = encodeURIComponent(product.name);
                    product.imageUrl = `images/${encodedName}.webp`;
                    console.log(`  └─ Generated imageUrl: ${product.imageUrl}`);
                }
                
                productsData.push(product);
            });
            
            console.log('✅✅✅ SUCCESS! Total products loaded from Firebase:', productsData.length);
            console.log('📦 Products array:', productsData.map(p => p.name));
            
            // Mark as loaded
            productsLoaded = true;
            loadingInProgress = false;
            
            // Update shared function immediately
            window.getSharedProducts = function() {
                return productsData;
            };
            
            // Display products based on which page we're on
            if (document.getElementById('productsGrid')) {
                // Full products page
                displayProducts(productsData);
            } else if (document.getElementById('homepage-products-showcase')) {
                // Homepage featured products
                displayFeaturedProducts();
            }
            
            // Notify other scripts
            window.dispatchEvent(new CustomEvent('productsUpdated', {
                detail: { products: productsData }
            }));
            
            console.log('🎉 Products automatically loaded and displayed!');
            
        })
        .catch((error) => {
            console.error('❌ Firebase error:', error.code, error.message);
            console.log('🆘 Loading demo products as fallback...');
            loadingInProgress = false; // Reset loading flag
            loadDemoProducts();
        });
}

// Emergency fallback demo products
function loadDemoProducts() {
    console.log('🆘 Loading demo products as fallback...');
    
    // FORCE RESET loading flags
    loadingInProgress = false;
    
    productsData = [
        {
            id: 'real-1',
            name: 'Air Conditioner (12,000 BTU)',
            category: 'Mechanical',
            price: 8500,
            description: '12,000 BTU air conditioning unit for efficient cooling.',
            available: true,
            imageUrl: 'images/Air%20Conditioner%20%2812%2C000%20BTU%29.webp'
        },
        {
            id: 'real-2',
            name: 'PPC Surebuild Cement 42.5N',
            category: 'Building',
            price: 120,
            description: 'High quality PPC Surebuild Cement 42.5N for construction.',
            available: true,
            imageUrl: 'images/PPC%20Surebuild%20Cement%2042.5N.webp'
        },
        {
            id: 'real-3',
            name: 'Business Desktop PC Set',
            category: 'Office',
            price: 12000,
            description: 'Complete business desktop computer set for office use.',
            available: true,
            imageUrl: 'images/Business%20Desktop%20PC%20Set.webp'
        },
        {
            id: 'real-4',
            name: 'Office Desk (1.6m)',
            category: 'Office',
            price: 2500,
            description: 'Professional 1.6m office desk.',
            available: true,
            imageUrl: 'images/Office%20Desk%20%281.6m%29.webp'
        },
        {
            id: 'real-5',
            name: 'Armoured Cable (4-core, 16mm²)',
            category: 'Electrical',
            price: 3500,
            description: '4-core armoured cable, 16mm² for electrical installations.',
            available: true,
            imageUrl: 'images/Armoured%20Cable%20%284-core%2C%2016mm%C2%B2%29.webp'
        },
        {
            id: 'real-6',
            name: 'Multi-Function Laser Printer',
            category: 'Office',
            price: 4500,
            description: 'Multi-function laser printer for office productivity.',
            available: true,
            imageUrl: 'images/Multi-Function%20Laser%20Printer.webp'
        }
    ];
    
    console.log('🎯 Demo products created:', productsData.length);
    console.log('📦 Products:', productsData.map(p => p.name));
    
    // Mark as loaded
    productsLoaded = true;
    loadingInProgress = false;
    
    // Update getSharedProducts immediately
    window.getSharedProducts = function() {
        return productsData;
    };
    
    // Force display demo products based on which page we're on
    console.log('🎨 Displaying demo products immediately...');
    if (document.getElementById('productsGrid')) {
        // Full products page
        displayProducts(productsData);
    } else if (document.getElementById('homepage-products-showcase')) {
        // Homepage featured products
        displayFeaturedProducts();
    }
    
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
function displayProducts(products, retryCount = 0) {
    console.log('🎨 displayProducts called with', products.length, 'products, filter:', currentFilter, 'retry:', retryCount);
    
    // Hide loading indicator
    const loadingEl = document.getElementById('productsLoading');
    if (loadingEl) {
        loadingEl.style.display = 'none';
        console.log('✅ Loading indicator hidden');
    }
    
    // Try multiple ways to find the products grid element
    let productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) {
        // Try homepage products showcase
        productsGrid = document.getElementById('homepage-products-showcase');
    }
    if (!productsGrid) {
        // Fallback: try looking for products-grid (in case HTML wasn't updated)
        productsGrid = document.getElementById('products-grid');
    }
    if (!productsGrid) {
        // Fallback: try querySelector
        productsGrid = document.querySelector('.products-grid');
    }
    if (!productsGrid) {
        console.error('❌ Products grid element not found with any method! Retry count:', retryCount);
        console.log('🔍 Available elements:', {
            byId: document.getElementById('productsGrid'),
            byHomepage: document.getElementById('homepage-products-showcase'),
            byOldId: document.getElementById('products-grid'),
            byClass: document.querySelector('.products-grid'),
            documentReady: document.readyState,
            bodyExists: !!document.body
        });
        
        // Only retry up to 5 times to prevent infinite loop
        if (retryCount < 5) {
            setTimeout(() => {
                displayProducts(products, retryCount + 1);
            }, 100 * (retryCount + 1)); // Increase delay with each retry
            return;
        } else {
            console.error('❌ Giving up after 5 retries. Products grid element not found.');
            return;
        }
    }
    
    console.log('✅ Products grid found:', productsGrid.id);

    // Check if this is the homepage showcase container
    if (productsGrid.id === 'homepage-products-showcase') {
        console.log('🏠 Using homepage display function');
        displayHomepageProducts(products, productsGrid);
        return;
    }

    // Clear existing content for regular products page
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
        try {
            // Validate product data before creating card
            if (!product || !product.name) {
                console.log('⚠️ Invalid product data:', product);
                return;
            }
            
            const productCard = createProductCard(product, index);
            
            // Validate that productCard is a valid DOM element
            if (productCard && productCard instanceof HTMLElement && productCard.nodeType === Node.ELEMENT_NODE) {
                productsGrid.appendChild(productCard);
                console.log('✅ Added card for:', product.name);
            } else {
                console.log('❌ Invalid product card created for:', product.name, 'Card:', productCard);
            }
        } catch (error) {
            console.log('❌ Error creating card for product:', product.name, error);
        }
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
    try {
        // Validate product data
        if (!product) {
            console.log('❌ No product data provided to createProductCard');
            return null;
        }
        
        if (!product.name) {
            console.log('❌ Product missing required name field:', product);
            return null;
        }
        
        const card = document.createElement('div');
        if (!card) {
            console.log('❌ Failed to create div element');
            return null;
        }
        
        card.className = 'product-card';
        card.style.animationDelay = `${index * 0.1}s`;
        
        // Determine availability
        const isAvailable = product.available !== false && product.stock !== 0;
        const price = product.price || 'Contact for Quote';
        
        // Handle undefined or null category
        const category = product.category || 'other';
        const description = product.description || 'No description available';
        
        // Sanitize product name and ID for HTML
        const productName = String(product.name || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
        const productId = product.id || `product-${index}`;
        
        card.innerHTML = `
            <div class="product-image">
                ${product.imageUrl ? 
                    `<img src="${getImageUrl(product.imageUrl)}" alt="${productName}" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" 
                         loading="lazy" />
                    <div class="product-placeholder" style="display: none;">
                        <i data-lucide="${getProductIcon(category)}"></i>
                    </div>` :
                    `<div class="product-placeholder">
                        <i data-lucide="${getProductIcon(category)}"></i>
                    </div>`
                }
                ${!isAvailable ? '<div class="product-badge out-of-stock">Out of Stock</div>' : ''}
            </div>
            <div class="product-content">
                <h3 class="product-title">${productName}</h3>
                <p class="product-description">${description || 'High-quality product for professional use.'}</p>
                <div class="product-price">R${typeof price === 'number' ? price.toLocaleString() : price}</div>
                <div class="product-actions">
                    <button class="add-to-cart-btn ${isAvailable ? 'available' : 'unavailable'}" 
                            onclick="${isAvailable ? `addToCart('${productId}')` : 'showOutOfStockMessage()'}"
                            ${!isAvailable ? 'disabled' : ''}>
                        <i data-lucide="${isAvailable ? 'shopping-cart' : 'x-circle'}"></i>
                        ${isAvailable ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                    <button class="contact-whatsapp-btn" onclick="contactViaWhatsApp('${productName}')">
                        <i data-lucide="message-circle"></i>
                        WhatsApp
                    </button>
                </div>
            </div>
        `;
        
        return card;
    } catch (error) {
        console.log('❌ Error in createProductCard:', error, 'Product:', product);
        return null;
    }
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
        'mechanical': 'settings',
        'electrical': 'zap',
        'civil-work': 'hard-hat',
        'civil-works': 'hard-hat',
        'general-building': 'building',
        'general-procurement': 'briefcase',
        'Civil Works': 'hard-hat',
        'General Building': 'building',
        'Electrical': 'zap',
        'Mechanical': 'settings',
        'General Procurement': 'briefcase',
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
        'mechanical': 'Mechanical',
        'electrical': 'Electrical',
        'civil-work': 'Civil Work',
        'civil-works': 'Civil Works',
        'general-building': 'General Building',
        'general-procurement': 'General Procurement',
        'Civil Works': 'Civil Works',
        'General Building': 'General Building',
        'Electrical': 'Electrical',
        'Mechanical': 'Mechanical',
        'General Procurement': 'General Procurement',
        'other': 'Other'
    };
    return names[category] || category || 'Product';
}

// Enhanced image URL processing with WebP support and performance optimization
function getImageUrl(url) {
    if (!url) return '';
    
    // Handle Google Drive URLs
    if (url.includes('drive.google.com')) {
        const fileId = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (fileId) {
            return `https://drive.google.com/uc?export=view&id=${fileId[1]}`;
        }
    }
    
    // Handle local WebP images and other formats
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
        // Local image path - check if it's already WebP or convert if needed
        return url;
    }
    
    // Handle external URLs - return as is
    return url;
}

// Create optimized image element with WebP support and fallbacks
function createOptimizedImage(imageUrl, altText, className = '') {
    if (!imageUrl) {
        return `<div class="product-placeholder ${className}">
            <i data-lucide="package"></i>
        </div>`;
    }
    
    // Check if browser supports WebP
    const supportsWebP = checkWebPSupport();
    
    // If it's a local image without extension, try WebP first with fallback
    if (imageUrl.startsWith('images/') && !imageUrl.includes('.')) {
        if (supportsWebP) {
            return `<picture class="${className}">
                <source srcset="${imageUrl}.webp" type="image/webp">
                <source srcset="${imageUrl}.jpg" type="image/jpeg">
                <img src="${imageUrl}.jpg" alt="${altText}" 
                     onerror="this.parentElement.innerHTML='<div class=&quot;product-placeholder&quot;><i data-lucide=&quot;package&quot;></i></div>'; lucide.createIcons();" 
                     loading="lazy">
            </picture>`;
        }
    }
    
    // For WebP files, add fallback to JPG
    if (imageUrl.endsWith('.webp')) {
        const fallbackUrl = imageUrl.replace('.webp', '.jpg');
        return `<picture class="${className}">
            <source srcset="${imageUrl}" type="image/webp">
            <source srcset="${fallbackUrl}" type="image/jpeg">
            <img src="${fallbackUrl}" alt="${altText}" 
                 onerror="this.parentElement.innerHTML='<div class=&quot;product-placeholder&quot;><i data-lucide=&quot;package&quot;></i></div>'; lucide.createIcons();" 
                 loading="lazy">
        </picture>`;
    }
    
    // Regular image with lazy loading
    return `<img src="${imageUrl}" alt="${altText}" class="${className}"
             onerror="this.parentElement.innerHTML='<div class=&quot;product-placeholder&quot;><i data-lucide=&quot;package&quot;></i></div>'; lucide.createIcons();" 
             loading="lazy">`;
}

// Check WebP support
function checkWebPSupport() {
    // Check if we've already tested WebP support
    if (typeof window.webpSupported !== 'undefined') {
        return window.webpSupported;
    }
    
    // Create a small WebP image to test support
    const webP = new Image();
    webP.onload = webP.onerror = function () {
        window.webpSupported = (webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    
    // Return false by default, will be updated async
    return false;
}

// Shopping cart functions with Firebase integration
function addToCart(productId) {
    // Check if user is logged in first
    if (!currentUser) {
        console.log('🔐 User not logged in, prompting for login...');
        showNotification('Please login to add items to your cart', 'info');
        
        // Show login modal
        if (typeof openLoginModal === 'function') {
            openLoginModal();
        } else {
            // Fallback - redirect to login
            showNotification('Please login first to add items to cart', 'error');
        }
        return;
    }
    
    const product = productsData.find(p => p.id === productId);
    if (!product) {
        console.error('Product not found:', productId);
        showNotification('Product not found!', 'error');
        return;
    }
    
    console.log('🛒 Adding to cart:', product.name);
    
    // Add button click animation (safe for both direct calls and click events)
    try {
        const button = event && event.target ? event.target : document.querySelector(`button[onclick*="addToCart('${productId}')"]`);
        if (button) {
            button.classList.add('btn-click');
            setTimeout(() => button.classList.remove('btn-click'), 300);
        }
    } catch (err) {
        // Silent fail - animation is not critical
    }
    
    // Get existing cart from localStorage
    let cart = JSON.parse(localStorage.getItem('khavho_cart') || '[]');
    
    // Check if product already in cart
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
        showNotification(`Updated quantity for ${product.name}`, 'success');
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            category: product.category || 'general',
            quantity: 1,
            addedAt: new Date().toISOString()
        });
        showNotification(`${product.name} added to cart!`, 'success');
    }
    
    // Save to localStorage
    localStorage.setItem('khavho_cart', JSON.stringify(cart));
    
    // Save to Firebase if user is logged in
    saveCartToFirebase(cart);
    
    // Update cart display with animation
    updateCartDisplay();
}

// Save cart to Firebase
async function saveCartToFirebase(cart) {
    if (!auth.currentUser) {
        console.log('💾 User not logged in, cart saved to localStorage only');
        return;
    }
    
    try {
        await db.collection('carts').doc(auth.currentUser.uid).set({
            userId: auth.currentUser.uid,
            userEmail: auth.currentUser.email,
            items: cart,
            updatedAt: new Date().toISOString(),
            totalItems: cart.reduce((total, item) => total + item.quantity, 0),
            totalValue: cart.reduce((total, item) => total + (item.price * item.quantity), 0)
        });
        console.log('💾 Cart saved to Firebase successfully');
    } catch (error) {
        console.error('❌ Error saving cart to Firebase:', error);
    }
}

function updateCartDisplay() {
    const cart = JSON.parse(localStorage.getItem('khavho_cart') || '[]');
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    
    // Update cart count in header
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
        cartCountElement.style.display = cartCount > 0 ? 'inline' : 'none';
        
        // Add pulse animation when cart updates
        cartCountElement.classList.add('cart-pulse');
        setTimeout(() => cartCountElement.classList.remove('cart-pulse'), 600);
    }
    
    // Update cart badge if it exists (fallback)
    const cartBadge = document.querySelector('.cart-badge');
    if (cartBadge) {
        cartBadge.textContent = cartCount;
        cartBadge.style.display = cartCount > 0 ? 'inline' : 'none';
        
        // Add pulse animation
        cartBadge.classList.add('cart-pulse');
        setTimeout(() => cartBadge.classList.remove('cart-pulse'), 600);
    }
    
    // Update cart sidebar content
    updateCartSidebar(cart);
    
    console.log('🛒 Cart updated:', cartCount, 'items');
}

function updateCartSidebar(cart) {
    const cartItemsContainer = document.getElementById('cartItems');
    
    if (!cartItemsContainer) return;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <p>Your cart is empty</p>
                <button onclick="toggleCart()" class="continue-shopping-btn">
                    Continue Shopping
                </button>
            </div>
        `;
        updateTotals(0, 0, 0);
        return;
    }
    
    // Populate cart items
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>R${item.price.toFixed(2)} each</p>
            </div>
            <div class="cart-item-controls">
                <button onclick="updateCartItemQuantity('${item.id}', ${item.quantity - 1})" class="qty-btn">-</button>
                <span class="quantity">${item.quantity}</span>
                <button onclick="updateCartItemQuantity('${item.id}', ${item.quantity + 1})" class="qty-btn">+</button>
                <button onclick="removeCartItem('${item.id}')" class="remove-btn">×</button>
            </div>
            <div class="cart-item-total">R${(item.price * item.quantity).toFixed(2)}</div>
        </div>
    `).join('');
    
    // Calculate and update totals
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const vat = subtotal * 0.15;
    const total = subtotal + vat;
    
    updateTotals(subtotal, vat, total);
}

function updateCartItemQuantity(productId, newQuantity) {
    let cart = JSON.parse(localStorage.getItem('khavho_cart') || '[]');
    
    if (newQuantity <= 0) {
        removeCartItem(productId);
        return;
    }
    
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex !== -1) {
        cart[itemIndex].quantity = newQuantity;
        localStorage.setItem('khavho_cart', JSON.stringify(cart));
        saveCartToFirebase(cart);
        updateCartDisplay();
        
        showNotification('Cart updated!', 'success', 2000);
    }
}

function removeCartItem(productId) {
    let cart = JSON.parse(localStorage.getItem('khavho_cart') || '[]');
    const item = cart.find(item => item.id === productId);
    
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('khavho_cart', JSON.stringify(cart));
    saveCartToFirebase(cart);
    updateCartDisplay();
    
    if (item) {
        showNotification(`${item.name} removed from cart`, 'info', 3000);
    }
}

// Make cart functions globally available
window.updateCartItemQuantity = updateCartItemQuantity;
window.removeCartItem = removeCartItem;

function showOutOfStockMessage() {
    const message = 'This product is currently out of stock. Please contact us for availability.';
    showNotification(message, 'error');
}

// Checkout functionality
// Note: currentCheckoutStep is defined in scripts.js
let selectedPaymentMethod = 'card';

function checkout() {
    const cart = JSON.parse(localStorage.getItem('khavho_cart') || '[]');
    
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }
    
    // Reset checkout
    currentCheckoutStep = 1;
    selectedPaymentMethod = 'card';
    
    // Show modal
    const modal = document.getElementById('checkoutModal');
    modal.classList.add('show');
    
    // Populate cart items
    populateCheckoutItems(cart);
    
    // Update progress
    updateCheckoutProgress();
    
    // Show first step
    showCheckoutStep(1);
    
    showNotification('Starting checkout process...', 'info', 2000);
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    modal.classList.remove('show');
}

function populateCheckoutItems(cart) {
    const checkoutItems = document.getElementById('checkoutItems');
    let subtotal = 0;
    
    checkoutItems.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        return `
            <div class="checkout-item">
                <div class="checkout-item-details">
                    <h4>${item.name}</h4>
                    <p>Quantity: ${item.quantity} × R${item.price.toFixed(2)}</p>
                </div>
                <div class="checkout-item-price">R${itemTotal.toFixed(2)}</div>
            </div>
        `;
    }).join('');
    
    // Update totals
    const vat = subtotal * 0.15;
    const total = subtotal + vat;
    
    // Update both cart sidebar and checkout modal
    updateTotals(subtotal, vat, total);
}

function updateTotals(subtotal, vat, total) {
    // Cart sidebar
    const subtotalElement = document.getElementById('subtotal');
    const vatElement = document.getElementById('vat');
    const totalElement = document.getElementById('total');
    
    if (subtotalElement) subtotalElement.textContent = `R${subtotal.toFixed(2)}`;
    if (vatElement) vatElement.textContent = `R${vat.toFixed(2)}`;
    if (totalElement) totalElement.textContent = `R${total.toFixed(2)}`;
    
    // Checkout modal
    const checkoutSubtotalElement = document.getElementById('checkoutSubtotal');
    const checkoutVatElement = document.getElementById('checkoutVat');
    const checkoutTotalElement = document.getElementById('checkoutTotal');
    
    if (checkoutSubtotalElement) checkoutSubtotalElement.textContent = `R${subtotal.toFixed(2)}`;
    if (checkoutVatElement) checkoutVatElement.textContent = `R${vat.toFixed(2)}`;
    if (checkoutTotalElement) checkoutTotalElement.textContent = `R${total.toFixed(2)}`;
}

function nextCheckoutStep() {
    if (currentCheckoutStep === 2) {
        // Validate form
        if (!validateCustomerForm()) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
    }
    
    if (currentCheckoutStep < 3) {
        currentCheckoutStep++;
        showCheckoutStep(currentCheckoutStep);
        updateCheckoutProgress();
    }
}

function prevCheckoutStep() {
    if (currentCheckoutStep > 1) {
        currentCheckoutStep--;
        showCheckoutStep(currentCheckoutStep);
        updateCheckoutProgress();
    }
}

function showCheckoutStep(step) {
    // Hide all steps
    document.querySelectorAll('.checkout-step').forEach(stepEl => {
        stepEl.classList.remove('active');
    });
    
    // Show current step
    const currentStepEl = document.getElementById(`step${step}`);
    if (currentStepEl) {
        currentStepEl.classList.add('active');
    }
    
    // Update progress steps
    document.querySelectorAll('.progress-steps .step').forEach((stepEl, index) => {
        if (index < step) {
            stepEl.classList.add('active');
        } else {
            stepEl.classList.remove('active');
        }
    });
}

function updateCheckoutProgress() {
    const progressFill = document.getElementById('checkoutProgress');
    const progressPercentage = (currentCheckoutStep / 3) * 100;
    
    if (progressFill) {
        progressFill.style.width = `${progressPercentage}%`;
    }
}

function validateCustomerForm() {
    const requiredFields = ['firstName', 'lastName', 'customerEmail', 'customerPhone', 'deliveryAddress'];
    
    for (const fieldId of requiredFields) {
        const field = document.getElementById(fieldId);
        if (!field || !field.value.trim()) {
            field.focus();
            field.style.borderColor = '#dc3545';
            setTimeout(() => field.style.borderColor = '#eee', 3000);
            return false;
        }
    }
    
    // Email validation
    const email = document.getElementById('customerEmail').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address', 'error');
        return false;
    }
    
    return true;
}

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    // Update radio buttons
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.checked = radio.value === method;
    });
    
    // Update visual selection
    document.querySelectorAll('.payment-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    event.currentTarget.classList.add('selected');
}

async function completeOrder() {
    const submitBtn = document.querySelector('.checkout-submit-btn');
    const loadingText = submitBtn.querySelector('.loading-text');
    const loadingSpinner = submitBtn.querySelector('.loading-spinner');
    const checkIcon = submitBtn.querySelector('i[data-lucide="check-circle"]');
    
    // Show loading state
    submitBtn.classList.add('loading');
    loadingText.textContent = 'Processing...';
    loadingSpinner.style.display = 'inline-block';
    checkIcon.style.display = 'none';
    
    try {
        // Get order data
        const cart = JSON.parse(localStorage.getItem('khavho_cart') || '[]');
        const customerData = {
            firstName: document.getElementById('checkoutFirstName').value,
            lastName: document.getElementById('checkoutLastName').value,
            email: document.getElementById('customerEmail').value,
            phone: document.getElementById('customerPhone').value,
            address: document.getElementById('deliveryAddress').value
        };
        
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const vat = subtotal * 0.15;
        const total = subtotal + vat;
        
        const orderData = {
            orderId: 'KHV-' + Date.now(),
            customer: customerData,
            items: cart,
            totals: { subtotal, vat, total },
            paymentMethod: selectedPaymentMethod,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        // Save order to Firebase
        if (window.db) {
            await window.db.collection('orders').add(orderData);
            console.log('Order saved to Firebase:', orderData.orderId);
        }
        
        // Handle different payment methods
        if (selectedPaymentMethod === 'whatsapp') {
            handleWhatsAppOrder(orderData);
        } else if (selectedPaymentMethod === 'eft') {
            handleEFTOrder(orderData);
        } else {
            handleCardPayment(orderData);
        }
        
        // Clear cart
        localStorage.removeItem('khavho_cart');
        updateCartDisplay();
        
        // Close modal
        setTimeout(() => {
            closeCheckoutModal();
            showNotification('Order completed successfully! 🎉', 'success', 5000);
        }, 2000);
        
    } catch (error) {
        console.error('Error completing order:', error);
        showNotification('Error processing order. Please try again.', 'error');
        
        // Reset button state
        submitBtn.classList.remove('loading');
        loadingText.textContent = 'Complete Order';
        loadingSpinner.style.display = 'none';
        checkIcon.style.display = 'inline-block';
    }
}

function handleWhatsAppOrder(orderData) {
    const message = `🛒 New Order: ${orderData.orderId}

👤 Customer: ${orderData.customer.firstName} ${orderData.customer.lastName}
📧 Email: ${orderData.customer.email}
📱 Phone: ${orderData.customer.phone}
📍 Address: ${orderData.customer.address}

🛍️ Items:
${orderData.items.map(item => `• ${item.name} x${item.quantity} - R${(item.price * item.quantity).toFixed(2)}`).join('\n')}

💰 Total: R${orderData.totals.total.toFixed(2)} (incl. VAT)
💳 Payment: WhatsApp Order

Please confirm this order and provide payment details.`;
    
    const whatsappUrl = `https://wa.me/27123456789?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function handleEFTOrder(orderData) {
    showNotification(`Order ${orderData.orderId} created! EFT payment details will be sent to your email.`, 'success', 6000);
}

function handleCardPayment(orderData) {
    showNotification(`Order ${orderData.orderId} created! Redirecting to secure payment...`, 'success', 4000);
}

// Make functions globally available
window.checkout = checkout;
window.closeCheckoutModal = closeCheckoutModal;
window.nextCheckoutStep = nextCheckoutStep;
window.prevCheckoutStep = prevCheckoutStep;
window.selectPaymentMethod = selectPaymentMethod;
window.completeOrder = completeOrder;

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
        allButtons.forEach(btn => btn.classList.remove('active'));
        
        // Find and activate the clicked button
        const clickedBtn = event ? event.target : document.querySelector(`.filter-btn[onclick*="${category}"]`);
        if (clickedBtn) {
            clickedBtn.classList.add('active');
        }
        
        // Filter products based on category
        const productCards = document.querySelectorAll('.product-card');
        let visibleCount = 0;
        
        productCards.forEach((card, index) => {
            const productCategory = card.getAttribute('data-category');
            const shouldShow = category === 'all' || productCategory === category;
            
            if (shouldShow) {
                card.style.display = 'block';
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    card.style.transition = 'all 0.3s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
                
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Handle empty state
        const productsContainer = document.getElementById('products-grid');
        const existingMessage = document.querySelector('.filter-no-results');
        
        if (existingMessage) {
            existingMessage.remove();
        }
        
        if (visibleCount === 0 && productCards.length > 0) {
            const noResultsDiv = document.createElement('div');
            noResultsDiv.className = 'filter-no-results';
            noResultsDiv.innerHTML = `
                <div class="no-products-message">
                    <h3>No products found</h3>
                    <p>No products match the selected category. Try selecting "All Products".</p>
                    <button class="cta-button" onclick="filterProducts('all')">Show All Products</button>
                </div>
            `;
            productsContainer.appendChild(noResultsDiv);
        }
        
        console.log(`Filtered products: ${visibleCount} visible`);
        
    } catch (error) {
        console.error('Error in filterProducts:', error);
    }
}

// Main Products Loading Function
async function loadFirebaseProducts() {
    if (!window.db) {
        console.error('Firebase not initialized');
        showNotification('Unable to load products - Firebase not available', 'error');
        return;
    }

    try {
        showNotification('Loading products...', 'loading', 2000);
        
        // Simple query without composite index requirement
        const snapshot = await window.db.collection('products').get();
        
        const products = [];
        snapshot.forEach(doc => {
            const productData = { id: doc.id, ...doc.data() };
            // Filter for available products on client side to avoid index requirement
            if (productData.isAvailable !== false) {
                products.push(productData);
            }
        });
        
        // Sort by createdAt on client side (if available)
        products.sort((a, b) => {
            const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return bDate - aDate;
        });
        
        displayProductsOnWebsite(products);
        showNotification(`Loaded ${products.length} products successfully!`, 'success');
        
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error loading products', 'error');
        
        // Show fallback message
        const productsContainer = document.getElementById('products-grid') || 
                                document.getElementById('products-container') ||
                                document.querySelector('.products-section');
        
        if (productsContainer) {
            productsContainer.innerHTML = `
                <div class="no-products-message">
                    <h3>Products Coming Soon</h3>
                    <p>We're currently updating our product catalog. Please check back soon or contact us for more information.</p>
                    <a href="#contact" class="cta-button">Contact Us</a>
                </div>
            `;
        }
    }
}

function displayProductsOnWebsite(products) {
    const productsContainer = document.getElementById('homepage-products-showcase') ||
                            document.getElementById('productsGrid') || 
                            document.getElementById('products-grid') ||
                            document.getElementById('products-container') ||
                            document.querySelector('.products-grid');
    
    if (!productsContainer) {
        console.warn('Products container not found. Available elements:', {
            homepageShowcase: !!document.getElementById('homepage-products-showcase'),
            productsGrid: !!document.getElementById('productsGrid'),
            productsGridClass: !!document.querySelector('.products-grid'),
            documentReady: document.readyState
        });
        return;
    }
    
    if (products.length === 0) {
        productsContainer.innerHTML = `
            <div class="no-products-message">
                <h3>No Products Available</h3>
                <p>We're currently updating our product catalog. Please check back soon!</p>
            </div>
        `;
        return;
    }
    
    // Check if we're on the homepage (index.html) or products page
    const isHomepage = window.location.pathname === '/' || 
                      window.location.pathname.endsWith('index.html') || 
                      window.location.pathname === '/index.html';
    
    if (isHomepage) {
        // Homepage: Display 3 products per category
        displayHomepageProducts(products, productsContainer);
    } else {
        // Products page: Display all products
        displayAllProducts(products, productsContainer);
    }
}

function displayHomepageProducts(products, container) {
    // Group products by category
    const productsByCategory = {};
    products.forEach(product => {
        const category = product.category || 'other';
        if (!productsByCategory[category]) {
            productsByCategory[category] = [];
        }
        productsByCategory[category].push(product);
    });
    
    // Category information for homepage display
    const categoryInfo = {
        'Civil Works': {
            title: 'Civil Works',
            description: 'Essential construction materials & equipment',
            icon: 'hard-hat'
        },
        'civil-works': {
            title: 'Civil Works',
            description: 'Essential construction materials & equipment',
            icon: 'hard-hat'
        },
        'General Building': {
            title: 'General Building',
            description: 'Building materials & components',
            icon: 'building'
        },
        'general-building': {
            title: 'General Building',
            description: 'Building materials & components',
            icon: 'building'
        },
        'Electrical': {
            title: 'Electrical',
            description: 'Complete electrical solutions & equipment',
            icon: 'zap'
        },
        'electrical': {
            title: 'Electrical',
            description: 'Complete electrical solutions & equipment',
            icon: 'zap'
        },
        'Mechanical': {
            title: 'Mechanical',
            description: 'HVAC, pumps & mechanical systems',
            icon: 'settings'
        },
        'mechanical': {
            title: 'Mechanical',
            description: 'HVAC, pumps & mechanical systems',
            icon: 'settings'
        },
        'General Procurement': {
            title: 'General Procurement',
            description: 'Office equipment, tools & supplies',
            icon: 'briefcase'
        },
        'general-procurement': {
            title: 'General Procurement',
            description: 'Office equipment, tools & supplies',
            icon: 'briefcase'
        }
    };
    
    let html = '';
    
    // Display up to 3 products per category
    Object.keys(productsByCategory).forEach(category => {
        const categoryProducts = productsByCategory[category].slice(0, 3); // Take first 3
        const info = categoryInfo[category] || { 
            title: category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
            description: 'Quality products and services',
            icon: 'package'
        };
        
        html += `
            <div class="category-showcase">
                <div class="category-header">
                    <div class="category-icon">
                        <i data-lucide="${info.icon}"></i>
                    </div>
                    <div class="category-info">
                        <h3>${info.title}</h3>
                        <p>${info.description}</p>
                    </div>
                    <a href="products.html#${category}" class="view-all-btn">View All <i data-lucide="arrow-right"></i></a>
                </div>
                <div class="products-row">
                    ${categoryProducts.map((product, index) => createHomepageProductCard(product, index)).join('')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Create homepage product card (simplified with click functionality)
function createHomepageProductCard(product, index) {
    const isAvailable = product.available !== false && product.stock !== 0;
    const price = product.price || 'Contact for Quote';
    const category = product.category || 'other';
    const description = product.description || 'No description available';
    const productCode = product.productCode || `KG-${Date.now()}-${index}`;
    
    // Sanitize for HTML
    const productName = String(product.name || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
    const productId = product.id || `product-${index}`;
    
    return `
        <div class="product-card homepage-card" onclick="showProductDetails('${productId}', '${productName}', '${category}', '${price}', '${description}', '${productCode}')">
            <div class="product-image">
                ${product.imageUrl ? 
                    `<img src="${getImageUrl(product.imageUrl)}" alt="${productName}" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" 
                         loading="lazy" />
                    <div class="product-placeholder" style="display: none;">
                        <i data-lucide="${getProductIcon(category)}"></i>
                    </div>` :
                    `<div class="product-placeholder">
                        <i data-lucide="${getProductIcon(category)}"></i>
                    </div>`
                }
                <div class="product-code">${productCode}</div>
                ${!isAvailable ? '<div class="product-badge out-of-stock">Out of Stock</div>' : ''}
            </div>
            <div class="product-info">
                <h3 class="product-title">${productName}</h3>
                <p class="product-description">${description}</p>
                <div class="product-unit">${product.unit || 'per unit'}</div>
                <div class="product-price">R${typeof price === 'number' ? price.toLocaleString() : price}</div>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="event.stopPropagation(); ${isAvailable ? `addToCart('${productId}')` : 'showOutOfStockMessage()'}">
                        <i data-lucide="${isAvailable ? 'shopping-cart' : 'x-circle'}"></i>
                        ${isAvailable ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                    <button class="btn btn-outline" onclick="event.stopPropagation(); contactViaWhatsApp('${productName}')">
                        <i data-lucide="message-circle"></i>
                        Enquire
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Show product details modal
function showProductDetails(productId, name, category, price, description, productCode) {
    // Create modal HTML
    const modalHTML = `
        <div class="product-modal-overlay" id="productModal" onclick="closeProductModal()">
            <div class="product-modal" onclick="event.stopPropagation()">
                <div class="product-modal-header">
                    <h2>${name}</h2>
                    <button class="modal-close-btn" onclick="closeProductModal()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="product-modal-content">
                    <div class="product-modal-info">
                        <div class="product-meta">
                            <span class="product-code-display">Product Code: ${productCode}</span>
                            <span class="product-category-display">${getCategoryDisplayName(category)}</span>
                        </div>
                        <div class="product-description">
                            <h3>Description</h3>
                            <p>${description}</p>
                        </div>
                        <div class="product-pricing">
                            <h3>Pricing</h3>
                            <div class="price-display">R${typeof price === 'number' ? price.toLocaleString() : price}</div>
                            <p class="price-note">Prices may vary based on quantity and specifications. Contact us for detailed quotes.</p>
                        </div>
                    </div>
                    <div class="product-modal-actions">
                        <button class="btn btn-primary" onclick="addToCart('${productId}')">
                            <i data-lucide="shopping-cart"></i>
                            Add to Cart
                        </button>
                        <button class="btn btn-outline" onclick="contactViaWhatsApp('${name}')">
                            <i data-lucide="message-circle"></i>
                            WhatsApp Enquiry
                        </button>
                        <button class="btn btn-secondary" onclick="requestQuote('${name}', '${productCode}')">
                            <i data-lucide="file-text"></i>
                            Request Quote
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Initialize icons in modal
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Add body class to prevent scrolling
    document.body.classList.add('modal-open');
}

// Close product details modal
function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.remove();
    }
    document.body.classList.remove('modal-open');
}

// Request quote function
function requestQuote(productName, productCode) {
    const subject = encodeURIComponent(`Quote Request - ${productName} (${productCode})`);
    const body = encodeURIComponent(`Hello Khavho Groups,

I would like to request a detailed quote for:

Product: ${productName}
Product Code: ${productCode}

Please provide pricing information including:
- Unit price
- Bulk pricing (if applicable)
- Delivery options and costs
- Availability and lead times

Thank you for your assistance.

Best regards`);
    
    // Open email client
    window.location.href = `mailto:info@khavhogroups.com?subject=${subject}&body=${body}`;
}

function displayAllProducts(products, container) {
    const productsHTML = products.map(product => createProductCard(product)).join('');
    container.innerHTML = productsHTML;
}

function createProductCard(product) {
    // URL-encode the product name for image path
    let imageUrl = product.imageUrl;
    if (!imageUrl && product.name) {
        const encodedName = encodeURIComponent(product.name);
        imageUrl = `images/${encodedName}.webp`;
    }
    
    console.log(`📦 Creating card for: ${product.name}, Image: ${imageUrl || 'NONE'}, Category: ${product.category || 'NONE'}`);
    
    return `
        <div class="product-card" data-category="${(product.category || '').toLowerCase().replace(/\s+/g, '-')}">
            <div class="product-image">
                ${imageUrl ? 
                    createOptimizedImage(imageUrl, product.name, 'product-img') :
                    `<div class="product-placeholder"><i data-lucide="package"></i></div>`
                }
                ${product.productCode ? `<div class="product-code">${product.productCode}</div>` : ''}
            </div>
            
            <div class="product-content">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description || 'High-quality product for professional use.'}</p>
                
                <div class="product-footer">
                    <div class="product-price">R${parseFloat(product.price || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</div>
                    <div class="product-actions">
                        <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
                            <i data-lucide="shopping-cart"></i>
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Get category display name
function getCategoryDisplayName(category) {
    const names = {
        'civil-works': 'Civil Works',
        'general-building': 'General Building',
        'electrical': 'Electrical',
        'mechanical': 'Mechanical',
        'general-procurement': 'General Procurement'
    };
    return names[category] || (category || 'Product').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function contactAboutProduct(productId, productName) {
    const message = `Hi! I'm interested in learning more about "${productName}". Could you please provide more details?`;
    const whatsappURL = `https://wa.me/27123456789?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
}

function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    
    if (cartSidebar && cartOverlay) {
        const isOpen = cartSidebar.classList.contains('open');
        
        if (isOpen) {
            cartSidebar.classList.remove('open');
            cartOverlay.classList.remove('active');
        } else {
            cartSidebar.classList.add('open');
            cartOverlay.classList.add('active');
            updateCartDisplay();
        }
    }
}

// Make functions globally available
window.filterProducts = filterProducts;
window.addToCart = addToCart;
window.contactViaWhatsApp = contactViaWhatsApp;
window.updateCartDisplay = updateCartDisplay;
window.loadFirebaseProducts = loadFirebaseProducts;
window.contactAboutProduct = contactAboutProduct;
window.updateCartItemQuantity = updateCartItemQuantity;
window.removeCartItem = removeCartItem;
window.toggleCart = toggleCart;

// Function to fix categories of existing products (admin only)
async function fixProductCategories() {
    if (!window.db) {
        console.error('Firebase not initialized');
        return;
    }

    // Check if user is authenticated and is admin
    const auth = window.firebase?.auth();
    const currentUser = auth?.currentUser;
    
    if (!currentUser) {
        console.log('⚠️ Category fixing skipped - user not authenticated');
        return;
    }

    // Additional check - verify admin role from user document
    try {
        const userDoc = await window.db.collection('users').doc(currentUser.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'admin') {
            console.log('⚠️ Category fixing skipped - user is not admin');
            return;
        }
    } catch (error) {
        console.log('⚠️ Category fixing skipped - cannot verify admin status:', error);
        return;
    }

    try {
        console.log('🔧 Starting to fix product categories...');
        
        // Get all products using Firebase v8 syntax
        const productsRef = window.db.collection('products');
        const snapshot = await productsRef.get();
        
        const categoryMappings = {
            'Power drill': 'mechanical',
            'drill': 'mechanical',
            'Professional Power Drill Set': 'mechanical'
        };

        let updatesCount = 0;
        
        for (const docSnapshot of snapshot.docs) {
            const product = docSnapshot.data();
            const productId = docSnapshot.id;
            
            // If product has no category or undefined category
            if (!product.category || product.category === 'undefined') {
                // Assign category based on product name or default to mechanical
                const suggestedCategory = categoryMappings[product.name] || 'mechanical';
                
                try {
                    await window.db.collection('products').doc(productId).update({
                        category: suggestedCategory
                    });
                    console.log(`✅ Updated ${product.name} -> ${suggestedCategory}`);
                    updatesCount++;
                } catch (error) {
                    console.error(`❌ Failed to update ${product.name}:`, error);
                }
            }
        }
        
        console.log(`🎉 Successfully updated ${updatesCount} products with categories`);
        
        // Reload products to see the changes
        if (updatesCount > 0) {
            setTimeout(() => {
                loadFirebaseProducts();
            }, 1000);
        }
        
    } catch (error) {
        console.error('❌ Error fixing product categories:', error);
    }
}

// Automatically fix categories when page loads (admin only)
// This is disabled on public website to avoid permission errors
// Call fixProductCategories() manually from admin panel when needed
/*
setTimeout(() => {
    if (window.db) {
        fixProductCategories();
    }
}, 3000);
*/

console.log('Firebase Products System loaded successfully!');

// Display featured products on home page (limited to first 6 products)
function displayFeaturedProducts() {
    const container = document.getElementById('homepage-products-showcase');
    if (!container || !productsData || productsData.length === 0) {
        console.log('⚠️ Cannot display featured products:', {
            container: !!container,
            productsData: productsData ? productsData.length : 0
        });
        return;
    }
    
    console.log('🎨 Displaying featured products on homepage');
    
    // Take only first 6 products for featured display
    const featuredProducts = productsData.slice(0, 6);
    
    // Group by category
    const productsByCategory = {};
    featuredProducts.forEach(product => {
        const category = product.category || 'Other';
        if (!productsByCategory[category]) {
            productsByCategory[category] = [];
        }
        productsByCategory[category].push(product);
    });
    
    // Build HTML
    let html = '';
    Object.keys(productsByCategory).forEach(category => {
        const categoryProducts = productsByCategory[category];
        html += `
            <div class="category-section" data-category="${category}">
                <div class="products-grid">
                    ${categoryProducts.map(product => createProductCard(product)).join('')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Global function exports for HTML onclick handlers
window.addToCart = addToCart;
window.contactAboutProduct = contactAboutProduct;
window.closeCheckoutModal = closeCheckoutModal;
window.toggleCart = toggleCart;
window.displayFeaturedProducts = displayFeaturedProducts;