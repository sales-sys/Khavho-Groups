// Firebase Products System for Khavho Groups
// Integrated with existing website structure

// Wait for Firebase to be initialized by firebase-config.js
document.addEventListener('DOMContentLoaded', function() {
    // Wait a moment for Firebase to initialize
    setTimeout(() => {
        if (window.firebase && window.db) {
            console.log('Initializing Firebase Products System...');
            initializeProducts();
            setupFilterButtons();
        } else {
            console.error('Firebase not initialized properly');
        }
    }, 100);
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

// Make function globally available immediately
window.getSharedProducts = getSharedProducts;

// Also provide a fallback for early calls
if (!window.getSharedProducts) {
    window.getSharedProducts = function() {
        console.log('getSharedProducts called before initialization, returning empty array');
        return [];
    };
}

// Initialize products from Firebase
function initializeProducts() {
    console.log('Setting up Firebase products listener...');
    
    try {
        // Clean up existing listener
        if (unsubscribeProducts) {
            unsubscribeProducts();
        }

        // Show loading state
        showProductsLoading();

        // Set up real-time listener for products
        unsubscribeProducts = window.db.collection('products')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                console.log('Products snapshot received:', snapshot.size, 'documents');
                
                productsData = [];
                snapshot.forEach((doc) => {
                    const productData = { id: doc.id, ...doc.data() };
                    productsData.push(productData);
                });

                console.log('Products loaded:', productsData.length);
                displayProducts(productsData);
            }, (error) => {
                console.error('Error loading products:', error);
                showProductsError('Failed to load products. Please try again.');
            });

    } catch (error) {
        console.error('Error setting up products listener:', error);
        showProductsError('Unable to connect to the database.');
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

// Create individual product card
function createProductCard(product, index) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.animationDelay = `${index * 0.1}s`;

    // Determine badge class and text
    const badgeClass = product.available ? 'badge-success' : 'badge-danger';
    const badgeText = product.available ? 'Available' : 'Unavailable';
    
    // Format price
    const formattedPrice = formatPrice(product.price);
    
    // Create image element or placeholder
    const imageElement = product.imageUrl 
        ? `<img src="${product.imageUrl}" alt="${escapeHtml(product.name)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'">`
        : `<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 48px; color: #718096;">📦</div>`;

    card.innerHTML = `
        <div class="product-image">
            ${imageElement}
        </div>
        <div class="product-badge ${badgeClass}">
            ${badgeText}
        </div>
        <div class="product-content">
            <div class="product-category">${getCategoryName(product.category || 'general')}</div>
            <h3 class="product-title">${escapeHtml(product.name)}</h3>
            <p class="product-description">${escapeHtml(product.description || 'No description available')}</p>
        </div>
        <div class="product-footer">
            <div class="product-price">${formattedPrice}</div>
            <div class="product-actions">
                <button class="btn btn-primary btn-sm" 
                        ${!product.available ? 'disabled' : ''} 
                        onclick="handleProductInquiry('${product.id}', '${escapeHtml(product.name)}')">
                    <i data-lucide="message-circle"></i>
                    ${product.available ? 'Inquire' : 'Unavailable'}
                </button>
                <button class="btn btn-outline btn-sm" onclick="viewProductDetails('${product.id}')">
                    <i data-lucide="eye"></i>
                    Details
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

// Setup filter buttons functionality
function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get filter value from onclick attribute or data attribute
            const filterValue = this.textContent.toLowerCase().replace(' products', '').replace('all', 'all');
            currentFilter = filterValue;
            
            // Re-display products with new filter
            displayProducts(productsData);
        });
    });
}

// Global filter function for existing onclick handlers
window.filterProducts = function(category) {
    currentFilter = category;
    
    // Update active button
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if ((category === 'all' && btn.textContent.includes('All')) ||
            btn.textContent.toLowerCase().includes(category)) {
            btn.classList.add('active');
        }
    });
    
    // Re-display products
    displayProducts(productsData);
};

// Handle product inquiry
window.handleProductInquiry = function(productId, productName) {
    console.log('Inquiry for product:', productId, productName);
    
    const message = `Hi! I'm interested in learning more about "${productName}". Could you please provide more details?`;
    const whatsappNumber = '+27123456789'; // Replace with actual number
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
    
    if (confirm(`Would you like to inquire about "${productName}" via WhatsApp?`)) {
        window.open(whatsappUrl, '_blank');
    } else {
        // Alternative: scroll to contact section
        const contactSection = document.getElementById('contactPage') || document.querySelector('.contact-section');
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
};

// View product details
window.viewProductDetails = function(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) {
        alert('Product details not available.');
        return;
    }
    
    showProductModal(product);
};

// Show product details modal
function showProductModal(product) {
    // Remove existing modal if any
    const existingModal = document.getElementById('product-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'product-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        max-width: 600px;
        width: 100%;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;

    const imageElement = product.imageUrl 
        ? `<img src="${product.imageUrl}" alt="${product.name}" style="width: 100%; height: 300px; object-fit: cover;" onerror="this.style.display='none'">`
        : '';

    modalContent.innerHTML = `
        <button onclick="closeProductModal()" style="
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(0, 0, 0, 0.5);
            color: white;
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1;
        ">×</button>
        ${imageElement}
        <div style="padding: 30px;">
            <div style="margin-bottom: 15px;">
                <span style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; background: ${product.available ? '#d4edda' : '#f8d7da'}; color: ${product.available ? '#155724' : '#721c24'};">
                    ${product.available ? 'Available' : 'Unavailable'}
                </span>
            </div>
            <h2 style="color: var(--primary-navy); margin-bottom: 10px; font-size: 28px;">${escapeHtml(product.name)}</h2>
            <p style="color: var(--medium-gray); margin-bottom: 20px; font-size: 16px; line-height: 1.6;">${escapeHtml(product.description || 'No description available')}</p>
            <div style="font-size: 24px; font-weight: bold; color: var(--secondary-orange); margin-bottom: 30px;">${formatPrice(product.price)}</div>
            <div style="display: flex; gap: 15px; margin-top: 30px;">
                <button onclick="handleProductInquiry('${product.id}', '${escapeHtml(product.name)}')" 
                        style="flex: 1; padding: 12px 20px; background: var(--secondary-orange); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 16px;"
                        ${!product.available ? 'disabled style="opacity: 0.6; cursor: not-allowed;"' : ''}>
                    ${product.available ? 'Inquire Now' : 'Currently Unavailable'}
                </button>
                <button onclick="closeProductModal()" 
                        style="flex: 1; padding: 12px 20px; background: var(--medium-gray); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 16px;">
                    Close
                </button>
            </div>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeProductModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', handleModalKeydown);
}

// Close product modal
window.closeProductModal = function() {
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.remove();
        document.removeEventListener('keydown', handleModalKeydown);
    }
};

// Handle modal keyboard events
function handleModalKeydown(e) {
    if (e.key === 'Escape') {
        closeProductModal();
    }
}

// Utility functions
function formatPrice(price) {
    if (!price || price === 0) {
        return 'Contact for Price';
    }
    
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(numPrice)) {
        return 'Contact for Price';
    }
    
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR'
    }).format(numPrice);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getCategoryName(category) {
    const categoryMap = {
        'construction': 'Construction',
        'investment': 'Investment',
        'financial': 'Financial',
        'consulting': 'Consulting',
        'general': 'General'
    };
    return categoryMap[category] || 'General';
}

// Loading and error states
function showProductsLoading() {
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <div style="display: inline-block; width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top: 4px solid var(--secondary-orange); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
                <p style="color: var(--medium-gray); font-size: 16px;">Loading products...</p>
            </div>
        `;
    }
}

function showProductsError(message) {
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <div style="color: var(--error-red); font-size: 48px; margin-bottom: 20px;">⚠️</div>
                <h3 style="color: var(--primary-navy); margin-bottom: 15px;">Unable to Load Products</h3>
                <p style="color: var(--medium-gray); margin-bottom: 20px;">${message}</p>
                <button onclick="initializeProducts()" style="background: var(--secondary-orange); color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    Try Again
                </button>
            </div>
        `;
    }
}

function showNoProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <div style="color: var(--medium-gray); font-size: 48px; margin-bottom: 20px;">📦</div>
                <h3 style="color: var(--primary-navy); margin-bottom: 15px;">No Products Available</h3>
                <p style="color: var(--medium-gray);">Products will appear here once they are added.</p>
            </div>
        `;
    }
}

function showNoProductsInCategory() {
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <div style="color: var(--medium-gray); font-size: 48px; margin-bottom: 20px;">🔍</div>
                <h3 style="color: var(--primary-navy); margin-bottom: 15px;">No Products in This Category</h3>
                <p style="color: var(--medium-gray);">Try selecting a different category or view all products.</p>
            </div>
        `;
    }
}

// Add CSS for spin animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Cleanup function
window.addEventListener('beforeunload', () => {
    if (unsubscribeProducts) {
        unsubscribeProducts();
    }
});

console.log('Firebase Products System loaded successfully!');