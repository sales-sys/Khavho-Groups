// SIMPLE WORKING NAVIGATION COMPONENT
class SimpleNavigation {
    render() {
        return `
            <header class="header" id="header">
                <div class="header-top">
                    <div class="container">
                        <div class="header-top-content">
                            <div>Khathu@khavhogroups.com | +27 766 927 310</div>
                            <div>Johannesburg | Serving South Africa</div>
                        </div>
                    </div>
                </div>
                
                <div class="header-main">
                    <div class="container">
                        <nav class="nav-container">
                            <a href="#" class="logo" onclick="showPage('home')">
                                <div class="logo-icon">
                                    <img src="images/logo.png" alt="Khavho Groups Logo" onerror="this.parentElement.innerHTML='<i data-lucide=\\'building-2\\'></i>'">
                                </div>
                            </a>
                            
                            <div class="main-nav" id="mainNav">
                                <ul class="nav-menu">
                                    <li class="nav-item">
                                        <a href="#" class="nav-link" onclick="showPage('home')">
                                            <i data-lucide="home"></i>
                                            Home
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a href="#" class="nav-link" onclick="showPage('about')">
                                            <i data-lucide="users"></i>
                                            About
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a href="#" class="nav-link" onclick="showPage('services')">
                                            <i data-lucide="briefcase"></i>
                                            Services
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a href="products.html" class="nav-link">
                                            <i data-lucide="package"></i>
                                            Products
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a href="#" class="nav-link" onclick="showPage('contact')">
                                            <i data-lucide="phone"></i>
                                            Contact
                                        </a>
                                    </li>
                                </ul>
                                
                                <div class="header-cta">
                                    <div class="auth-buttons">
                                        <!-- Auth buttons will be populated by JavaScript -->
                                    </div>
                                    
                                    <div class="cart-icon" onclick="toggleCart()" style="position: relative; cursor: pointer; padding: 8px;">
                                        <i data-lucide="shopping-cart"></i>
                                        <span class="cart-count" id="cartCount" style="display: none;">0</span>
                                    </div>
                                </div>
                                
                                <!-- Mobile auth buttons -->
                                <div class="mobile-auth auth-buttons">
                                    <!-- Mobile auth buttons will be populated by JavaScript -->
                                </div>
                            </div>
                            
                            <button class="mobile-menu-toggle" id="mobileMenuToggle" onclick="toggleMobileMenu()">
                                <span class="hamburger-line"></span>
                                <span class="hamburger-line"></span>
                                <span class="hamburger-line"></span>
                            </button>
                        </nav>
                    </div>
                </div>
            </header>
        `;
    }

    mount(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = this.render();
            // Initialize Lucide icons after mounting
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }
}

// Auto-initialize navigation when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    const navContainer = document.getElementById('navigation-container');
    if (navContainer) {
        const navigation = new SimpleNavigation();
        navigation.mount('navigation-container');
        console.log('✅ Simple navigation mounted');
    }
});

window.SimpleNavigation = SimpleNavigation;