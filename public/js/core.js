// Core JavaScript - Common functionality across all pages
console.log('🚀 Khavho Groups Core JS Loaded');

// Global variables
let currentUser = null;
let cart = [];

// Initialize Firebase Auth when available
function initializeFirebaseAuth() {
    if (typeof auth === 'undefined' || !auth) {
        console.log('Firebase auth not ready, retrying...');
        setTimeout(initializeFirebaseAuth, 100);
        return;
    }

    // Firebase Authentication State Observer
    auth.onAuthStateChanged(function(user) {
        if (user) {
            currentUser = user;
            console.log('User signed in:', user.email);
            // Update UI for authenticated user
            updateUserUI(user);
        } else {
            currentUser = null;
            console.log('User signed out');
            // Update UI for guest user
            updateUserUI(null);
        }
    });
}

// Update UI based on authentication state
function updateUserUI(user) {
    // This function can be used to update any UI elements based on auth state
    // For example, show/hide certain features
    
    if (user) {
        console.log('✅ User authenticated:', user.email);
    } else {
        console.log('👤 Guest user');
    }
}

// Mobile menu toggle
function toggleMobileMenu() {
    const mainNav = document.getElementById('mainNav');
    const mobileToggle = document.getElementById('mobileMenuToggle');
    
    if (mainNav && mobileToggle) {
        mainNav.classList.toggle('active');
        mobileToggle.classList.toggle('active');
    }
}

// Cart functionality
function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    
    if (cartSidebar) {
        cartSidebar.classList.toggle('open');
    }
    if (cartOverlay) {
        cartOverlay.classList.toggle('active');
    }
}

function updateCartDisplay() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
        if (itemCount > 0) {
            cartCount.textContent = itemCount;
            cartCount.style.display = 'block';
        } else {
            cartCount.style.display = 'none';
        }
    }
}

// Logout function
function signOut() {
    if (typeof auth !== 'undefined' && auth) {
        auth.signOut().then(() => {
            console.log('User signed out successfully');
            // Redirect to home page
            window.location.href = '/';
        }).catch((error) => {
            console.error('Error signing out:', error);
        });
    }
}

// Initialize mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Core initialization starting...');
    
    // Initialize Firebase Auth
    initializeFirebaseAuth();
    
    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobileMenuToggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Dropdown handling for mobile
    const dropdowns = document.querySelectorAll('.nav-item.dropdown');
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                dropdown.classList.toggle('mobile-active');
            }
        });
    });
    
    // Initialize cart if cart elements exist
    if (document.getElementById('cartSidebar')) {
        updateCartDisplay();
        
        // Cart overlay close
        const cartOverlay = document.getElementById('cartOverlay');
        if (cartOverlay) {
            cartOverlay.addEventListener('click', toggleCart);
        }
    }
    
    console.log('✅ Core initialization complete');
});