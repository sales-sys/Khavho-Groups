// Unified Navigation Component - Exact copy from index.html
// This ensures all pages have identical navigation

class NavigationComponent {
    constructor() {
        this.currentPage = this.getCurrentPage();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('products.html')) return 'products';
        if (path.includes('admin.html')) return 'admin';
        if (path.includes('khavho-capital.html')) return 'capital';
        if (path.includes('khavho-holdings.html')) return 'holdings';
        if (path.includes('khavho-inter-africa.html')) return 'inter-africa';
        return 'home';
    }

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
                            <a href="${this.currentPage === 'home' ? '#' : 'index.html'}" class="logo" ${this.currentPage === 'home' ? "onclick=\"showPage('home')\"" : ''}>
                                <div class="logo-icon">
                                    <img src="images/logo.png" alt="Khavho Groups Logo" onerror="this.parentElement.innerHTML='<i data-lucide=\\'building-2\\'></i>'">
                                </div>
                            </a>
                            
                            <div class="main-nav" id="mainNav">
                                <ul class="nav-menu">
                                    <li class="nav-item">
                                        <a href="${this.currentPage === 'home' ? '#' : 'index.html'}" class="nav-link ${this.currentPage === 'home' ? 'active' : ''}" ${this.currentPage === 'home' ? "onclick=\"showPage('home')\"" : ''}>
                                            <i data-lucide="home"></i>
                                            Home
                                        </a>
                                    </li>
                                    <li class="nav-item dropdown">
                                        <a href="#" class="nav-link">
                                            <i data-lucide="building"></i>
                                            Companies
                                            <i data-lucide="chevron-down"></i>
                                        </a>
                                        <div class="dropdown-menu">
                                            <a href="${this.currentPage === 'home' ? '#' : 'index.html'}" class="dropdown-item" ${this.currentPage === 'home' ? "onclick=\"showSubsidiary('holdings')\"" : ''}>
                                                <strong>Khavho Holdings</strong>
                                                <small>Construction & Development</small>
                                            </a>
                                            <a href="${this.currentPage === 'home' ? '#' : 'index.html'}" class="dropdown-item" ${this.currentPage === 'home' ? "onclick=\"showSubsidiary('capital')\"" : ''}>
                                                <strong>Khavho Capital</strong>
                                                <small>Investment & Asset Management</small>
                                            </a>
                                            <a href="${this.currentPage === 'home' ? '#' : 'index.html'}" class="dropdown-item" ${this.currentPage === 'home' ? "onclick=\"showSubsidiary('inter-africa')\"" : ''}>
                                                <strong>Khavho Inter Africa</strong>
                                                <small>Financial Services</small>
                                            </a>
                                        </div>
                                    </li>
                                    <li class="nav-item">
                                        <a href="${this.currentPage === 'home' ? '#' : 'index.html'}" class="nav-link" ${this.currentPage === 'home' ? "onclick=\"showPage('about')\"" : ''}>
                                            <i data-lucide="users"></i>
                                            About
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a href="${this.currentPage === 'home' ? '#' : 'index.html'}" class="nav-link" ${this.currentPage === 'home' ? "onclick=\"showPage('services')\"" : ''}>
                                            <i data-lucide="briefcase"></i>
                                            Services
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a href="products.html" class="nav-link ${this.currentPage === 'products' ? 'active' : ''}">
                                            <i data-lucide="package"></i>
                                            Products
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a href="${this.currentPage === 'home' ? '#' : 'index.html'}" class="nav-link" ${this.currentPage === 'home' ? "onclick=\"showPage('contact')\"" : ''}>
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
                                        <span class="cart-count" id="cartCount" style="display: none; position: absolute; top: 0; right: 0; background: #F37021; color: white; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; line-height: 20px; text-align: center; font-weight: bold;">0</span>
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
            this.initializeEventListeners();
            // Initialize Lucide icons after mounting
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    initializeEventListeners() {
        // Mobile menu toggle - bind to this instance
        const mobileToggle = document.getElementById('mobileMenuToggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => this.toggleMobileMenu());
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
    }

    toggleMobileMenu() {
        const mainNav = document.getElementById('mainNav');
        const mobileToggle = document.getElementById('mobileMenuToggle');
        
        if (mainNav && mobileToggle) {
            mainNav.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        }
    }
}

// Footer Component - Unified footer for all pages
class FooterComponent {
    render() {
        return `
            <footer class="footer">
                <div class="container">
                    <div class="footer-content">
                        <div class="footer-section">
                            <h3>Khavho Groups</h3>
                            <p>Building excellence across industries through strategic investments, innovative construction solutions, and comprehensive financial services.</p>
                            <div class="social-links">
                                <a href="#" class="social-link" title="Facebook">📘</a>
                                <a href="#" class="social-link" title="Twitter">🐦</a>
                                <a href="#" class="social-link" title="LinkedIn">💼</a>
                                <a href="#" class="social-link" title="Instagram">📷</a>
                            </div>
                        </div>

                        <div class="footer-section">
                            <h3>Our Companies</h3>
                            <ul class="footer-links">
                                <li><a href="index.html#" onclick="showSubsidiary('holdings')">Khavho Holdings</a></li>
                                <li><a href="index.html#" onclick="showSubsidiary('capital')">Khavho Capital</a></li>
                                <li><a href="index.html#" onclick="showSubsidiary('inter-africa')">Khavho Inter Africa</a></li>
                            </ul>
                        </div>

                        <div class="footer-section">
                            <h3>Services</h3>
                            <ul class="footer-links">
                                <li><a href="index.html#" onclick="showPage('services')">Construction</a></li>
                                <li><a href="index.html#" onclick="showPage('services')">Investment Management</a></li>
                                <li><a href="index.html#" onclick="showPage('services')">Financial Services</a></li>
                                <li><a href="products.html">Products</a></li>
                            </ul>
                        </div>

                        <div class="footer-section">
                            <h3>Contact Info</h3>
                            <ul class="footer-links">
                                <li>📧 Khathu@khavhogroups.com</li>
                                <li>📞 +27 766 927 310</li>
                                <li>📍 Johannesburg, South Africa</li>
                                <li><a href="admin.html">Admin Portal</a></li>
                            </ul>
                        </div>
                    </div>

                    <div class="footer-bottom">
                        <p>&copy; ${new Date().getFullYear()} Khavho Groups. All rights reserved. | Building Excellence Across Africa</p>
                    </div>
                </div>
            </footer>
        `;
    }

    mount(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = this.render();
        }
    }
}

// Auto-initialize navigation and footer when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Navigation
    const navContainer = document.getElementById('navigation-container');
    if (navContainer) {
        const navigation = new NavigationComponent();
        navigation.mount('navigation-container');
    }

    // Initialize Footer
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        const footer = new FooterComponent();
        footer.mount('footer-container');
    }
});

// Export for manual initialization
window.NavigationComponent = NavigationComponent;
window.FooterComponent = FooterComponent;