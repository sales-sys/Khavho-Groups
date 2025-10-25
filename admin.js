// Khavho Groups Admin Panel JavaScript
// Enhanced admin functionality with complete message management

let currentUser = null;
let currentMessageId = null;
let allMessages = [];
let allOrders = [];
let allUsers = [];
let allProducts = [];

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Firebase to initialize
    setTimeout(() => {
        if (window.auth && window.db) {
            setupAdmin();
        } else {
            console.error('Firebase not initialized');
            showError('Firebase configuration error. Please refresh the page.');
        }
    }, 500);
});

function setupAdmin() {
    // Check authentication state
    auth.onAuthStateChanged(function(user) {
        if (user) {
            checkAdminAccess(user);
        } else {
            showAuthUI();
        }
    });
    
    // Add event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Login form
    document.getElementById('login-button').addEventListener('click', handleLogin);
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleLogin();
    });
    
    // Logout button
    document.getElementById('logout-button').addEventListener('click', handleLogout);
    
    // Mobile menu toggle
    document.getElementById('adminMobileMenuToggle').addEventListener('click', toggleAdminMobileMenu);
}

// Authentication Functions
async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginButton = document.getElementById('login-button');
    const errorDiv = document.getElementById('auth-error');
    
    if (!email || !password) {
        showError('Please enter both email and password');
        return;
    }
    
    // Show loading state
    loginButton.innerHTML = '<div class="spinner"></div><span>Logging in...</span>';
    loginButton.disabled = true;
    errorDiv.textContent = '';
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        await checkAdminAccess(userCredential.user);
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message);
        loginButton.innerHTML = '<span>Login</span>';
        loginButton.disabled = false;
    }
}

async function checkAdminAccess(user) {
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists && userDoc.data().role === 'admin') {
            currentUser = user;
            showAdminDashboard();
            loadDashboardData();
        } else {
            showError('Access denied. Admin privileges required.');
            await auth.signOut();
        }
    } catch (error) {
        console.error('Admin check error:', error);
        showError('Error verifying admin access');
        await auth.signOut();
    }
}

function handleLogout() {
    auth.signOut().then(() => {
        showAuthUI();
        showToast('Logged out successfully', 'success');
    }).catch((error) => {
        console.error('Logout error:', error);
        showToast('Error logging out', 'error');
    });
}

// UI Functions
function showAuthUI() {
    document.getElementById('auth-ui').style.display = 'flex';
    document.getElementById('admin-dashboard').style.display = 'none';
    
    // Reset form
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('auth-error').textContent = '';
    
    const loginButton = document.getElementById('login-button');
    loginButton.innerHTML = '<span>Login</span>';
    loginButton.disabled = false;
}

function showAdminDashboard() {
    document.getElementById('auth-ui').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    
    // Show dashboard section by default
    showSection('dashboard');
}

function showError(message) {
    document.getElementById('auth-error').textContent = message;
}

// Navigation Functions (defined later with mobile menu support)
// Dashboard Functions
async function loadDashboardData() {
    try {
        // Load recent messages
        const messagesSnapshot = await db.collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get();
        
        const recentMessagesHtml = messagesSnapshot.docs.map(doc => {
            const data = doc.data();
            return `
                <div class="recent-item">
                    <div class="item-info">
                        <strong>${data.firstName} ${data.lastName}</strong>
                        <span class="item-meta">${data.service} - ${formatDate(data.timestamp)}</span>
                    </div>
                    <span class="status-badge ${data.status || 'new'}">${data.status || 'New'}</span>
                </div>
            `;
        }).join('');
        
        document.getElementById('recentMessages').innerHTML = recentMessagesHtml || '<p class="no-items">No recent messages</p>';
        
        // Load recent orders
        const ordersSnapshot = await db.collection('orders')
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get();
        
        const recentOrdersHtml = ordersSnapshot.docs.map(doc => {
            const data = doc.data();
            return `
                <div class="recent-item">
                    <div class="item-info">
                        <strong>Order #${doc.id.substr(-8)}</strong>
                        <span class="item-meta">R${data.total.toLocaleString()} - ${formatDate(data.timestamp)}</span>
                    </div>
                    <span class="status-badge ${data.status}">${data.status}</span>
                </div>
            `;
        }).join('');
        
        document.getElementById('recentOrders').innerHTML = recentOrdersHtml || '<p class="no-items">No recent orders</p>';
        
        // Update stats
        updateDashboardStats();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

async function updateDashboardStats() {
    try {
        // Get counts
        const [messagesCount, ordersCount, usersCount] = await Promise.all([
            db.collection('messages').get().then(snap => snap.size),
            db.collection('orders').get().then(snap => snap.size),
            db.collection('users').get().then(snap => snap.size)
        ]);
        
        document.getElementById('totalMessages').textContent = messagesCount;
        document.getElementById('totalOrders').textContent = ordersCount;
        document.getElementById('totalUsers').textContent = usersCount;
        
        // Update nav badges
        document.getElementById('messagesBadge').textContent = messagesCount;
        document.getElementById('ordersBadge').textContent = ordersCount;
        
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Messages Functions
async function loadMessages() {
    const loadingElement = document.getElementById('messagesLoading');
    const emptyElement = document.getElementById('messagesEmpty');
    const gridElement = document.getElementById('messagesGrid');
    
    loadingElement.style.display = 'block';
    emptyElement.style.display = 'none';
    gridElement.innerHTML = '';
    
    try {
        const snapshot = await db.collection('messages')
            .orderBy('timestamp', 'desc')
            .get();
        
        loadingElement.style.display = 'none';
        
        if (snapshot.empty) {
            emptyElement.style.display = 'block';
            return;
        }
        
        allMessages = [];
        snapshot.forEach(doc => {
            allMessages.push({ id: doc.id, ...doc.data() });
        });
        
        displayMessages(allMessages);
        
    } catch (error) {
        console.error('Error loading messages:', error);
        loadingElement.style.display = 'none';
        showToast('Error loading messages', 'error');
    }
}

function displayMessages(messages) {
    const gridElement = document.getElementById('messagesGrid');
    
    if (messages.length === 0) {
        document.getElementById('messagesEmpty').style.display = 'block';
        return;
    }
    
    const messagesHtml = messages.map(message => `
        <div class="message-card ${message.status || 'new'}" onclick="viewMessage('${message.id}')">
            <div class="message-header">
                <div class="message-info">
                    <h4>${message.firstName} ${message.lastName}</h4>
                    <span class="message-email">${message.email}</span>
                </div>
                <span class="status-badge ${message.status || 'new'}">${message.status || 'New'}</span>
            </div>
            
            <div class="message-details">
                <div class="detail-item">
                    <span class="detail-label">Service:</span>
                    <span class="detail-value">${message.service}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Company:</span>
                    <span class="detail-value">${message.company || 'Not specified'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">${message.phone || 'Not provided'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${formatDate(message.timestamp)}</span>
                </div>
            </div>
            
            <div class="message-preview">
                <p>${truncateText(message.message, 100)}</p>
            </div>
            
            <div class="message-actions">
                <button class="action-btn view" onclick="event.stopPropagation(); viewMessage('${message.id}')">View</button>
                <button class="action-btn reply" onclick="event.stopPropagation(); replyToMessage('${message.id}')">Reply</button>
                <button class="action-btn delete" onclick="event.stopPropagation(); deleteMessage('${message.id}')">Delete</button>
            </div>
        </div>
    `).join('');
    
    gridElement.innerHTML = messagesHtml;
}

function viewMessage(messageId) {
    const message = allMessages.find(m => m.id === messageId);
    if (!message) return;
    
    currentMessageId = messageId;
    
    // Mark as read if it's new
    if (message.status === 'new' || !message.status) {
        updateMessageStatus(messageId, 'read');
    }
    
    const modalBody = document.getElementById('messageModalBody');
    modalBody.innerHTML = `
        <div class="message-detail">
            <div class="detail-section">
                <h4>Contact Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Name:</label>
                        <span>${message.firstName} ${message.lastName}</span>
                    </div>
                    <div class="detail-item">
                        <label>Email:</label>
                        <span>${message.email}</span>
                    </div>
                    <div class="detail-item">
                        <label>Phone:</label>
                        <span>${message.phone || 'Not provided'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Company:</label>
                        <span>${message.company || 'Not specified'}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4>Service Request</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Service Interest:</label>
                        <span class="service-badge">${message.service}</span>
                    </div>
                    <div class="detail-item">
                        <label>Date Submitted:</label>
                        <span>${formatDate(message.timestamp)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <select onchange="updateMessageStatus('${messageId}', this.value)">
                            <option value="new" ${(message.status || 'new') === 'new' ? 'selected' : ''}>New</option>
                            <option value="read" ${message.status === 'read' ? 'selected' : ''}>Read</option>
                            <option value="replied" ${message.status === 'replied' ? 'selected' : ''}>Replied</option>
                            <option value="closed" ${message.status === 'closed' ? 'selected' : ''}>Closed</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4>Message</h4>
                <div class="message-content">
                    <p>${message.message}</p>
                </div>
            </div>
            
            <div class="detail-section">
                <h4>Actions</h4>
                <div class="action-buttons">
                    <button class="btn-primary" onclick="replyToMessage('${messageId}')">
                        Reply via Email
                    </button>
                    <button class="btn-secondary" onclick="exportMessage('${messageId}')">
                        Export Message
                    </button>
                </div>
            </div>
        </div>
    `;
    
    showModal('messageModal');
}

async function updateMessageStatus(messageId, status) {
    try {
        await db.collection('messages').doc(messageId).update({
            status: status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update local data
        const message = allMessages.find(m => m.id === messageId);
        if (message) {
            message.status = status;
        }
        
        // Refresh displays
        loadMessages();
        loadDashboardData();
        
        showToast('Message status updated', 'success');
    } catch (error) {
        console.error('Error updating message status:', error);
        showToast('Error updating status', 'error');
    }
}

function replyToMessage(messageId) {
    const message = allMessages.find(m => m.id === messageId);
    if (!message) return;
    
    const subject = `Re: Your inquiry about ${message.service} services`;
    const body = `Dear ${message.firstName} ${message.lastName},\n\nThank you for your interest in our ${message.service} services.\n\n[Your reply here]\n\nBest regards,\nKhavho Groups Team`;
    
    const mailtoLink = `mailto:${message.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
    
    // Update status to replied
    updateMessageStatus(messageId, 'replied');
}

async function deleteMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
        return;
    }
    
    try {
        await db.collection('messages').doc(messageId).delete();
        
        // Remove from local array
        allMessages = allMessages.filter(m => m.id !== messageId);
        
        // Refresh displays
        displayMessages(allMessages);
        loadDashboardData();
        
        showToast('Message deleted successfully', 'success');
        closeModal('messageModal');
    } catch (error) {
        console.error('Error deleting message:', error);
        showToast('Error deleting message', 'error');
    }
}

function filterMessages() {
    const serviceFilter = document.getElementById('serviceFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const searchTerm = document.getElementById('messageSearch').value.toLowerCase();
    
    let filteredMessages = allMessages;
    
    if (serviceFilter) {
        filteredMessages = filteredMessages.filter(m => m.service === serviceFilter);
    }
    
    if (statusFilter) {
        filteredMessages = filteredMessages.filter(m => (m.status || 'new') === statusFilter);
    }
    
    if (searchTerm) {
        filteredMessages = filteredMessages.filter(m => 
            m.firstName.toLowerCase().includes(searchTerm) ||
            m.lastName.toLowerCase().includes(searchTerm) ||
            m.email.toLowerCase().includes(searchTerm) ||
            m.message.toLowerCase().includes(searchTerm) ||
            (m.company && m.company.toLowerCase().includes(searchTerm))
        );
    }
    
    displayMessages(filteredMessages);
}

// Utility Functions
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.toDate) {
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        date = new Date(timestamp);
    }
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto';
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 4000);
}

// Products Management Functions
let currentProductId = null;

async function loadProducts() {
    const loadingElement = document.getElementById('productsLoading');
    const emptyElement = document.getElementById('productsEmpty');
    const gridElement = document.getElementById('productsGrid');
    
    loadingElement.style.display = 'block';
    emptyElement.style.display = 'none';
    gridElement.innerHTML = '';
    
    try {
        const snapshot = await db.collection('products')
            .orderBy('createdAt', 'desc')
            .get();
        
        loadingElement.style.display = 'none';
        
        if (snapshot.empty) {
            emptyElement.style.display = 'block';
            return;
        }
        
        allProducts = [];
        snapshot.forEach(doc => {
            allProducts.push({ id: doc.id, ...doc.data() });
        });
        
        displayProducts(allProducts);
        
    } catch (error) {
        console.error('Error loading products:', error);
        loadingElement.style.display = 'none';
        showToast('Error loading products', 'error');
    }
}

function displayProducts(products) {
    const gridElement = document.getElementById('productsGrid');
    
    if (products.length === 0) {
        document.getElementById('productsEmpty').style.display = 'block';
        return;
    }
    
    const productsHtml = products.map(product => `
        <div class="product-card ${product.isAvailable ? 'available' : 'unavailable'}">
            <div class="product-image">
                <img src="${product.imageUrl || '/images/placeholder-product.jpg'}" alt="${product.name}" onerror="this.src='/images/placeholder-product.jpg'">
                <span class="availability-badge ${product.isAvailable ? 'available' : 'unavailable'}">
                    ${product.isAvailable ? 'Available' : 'Unavailable'}
                </span>
            </div>
            
            <div class="product-info">
                <h4>${product.name}</h4>
                <span class="product-category">${product.category}</span>
                <p class="product-description">${truncateText(product.description, 100)}</p>
                
                <div class="product-details">
                    <span class="product-price">R${parseFloat(product.price || 0).toLocaleString()}</span>
                    <span class="product-date">${formatDate(product.createdAt)}</span>
                </div>
            </div>
            
            <div class="product-actions">
                <button class="action-btn edit" onclick="editProduct('${product.id}')">Edit</button>
                <button class="action-btn ${product.isAvailable ? 'disable' : 'enable'}" 
                        onclick="toggleProductAvailability('${product.id}')">
                    ${product.isAvailable ? 'Disable' : 'Enable'}
                </button>
                <button class="action-btn delete" onclick="deleteProduct('${product.id}')">Delete</button>
            </div>
        </div>
    `).join('');
    
    gridElement.innerHTML = productsHtml;
}

function showAddProductModal() {
    currentProductId = null;
    document.getElementById('productModalTitle').textContent = 'Add New Product';
    document.getElementById('productForm').reset();
    showModal('productModal');
}

function editProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    currentProductId = productId;
    document.getElementById('productModalTitle').textContent = 'Edit Product';
    
    // Fill form with product data
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productCategory').value = product.category || '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productImageUrl').value = product.imageUrl || '';
    document.getElementById('productAvailable').checked = product.isAvailable || false;
    
    showModal('productModal');
}

async function saveProduct() {
    const form = document.getElementById('productForm');
    const formData = new FormData(form);
    
    // Validation
    const name = formData.get('name')?.trim();
    const category = formData.get('category')?.trim();
    const price = formData.get('price');
    const description = formData.get('description')?.trim();
    
    if (!name || !category || !price || !description) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (isNaN(price) || parseFloat(price) < 0) {
        showToast('Please enter a valid price', 'error');
        return;
    }

    try {
        // Generate image URL automatically based on product name
        const imageUrl = generateImagePath(name);
        
        const productData = {
            name: name,
            category: category,
            price: parseFloat(price),
            description: description,
            imageUrl: imageUrl,
            isAvailable: formData.get('available') === 'on',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (currentProductId) {
            // Update existing product
            await db.collection('products').doc(currentProductId).update(productData);
            showToast('Product updated successfully', 'success');
        } else {
            // Add new product
            productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('products').add(productData);
            showToast('Product added successfully', 'success');
        }
        
        closeModal('productModal');
        loadProducts();
        loadDashboardData(); // Update dashboard stats
        
    } catch (error) {
        console.error('Error saving product:', error);
        showToast('Error saving product', 'error');
    }
}

// Generate image path based on product name
function generateImagePath(productName) {
    if (!productName) return '';
    
    // Convert product name to URL-friendly format
    // "Office Desk" → "office-desk"
    const imageName = productName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    
    // Return path for WebP image (will fallback to JPG automatically)
    return `/images/${imageName}.webp`;
}

async function toggleProductAvailability(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    try {
        const newAvailability = !product.isAvailable;
        await db.collection('products').doc(productId).update({
            isAvailable: newAvailability,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update local data
        product.isAvailable = newAvailability;
        
        loadProducts();
        showToast(`Product ${newAvailability ? 'enabled' : 'disabled'} successfully`, 'success');
        
    } catch (error) {
        console.error('Error updating product availability:', error);
        showToast('Error updating product', 'error');
    }
}

async function deleteProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        await db.collection('products').doc(productId).delete();
        
        // Remove from local array
        allProducts = allProducts.filter(p => p.id !== productId);
        
        displayProducts(allProducts);
        loadDashboardData(); // Update dashboard stats
        
        showToast('Product deleted successfully', 'success');
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Error deleting product', 'error');
    }
}

function filterProducts() {
    const categoryFilter = document.getElementById('productCategoryFilter').value;
    const availabilityFilter = document.getElementById('productAvailabilityFilter').value;
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    
    let filteredProducts = allProducts;
    
    if (categoryFilter) {
        filteredProducts = filteredProducts.filter(p => p.category === categoryFilter);
    }
    
    if (availabilityFilter) {
        const isAvailable = availabilityFilter === 'available';
        filteredProducts = filteredProducts.filter(p => p.isAvailable === isAvailable);
    }
    
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm) ||
            p.category.toLowerCase().includes(searchTerm)
        );
    }
    
    displayProducts(filteredProducts);
}

// Placeholder functions for other sections
async function loadOrders() {
    showToast('Orders management coming soon', 'info');
}

async function loadUsers() {
    showToast('User management coming soon', 'info');
}

function loadAnalytics() {
    showToast('Analytics coming soon', 'info');
}

// Mobile Menu Functions
function toggleAdminMobileMenu() {
    const nav = document.getElementById('adminNav');
    const toggle = document.getElementById('adminMobileMenuToggle');
    
    nav.classList.toggle('mobile-open');
    toggle.classList.toggle('active');
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const nav = document.getElementById('adminNav');
    const toggle = document.getElementById('adminMobileMenuToggle');
    
    if (nav && toggle && nav.classList.contains('mobile-open')) {
        if (!nav.contains(event.target) && !toggle.contains(event.target)) {
            nav.classList.remove('mobile-open');
            toggle.classList.remove('active');
        }
    }
});

// Close mobile menu when selecting a navigation item
function showSection(sectionName) {
    // Close mobile menu
    const nav = document.getElementById('adminNav');
    const toggle = document.getElementById('adminMobileMenuToggle');
    if (nav && toggle) {
        nav.classList.remove('mobile-open');
        toggle.classList.remove('active');
    }
    
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Show the corresponding content section
    document.getElementById(`${sectionName}-section`).classList.add('active');
    
    // Load section-specific data
    switch(sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'messages':
            loadMessages();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'users':
            loadUsers();
            break;
        case 'products':
            loadProducts();
            break;
        case 'analytics':
            loadAnalytics();
            break;
    }
}

// Product Import Functions
function showImportProductsModal() {
    showModal('importProductsModal');
}

async function importKhavhoProducts() {
    const importBtn = document.getElementById('importConfirmBtn');
    const clearExisting = document.getElementById('clearExistingProducts').checked;
    const updateFilters = document.getElementById('updateCategoryFilters').checked;
    
    // Show loading state
    importBtn.textContent = 'Importing...';
    importBtn.disabled = true;
    
    try {
        // Step 1: Clear existing products if selected
        if (clearExisting) {
            showToast('Clearing existing products...', 'info');
            await clearAllProducts();
        }
        
        // Step 2: Import new products
        showToast('Importing Khavho products...', 'info');
        await batchImportProducts(window.KHAVHO_PRODUCTS);
        
        // Step 3: Update category filters if selected
        if (updateFilters) {
            updateProductCategoryFilters();
        }
        
        // Success!
        showToast('Successfully imported all Khavho products!', 'success');
        closeModal('importProductsModal');
        loadProducts(); // Refresh the product list
        loadDashboardData(); // Update dashboard stats
        
    } catch (error) {
        console.error('Error importing products:', error);
        showToast('Error importing products: ' + error.message, 'error');
    } finally {
        // Reset button
        importBtn.textContent = 'Import Products';
        importBtn.disabled = false;
    }
}

async function clearAllProducts() {
    const snapshot = await db.collection('products').get();
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log('✅ Cleared all existing products');
}

async function batchImportProducts(products) {
    const batchSize = 25; // Firestore batch limit is 500, but we'll use smaller batches
    
    for (let i = 0; i < products.length; i += batchSize) {
        const batch = db.batch();
        const currentBatch = products.slice(i, i + batchSize);
        
        currentBatch.forEach(product => {
            const productData = {
                ...product,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                stock: 50, // Default stock level
                lowStockAlert: 10, // Default low stock threshold
                status: 'active',
                tags: [product.category, product.subcategory],
                imageUrl: '', // Will be populated later
                supplier: 'Khavho Groups',
                region: 'Gauteng/Limpopo'
            };
            
            // Use product code as document ID for easy reference
            const docRef = db.collection('products').doc(product.productCode);
            batch.set(docRef, productData);
        });
        
        await batch.commit();
        console.log(`✅ Imported batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(products.length / batchSize)}`);
        
        // Show progress
        const progress = Math.round(((i + currentBatch.length) / products.length) * 100);
        showToast(`Import progress: ${progress}%`, 'info', 1000);
    }
    
    console.log(`🎉 Successfully imported ${products.length} products!`);
}

function updateProductCategoryFilters() {
    const categoryFilter = document.getElementById('productCategoryFilter');
    if (!categoryFilter) return;
    
    // Clear existing options
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    
    // Add new category options based on imported products
    const categories = [
        { value: 'civil-works', label: 'Civil Works' },
        { value: 'general-building', label: 'General Building' },
        { value: 'electrical', label: 'Electrical' },
        { value: 'mechanical', label: 'Mechanical' },
        { value: 'general-procurement', label: 'General Procurement' }
    ];
    
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.value;
        option.textContent = cat.label;
        categoryFilter.appendChild(option);
    });
    
    console.log('✅ Updated category filters');
}

// Product Code Generation Function
function generateNextProductCode(category, subcategory) {
    const categoryCode = window.PRODUCT_CATEGORIES[category]?.code;
    if (!categoryCode) return null;
    
    // This function will analyze existing products and generate the next code
    // For now, we'll return a placeholder - this will be enhanced when adding new products
    return `KG-${categoryCode}-${subcategory}-XXX`;
}

function exportMessages() {
    showToast('Export feature coming soon', 'info');
}

// Auto Upload All Products Function
async function autoUploadAllProducts() {
    const uploadBtn = document.getElementById('uploadProductsBtn');
    const statusCard = document.getElementById('uploadStatusCard');
    const progressBar = document.getElementById('uploadProgressBar');
    const progressText = document.getElementById('uploadProgressText');
    const statusLog = document.getElementById('uploadStatusLog');
    
    // Show upload status card
    statusCard.style.display = 'block';
    statusCard.scrollIntoView({ behavior: 'smooth' });
    
    // Update button state
    uploadBtn.innerHTML = '<span class="action-icon">⏳</span><span class="action-text">Uploading...</span>';
    uploadBtn.disabled = true;
    
    // Clear previous logs
    statusLog.innerHTML = '';
    
    try {
        // Load product data if not already loaded
        if (!window.KHAVHO_PRODUCTS) {
            addUploadLog('❌ Product data not found! Please ensure product-data-import.js is loaded.', 'error');
            return;
        }
        
        addUploadLog('🚀 Starting automatic upload of 65 Khavho products...', 'info');
        updateUploadProgress(0, 'Initializing...');
        
        // Step 1: Clear existing products
        addUploadLog('🧹 Clearing existing products...', 'info');
        updateUploadProgress(10, 'Clearing existing products...');
        
        const snapshot = await db.collection('products').get();
        if (!snapshot.empty) {
            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            addUploadLog(`✅ Cleared ${snapshot.size} existing products`, 'success');
        } else {
            addUploadLog('ℹ️ No existing products to clear', 'info');
        }
        
        updateUploadProgress(20, 'Starting product upload...');
        
        // Step 2: Upload products in batches
        const products = window.KHAVHO_PRODUCTS;
        const totalProducts = products.length;
        const batchSize = 10;
        let uploadedCount = 0;
        
        addUploadLog(`📦 Uploading ${totalProducts} products in batches...`, 'info');
        
        for (let i = 0; i < totalProducts; i += batchSize) {
            const batch = db.batch();
            const currentBatch = products.slice(i, i + batchSize);
            
            currentBatch.forEach(product => {
                const docRef = db.collection('products').doc();
                const productData = {
                    ...product,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    featured: false,
                    tags: [product.category.toLowerCase(), product.subcategory.toLowerCase()]
                };
                batch.set(docRef, productData);
            });
            
            await batch.commit();
            uploadedCount += currentBatch.length;
            
            const progress = 20 + (uploadedCount / totalProducts) * 70; // 20-90% for upload
            updateUploadProgress(progress, `Uploaded ${uploadedCount}/${totalProducts} products`);
            addUploadLog(`📤 Batch ${Math.ceil((i + batchSize) / batchSize)} complete: ${uploadedCount}/${totalProducts} products uploaded`, 'success');
            
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        updateUploadProgress(95, 'Updating category filters...');
        
        // Step 3: Update category filters
        addUploadLog('🔄 Updating category filters...', 'info');
        updateProductCategoryFilters();
        
        updateUploadProgress(100, 'Upload complete!');
        
        // Step 4: Success!
        addUploadLog(`🎉 SUCCESS! All ${totalProducts} products uploaded to Firebase!`, 'success');
        
        // Show category breakdown
        const categoryBreakdown = {};
        products.forEach(product => {
            categoryBreakdown[product.category] = (categoryBreakdown[product.category] || 0) + 1;
        });
        
        addUploadLog('📊 Category Breakdown:', 'info');
        Object.entries(categoryBreakdown).forEach(([category, count]) => {
            addUploadLog(`• ${category}: ${count} products`, 'info');
        });
        
        addUploadLog('🌐 Products are now live on your website!', 'success');
        addUploadLog('🔥 Firebase database updated successfully!', 'success');
        
        // Refresh data
        loadProducts();
        loadDashboardData();
        
        showToast('🎯 All 65 products uploaded successfully!', 'success');
        
    } catch (error) {
        console.error('Auto upload error:', error);
        addUploadLog(`❌ Upload failed: ${error.message}`, 'error');
        showToast('Upload failed: ' + error.message, 'error');
        updateUploadProgress(0, 'Upload failed');
    } finally {
        // Reset button
        uploadBtn.innerHTML = '<span class="action-icon">🚀</span><span class="action-text">Upload 65 Products</span>';
        uploadBtn.disabled = false;
    }
}

function updateUploadProgress(percentage, statusText) {
    const progressBar = document.getElementById('uploadProgressBar');
    const progressText = document.getElementById('uploadProgressText');
    
    progressBar.style.width = percentage + '%';
    progressText.textContent = `${Math.round(percentage)}% - ${statusText}`;
}

function addUploadLog(message, type = 'info') {
    const statusLog = document.getElementById('uploadStatusLog');
    const logItem = document.createElement('div');
    logItem.className = `upload-log-item ${type}`;
    logItem.textContent = message;
    statusLog.appendChild(logItem);
    statusLog.scrollTop = statusLog.scrollHeight;
}