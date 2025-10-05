// Khavho Groups - Main Website JavaScript

// Initialize Lucide icons
lucide.createIcons();

// Global variables
let currentPage = 'home';
let cart = [];
let products = [];
let currentUser = null;

// Firebase is initialized in firebase-config.js
// Using secure environment variables

// Firebase Authentication State Observer
auth.onAuthStateChanged(function(user) {
    if (user) {
        currentUser = user;
        updateAuthUI(true);
        console.log('User signed in:', user.email);
    } else {
        currentUser = null;
        updateAuthUI(false);
        console.log('User signed out');
    }
});

async function updateAuthUI(isSignedIn) {
    const authButtons = document.querySelectorAll('.auth-buttons');
    
    if (isSignedIn) {
        // Check if user is admin
        let isAdmin = false;
        try {
            const userDoc = await db.collection('users').doc(currentUser.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                isAdmin = userData.role === 'admin';
            }
        } catch (error) {
            console.log('Error checking admin status:', error);
        }
        
        authButtons.forEach(authButtonContainer => {
            const adminBadge = isAdmin ? '<span class="admin-badge">ADMIN</span>' : '';
            const adminControls = isAdmin ? `
                <div class="admin-controls">
                    <button class="admin-btn" onclick="openAdminPanel()">
                        <i data-lucide="settings"></i>
                        Admin Panel
                    </button>
                </div>
            ` : '';
            
            authButtonContainer.innerHTML = `
                <div class="user-menu">
                    <div class="user-info">
                        <span class="user-email">${currentUser.email}</span>
                        ${adminBadge}
                    </div>
                    ${adminControls}
                    <button class="auth-btn logout-btn" onclick="signOut()">
                        <i data-lucide="log-out"></i>
                        Logout
                    </button>
                </div>
            `;
        });
    } else {
        authButtons.forEach(authButtonContainer => {
            authButtonContainer.innerHTML = `
                <button class="auth-btn login-btn" onclick="openLoginModal()">
                    <i data-lucide="log-in"></i>
                    Login
                </button>
                <button class="auth-btn register-btn" onclick="openRegisterModal()">
                    <i data-lucide="user-plus"></i>
                    Register
                </button>
            `;
        });
    }
    
    // Reinitialize icons
    lucide.createIcons();
}

// Admin Panel Function
function openAdminPanel() {
    // Open admin panel in new tab
    window.open('admin.html', '_blank');
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Main scripts initializing...');
    initializeProducts();
    loadCartFromStorage();
    updateCartDisplay();
    animateCounters();
    setupScrollEffects();
    
    // Force product refresh after a short delay
    setTimeout(() => {
        console.log('🔄 Forcing product refresh...');
        if (typeof window.refreshProducts === 'function') {
            window.refreshProducts();
        }
    }, 3000);
});

// Navigation functions
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const pageEl = document.getElementById(pageId + 'Page');
    if (pageEl) {
        pageEl.classList.add('active');
    }

    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    // Highlight the correct nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.textContent.trim().toLowerCase().includes(pageId)) {
            link.classList.add('active');
        }
    });
    currentPage = pageId;

    // Close mobile menu if open
    document.getElementById('mainNav').classList.remove('active');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Load page-specific content
    if (pageId === 'home') {
        loadProducts();
        setTimeout(animateCounters, 500);
    }
}

function showSubsidiary(subsidiary) {
    // Navigate to subsidiary website
    const subsidiaryUrls = {
        'holdings': 'khavho-holdings.html',
        'capital': 'khavho-capital.html',
        'inter-africa': 'khavho-inter-africa.html'
    };
    
    if (subsidiaryUrls[subsidiary]) {
        window.open(subsidiaryUrls[subsidiary], '_blank');
    } else {
        alert('Subsidiary website coming soon!');
    }
}

// Mobile menu toggle
function toggleMobileMenu() {
    const mainNav = document.getElementById('mainNav');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    
    mainNav.classList.toggle('active');
    mobileMenuToggle.classList.toggle('active');
}

// Authentication Modal Functions
function openLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function openRegisterModal() {
    document.getElementById('registerModal').style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto'; // Re-enable scrolling
}

function switchModal(fromModalId, toModalId) {
    closeModal(fromModalId);
    document.getElementById(toModalId).style.display = 'flex';
}

// Close modals when clicking outside
window.onclick = function(event) {
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    
    if (event.target === loginModal) {
        closeModal('loginModal');
    } else if (event.target === registerModal) {
        closeModal('registerModal');
    }
}

// Firebase Authentication Functions
function signIn(email, password) {
    const loginBtn = document.querySelector('#loginForm .auth-form-btn');
    const originalText = loginBtn.innerHTML;
    
    // Show loading state
    loginBtn.innerHTML = '<i data-lucide="loader"></i> Signing in...';
    loginBtn.disabled = true;
    
    return auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('User signed in successfully:', userCredential.user.email);
            closeModal('loginModal');
            showSuccessMessage('Welcome back! You have been signed in successfully.');
        })
        .catch((error) => {
            console.error('Sign in error:', error);
            showErrorMessage(getFirebaseErrorMessage(error.code));
        })
        .finally(() => {
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
            lucide.createIcons();
        });
}

function signUp(name, email, password) {
    const registerBtn = document.querySelector('#registerForm .auth-form-btn');
    const originalText = registerBtn.innerHTML;
    
    // Show loading state
    registerBtn.innerHTML = '<i data-lucide="loader"></i> Creating account...';
    registerBtn.disabled = true;
    
    return auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Update the user's display name
            return userCredential.user.updateProfile({
                displayName: name
            }).then(() => {
                // Store additional user data in Firestore
                return db.collection('users').doc(userCredential.user.uid).set({
                    name: name,
                    email: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
            }).then(() => {
                console.log('User registered successfully:', userCredential.user.email);
                closeModal('registerModal');
                showSuccessMessage('Account created successfully! Welcome to Khavho Group.');
            });
        })
        .catch((error) => {
            console.error('Sign up error:', error);
            showErrorMessage(getFirebaseErrorMessage(error.code));
        })
        .finally(() => {
            registerBtn.innerHTML = originalText;
            registerBtn.disabled = false;
            lucide.createIcons();
        });
}

function signOut() {
    auth.signOut().then(() => {
        console.log('User signed out successfully');
        showSuccessMessage('You have been signed out successfully.');
    }).catch((error) => {
        console.error('Sign out error:', error);
        showErrorMessage('Error signing out. Please try again.');
    });
}

function getFirebaseErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/user-not-found':
            return 'No account found with this email address.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/email-already-in-use':
            return 'An account with this email already exists.';
        case 'auth/weak-password':
            return 'Password is too weak. Please use at least 6 characters.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        default:
            return 'An error occurred. Please try again.';
    }
}

function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message show';
    successDiv.innerHTML = `<i data-lucide="check-circle"></i> ${message}`;
    
    document.body.appendChild(successDiv);
    lucide.createIcons();
    
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}

function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.display = 'flex';
    errorDiv.innerHTML = `<i data-lucide="alert-circle"></i> ${message}`;
    
    document.body.appendChild(errorDiv);
    lucide.createIcons();
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Authentication Form Handlers with Firebase Integration
document.addEventListener('DOMContentLoaded', function() {
    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            if (!email || !password) {
                showErrorMessage('Please fill in all fields.');
                return;
            }
            
            signIn(email, password);
        });
    }
    
    // Register form handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('registerName').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (!name || !email || !password || !confirmPassword) {
                showErrorMessage('Please fill in all fields.');
                return;
            }
            
            if (password !== confirmPassword) {
                showErrorMessage('Passwords do not match!');
                return;
            }
            
            if (password.length < 6) {
                showErrorMessage('Password must be at least 6 characters long.');
                return;
            }
            
            signUp(name, email, password);
        });
    }
});

// Products functionality
function initializeProducts() {
    // Wait for getSharedProducts to be available
    if (typeof window.getSharedProducts === 'function') {
        products = getSharedProducts();
        console.log('🚀 Initializing products:', products.length, 'found');
        loadProducts();
    } else {
        // Wait and retry
        setTimeout(() => {
            if (typeof window.getSharedProducts === 'function') {
                products = getSharedProducts();
                console.log('🚀 Initializing products (retry):', products.length, 'found');
                loadProducts();
            } else {
                console.log('getSharedProducts not available, using fallback');
                products = [];
                loadProducts();
            }
        }, 500);
    }
}

// Manual refresh function for debugging
function refreshProducts() {
    console.log('🔄 Manual product refresh triggered');
    if (typeof window.getSharedProducts === 'function') {
        products = getSharedProducts();
        console.log('📦 Products available:', products.length);
        loadProducts();
    } else {
        console.log('❌ getSharedProducts not available');
    }
}

// Make refresh function globally available for debugging
window.refreshProducts = refreshProducts;

// Listen for product updates from admin panel
window.addEventListener('productsUpdated', function(event) {
    console.log('🔄 Products updated event received:', event.detail);
    if (typeof window.getSharedProducts === 'function') {
        products = getSharedProducts();
        console.log('📦 Refreshing main website with', products.length, 'products');
        loadProducts(); // Refresh the display
        showNotification('Products updated from admin panel!', 'success');
    }
});

// Load products from Firebase
// Load products from shared products system
function loadProducts(filter = 'all') {
    // ⚠️ NOTE: Product display is now handled by shared-products-firebase.js
    // This function is kept for compatibility but redirects to Firebase system
    console.log('📍 loadProducts called with filter:', filter);
    
    // Don't manipulate the DOM here - let Firebase handle it
    // Just update the filter and let Firebase system handle display
    if (window.updateProductFilter && typeof window.updateProductFilter === 'function') {
        window.updateProductFilter(filter);
    } else {
        console.log('🔄 Firebase product system will handle display');
    }
    
    return; // Exit early - Firebase handles the rest
}

function getProductIcon(category) {
    const icons = {
        'capital': 'hard-hat',
        'holdings': 'trending-up', 
        'inter-africa': 'banknote',
        'other': 'users',
        'construction': 'hard-hat',
        'investment': 'trending-up',
        'financial': 'banknote',
        'consulting': 'users'
    };
    return icons[category] || 'package';
}

function getCategoryDisplayName(category) {
    const names = {
        'capital': 'KHAVHO CAPITAL',
        'holdings': 'KHAVHO HOLDINGS',
        'inter-africa': 'KHAVHO INTER AFRICA', 
        'other': 'OTHER SERVICES',
        'construction': 'CONSTRUCTION',
        'investment': 'INVESTMENT',
        'financial': 'FINANCIAL',
        'consulting': 'CONSULTING'
    };
    return names[category] || category.toUpperCase();
}

function filterProducts(category) {
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Load filtered products
    loadProducts(category);
}

// Cart functionality
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    saveCartToStorage();
    
    // Show success feedback
    event.target.innerHTML = '<i data-lucide="check"></i> Added!';
    event.target.style.background = '#38a169';
    
    setTimeout(() => {
        event.target.innerHTML = '<i data-lucide="shopping-cart"></i> Add to Cart';
        event.target.style.background = '';
        lucide.createIcons();
    }, 2000);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
    saveCartToStorage();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        updateCartDisplay();
        saveCartToStorage();
    }
}

function updateCartDisplay() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const subtotalEl = document.getElementById('subtotal');
    const vatEl = document.getElementById('vat');
    const totalEl = document.getElementById('total');
    
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalItems;
    
    // Update cart items
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = '<p style="text-align: center; color: #718096; padding: 40px;">Your cart is empty</p>';
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <i data-lucide="${getProductIcon(item.category)}"></i>
                    </div>
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.title}</div>
                        <div class="cart-item-price">R${item.price.toLocaleString()}</div>
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                            <button class="quantity-btn" onclick="removeFromCart(${item.id})" style="margin-left: 10px; color: #e53e3e;">
                                <i data-lucide="trash-2" width="16" height="16"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
    
    // Update totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const vat = subtotal * 0.15;
    const total = subtotal + vat;
    
    if (subtotalEl) subtotalEl.textContent = `R${subtotal.toLocaleString()}`;
    if (vatEl) vatEl.textContent = `R${vat.toLocaleString()}`;
    if (totalEl) totalEl.textContent = `R${total.toLocaleString()}`;
    
    // Reinitialize icons
    lucide.createIcons();
}

function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    if (cartSidebar) {
        cartSidebar.classList.toggle('open');
    }
}

function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.15;
    alert(`Proceeding to checkout with total: R${total.toLocaleString()}\n\nThis is a demo - no actual payment will be processed.`);
    
    // Clear cart after checkout
    cart = [];
    updateCartDisplay();
    saveCartToStorage();
    toggleCart();
}

function saveCartToStorage() {
    localStorage.setItem('khavhoCart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('khavhoCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Form submission
function submitContactForm(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('.submit-btn');
    const successMessage = document.getElementById('contactSuccessMessage');
    
    // Add loading state
    submitBtn.classList.add('loading');
    submitBtn.innerHTML = '<i data-lucide="loader"></i> Sending...';
    
    // Simulate form submission
    setTimeout(() => {
        // Show success message
        if (successMessage) successMessage.classList.add('show');
        
        // Reset form
        form.reset();
        
        // Reset button
        submitBtn.classList.remove('loading');
        submitBtn.innerHTML = '<i data-lucide="send"></i> Send Message';
        lucide.createIcons();
        
        // Hide success message after 5 seconds
        setTimeout(() => {
            if (successMessage) successMessage.classList.remove('show');
        }, 5000);
        
        // Scroll to top of form
        if (successMessage) {
            successMessage.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }, 2000);
}

// Counter animation
function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    
    counters.forEach(counter => {
        const target = parseFloat(counter.getAttribute('data-target'));
        const increment = target / 100;
        let current = 0;
        
        const updateCounter = () => {
            if (current < target) {
                current += increment;
                if (target === 2.8) {
                    counter.textContent = current.toFixed(1);
                } else {
                    counter.textContent = Math.ceil(current) + (target === 98 ? '%' : target >= 100 ? '+' : '');
                }
                setTimeout(updateCounter, 20);
            } else {
                if (target === 2.8) {
                    counter.textContent = target.toFixed(1);
                } else {
                    counter.textContent = target + (target === 98 ? '%' : target >= 100 ? '+' : '');
                }
            }
        };
        
        updateCounter();
    });
}

// Scroll effects
function setupScrollEffects() {
    // Header scroll effect
    window.addEventListener('scroll', () => {
        const header = document.getElementById('header');
        if (header) {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    });
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-up');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.subsidiary-card, .service-card, .product-card, .value-card').forEach(el => {
        observer.observe(el);
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        
        // Skip if href is just '#' or empty
        if (!href || href === '#' || href.length <= 1) {
            return;
        }
        
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', function(e) {
    const mainNav = document.getElementById('mainNav');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    
    if (mainNav && mobileToggle && !mainNav.contains(e.target) && !mobileToggle.contains(e.target)) {
        mainNav.classList.remove('active');
    }
});

// Close cart when clicking outside
document.addEventListener('click', function(e) {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartIcon = document.querySelector('.cart-icon');
    
    if (cartSidebar && cartIcon && !cartSidebar.contains(e.target) && !cartIcon.contains(e.target)) {
        cartSidebar.classList.remove('open');
    }
});

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const mainNav = document.getElementById('mainNav');
        const cartSidebar = document.getElementById('cartSidebar');
        if (mainNav) mainNav.classList.remove('active');
        if (cartSidebar) cartSidebar.classList.remove('open');
    }
});

// Form validation enhancement
document.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('blur', function() {
        if (this.hasAttribute('required') && !this.value.trim()) {
            this.style.borderColor = '#e53e3e';
        } else {
            this.style.borderColor = '#e2e8f0';
        }
    });
    
    field.addEventListener('focus', function() {
        this.style.borderColor = '#F37021';
    });
});

// Auto-resize textarea
document.addEventListener('input', function(e) {
    if (e.target.tagName === 'TEXTAREA') {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    }
});

// Loading states for interactive elements
document.querySelectorAll('.btn, .cta-button, .subsidiary-button').forEach(element => {
    element.addEventListener('click', function(e) {
        if (this.onclick || (this.href && !this.href.startsWith('#'))) {
            this.style.opacity = '0.7';
            this.style.pointerEvents = 'none';
            setTimeout(() => {
                this.style.opacity = '1';
                this.style.pointerEvents = 'auto';
            }, 1500);
        }
    });
});

// Initialize page animations
document.addEventListener('DOMContentLoaded', () => {
    // Add fade-in animation to hero content
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.opacity = '0';
        heroContent.style.transform = 'translateY(30px)';
        heroContent.style.transition = 'all 1s ease';
        
        setTimeout(() => {
            heroContent.style.opacity = '1';
            heroContent.style.transform = 'translateY(0)';
        }, 300);
    }
});

// Ensure all clickable cards and buttons are visually clear
document.querySelectorAll('.subsidiary-card, .service-card, .solution-category').forEach(card => {
    card.style.cursor = 'pointer';
});

// Add hover effect for clickable cards
document.querySelectorAll('.subsidiary-card, .service-card, .solution-category').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.boxShadow = '0 20px 60px rgba(243,112,33,0.15)';
    });
    card.addEventListener('mouseleave', function() {
        this.style.boxShadow = '';
    });
});

// Load products when page loads and setup real-time updates
document.addEventListener('DOMContentLoaded', function() {
    // Load products from Firebase
    loadProducts();
    
    // Refresh products every 30 seconds to get real-time updates from admin panel
    setInterval(loadProducts, 30000);
});

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : type === 'warning' ? 'alert-triangle' : 'info'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add notification styles if not already added
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                max-width: 400px;
                transform: translateX(100%);
                transition: transform 0.3s ease;
            }
            .notification.show {
                transform: translateX(0);
            }
            .notification-success { background: #38a169; }
            .notification-error { background: #e53e3e; }
            .notification-warning { background: #d69e2e; }
            .notification-info { background: #3182ce; }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .loading-products, .no-products, .error-products {
                text-align: center;
                padding: 40px 20px;
                color: #666;
                font-size: 16px;
            }
            .product-badge.badge-danger {
                background: #e53e3e;
                color: white;
            }
            .product-badge.badge-warning {
                background: #d69e2e;
                color: white;
            }
            .product-stock {
                font-size: 14px;
                color: #666;
                margin: 8px 0;
            }
            .add-to-cart.unavailable {
                background: #a0aec0;
                color: white;
                cursor: not-allowed;
            }
            .add-to-cart.available {
                background: #F37021;
                color: white;
                cursor: pointer;
            }
            .auth-form-btn {
                background: var(--secondary-orange);
                color: white;
                padding: 15px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                width: 100%;
            }
            .auth-form-btn:hover {
                background: #e55a0a;
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(243, 112, 33, 0.4);
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    lucide.createIcons();
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove notification after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 4000);
}