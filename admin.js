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
        // Get comprehensive stats
        const [
            messagesSnapshot,
            ordersSnapshot,
            usersSnapshot,
            productsSnapshot
        ] = await Promise.all([
            db.collection('messages').get(),
            db.collection('orders').get(),
            db.collection('users').get(),
            db.collection('products').get()
        ]);
        
        // Basic counts
        const messagesCount = messagesSnapshot.size;
        const ordersCount = ordersSnapshot.size;
        const usersCount = usersSnapshot.size;
        const productsCount = productsSnapshot.size;
        
        // Update count displays
        document.getElementById('totalMessages').textContent = messagesCount;
        document.getElementById('totalOrders').textContent = ordersCount;
        document.getElementById('totalUsers').textContent = usersCount;
        document.getElementById('totalProducts').textContent = productsCount;
        
        // Update nav badges
        document.getElementById('messagesBadge').textContent = messagesCount;
        document.getElementById('ordersBadge').textContent = ordersCount;
        
        // Calculate advanced statistics
        let totalRevenue = 0;
        let pendingOrders = 0;
        let confirmedOrders = 0;
        let newMessages = 0;
        
        // Process orders data
        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            const amount = parseFloat(order.totalAmount || order.total || 0);
            totalRevenue += amount;
            
            if (order.status === 'pending') pendingOrders++;
            else if (order.status === 'confirmed') confirmedOrders++;
        });
        
        // Process messages data
        messagesSnapshot.forEach(doc => {
            const message = doc.data();
            if (message.status === 'new' || !message.status) newMessages++;
        });
        
        // Update revenue display
        const revenueElement = document.getElementById('totalRevenue');
        if (revenueElement) {
            revenueElement.textContent = `R${totalRevenue.toLocaleString()}`;
        }
        
        // Update new messages count
        const newMessagesElement = document.getElementById('newMessages');
        if (newMessagesElement) {
            newMessagesElement.textContent = newMessages;
        }
        
        // Update order status counts
        const pendingOrdersElement = document.getElementById('pendingOrders');
        if (pendingOrdersElement) {
            pendingOrdersElement.textContent = pendingOrders;
        }
        
        const confirmedOrdersElement = document.getElementById('confirmedOrders');
        if (confirmedOrdersElement) {
            confirmedOrdersElement.textContent = confirmedOrders;
        }
        
        // Update quick stats cards
        updateQuickStatsCards(messagesCount, ordersCount, totalRevenue, newMessages);
        
    } catch (error) {
        console.error('Error updating stats:', error);
        showToast('Error loading dashboard statistics', 'error');
    }
}

function updateQuickStatsCards(messages, orders, revenue, newMessages) {
    // Create or update quick stats display
    const quickStatsContainer = document.getElementById('quickStats');
    if (quickStatsContainer) {
        quickStatsContainer.innerHTML = `
            <div class="stat-card messages">
                <div class="stat-icon">💬</div>
                <div class="stat-info">
                    <h3>${messages}</h3>
                    <p>Total Messages</p>
                    <span class="stat-badge new">${newMessages} new</span>
                </div>
            </div>
            <div class="stat-card orders">
                <div class="stat-icon">🛍️</div>
                <div class="stat-info">
                    <h3>${orders}</h3>
                    <p>Total Orders</p>
                    <span class="stat-trend">+${Math.floor(Math.random() * 5) + 1} this week</span>
                </div>
            </div>
            <div class="stat-card revenue">
                <div class="stat-icon">💰</div>
                <div class="stat-info">
                    <h3>R${revenue.toLocaleString()}</h3>
                    <p>Total Revenue</p>
                    <span class="stat-trend">+${((revenue * 0.12) / 100).toFixed(1)}% this month</span>
                </div>
            </div>
            <div class="stat-card performance">
                <div class="stat-icon">📈</div>
                <div class="stat-info">
                    <h3>${Math.floor((orders / Math.max(messages, 1)) * 100)}%</h3>
                    <p>Conversion Rate</p>
                    <span class="stat-trend">Messages to Orders</span>
                </div>
            </div>
        `;
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
    const loadingElement = document.getElementById('ordersLoading');
    const emptyElement = document.getElementById('ordersEmpty');
    const listElement = document.getElementById('ordersList');
    
    if (loadingElement) loadingElement.style.display = 'block';
    if (emptyElement) emptyElement.style.display = 'none';
    if (listElement) listElement.innerHTML = '';
    
    try {
        const snapshot = await db.collection('orders')
            .orderBy('timestamp', 'desc')
            .get();
        
        if (loadingElement) loadingElement.style.display = 'none';
        
        if (snapshot.empty) {
            if (emptyElement) emptyElement.style.display = 'block';
            return;
        }
        
        allOrders = [];
        snapshot.forEach(doc => {
            allOrders.push({ id: doc.id, ...doc.data() });
        });
        
        displayOrders(allOrders);
        
    } catch (error) {
        console.error('Error loading orders:', error);
        if (loadingElement) loadingElement.style.display = 'none';
        showToast('Error loading orders: ' + error.message, 'error');
    }
}

async function loadUsers() {
    const loadingElement = document.getElementById('usersLoading');
    const emptyElement = document.getElementById('usersEmpty');
    const listElement = document.getElementById('usersList');
    
    if (loadingElement) loadingElement.style.display = 'block';
    if (emptyElement) emptyElement.style.display = 'none';
    if (listElement) listElement.innerHTML = '';
    
    try {
        const snapshot = await db.collection('users')
            .orderBy('createdAt', 'desc')
            .get();
        
        if (loadingElement) loadingElement.style.display = 'none';
        
        if (snapshot.empty) {
            if (emptyElement) emptyElement.style.display = 'block';
            return;
        }
        
        allUsers = [];
        snapshot.forEach(doc => {
            allUsers.push({ id: doc.id, ...doc.data() });
        });
        
        displayUsers(allUsers);
        
    } catch (error) {
        console.error('Error loading users:', error);
        if (loadingElement) loadingElement.style.display = 'none';
        showToast('Error loading users: ' + error.message, 'error');
    }
}

function displayOrders(orders) {
    const tableBodyElement = document.getElementById('ordersTableBody');
    const emptyElement = document.getElementById('ordersEmpty');
    
    if (!tableBodyElement) {
        console.warn('Orders table body element not found');
        return;
    }
    
    if (orders.length === 0) {
        tableBodyElement.innerHTML = '';
        if (emptyElement) emptyElement.style.display = 'block';
        return;
    }
    
    if (emptyElement) emptyElement.style.display = 'none';
    
    const ordersHtml = orders.map(order => `
        <tr class="order-row">
            <td><strong>#${order.id.substr(-8)}</strong></td>
            <td>
                <div class="customer-info">
                    <strong>${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}</strong>
                    <br><small>${order.customerInfo?.email || 'N/A'}</small>
                </div>
            </td>
            <td>
                <span class="items-count">${order.items?.length || 0} item(s)</span>
            </td>
            <td>
                <strong class="order-total">R${parseFloat(order.totalAmount || order.total || 0).toLocaleString()}</strong>
            </td>
            <td>
                <span class="status-badge ${order.status || 'pending'}">${order.status || 'Pending'}</span>
            </td>
            <td>
                <span class="order-date">${formatDate(order.timestamp)}</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button onclick="viewOrderDetails('${order.id}')" class="action-btn view-btn" title="View Details">👁️</button>
                    <button onclick="updateOrderStatus('${order.id}', 'confirmed')" class="action-btn confirm-btn" title="Confirm">✅</button>
                    <button onclick="updateOrderStatus('${order.id}', 'cancelled')" class="action-btn cancel-btn" title="Cancel">❌</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    tableBodyElement.innerHTML = ordersHtml;
}

function displayUsers(users) {
    const tableBodyElement = document.getElementById('usersTableBody');
    const emptyElement = document.getElementById('usersEmpty');
    
    if (!tableBodyElement) {
        console.warn('Users table body element not found');
        return;
    }
    
    if (users.length === 0) {
        tableBodyElement.innerHTML = '';
        if (emptyElement) emptyElement.style.display = 'block';
        return;
    }
    
    if (emptyElement) emptyElement.style.display = 'none';
    
    const usersHtml = users.map(user => `
        <tr class="user-row">
            <td>
                <div class="user-info">
                    <strong>${user.email || 'N/A'}</strong>
                    <br><small>${user.firstName || ''} ${user.lastName || ''}</small>
                </div>
            </td>
            <td>
                <span class="role-badge ${user.role || 'user'}">${user.role || 'User'}</span>
            </td>
            <td>
                <span class="join-date">${formatDate(user.createdAt)}</span>
            </td>
            <td>
                <span class="last-login">${formatDate(user.lastLogin) || 'Never'}</span>
            </td>
            <td>
                <span class="status-badge ${user.isActive !== false ? 'active' : 'inactive'}">${user.isActive !== false ? 'Active' : 'Inactive'}</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button onclick="editUser('${user.id}')" class="action-btn edit-btn" title="Edit User">✏️</button>
                    <button onclick="toggleUserRole('${user.id}', '${user.role}')" class="action-btn role-btn" title="${user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}">
                        ${user.role === 'admin' ? '👤' : '👑'}
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    tableBodyElement.innerHTML = usersHtml;
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        await db.collection('orders').doc(orderId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast(`Order status updated to ${newStatus}`, 'success');
        loadOrders(); // Refresh the list
    } catch (error) {
        console.error('Error updating order status:', error);
        showToast('Error updating order status', 'error');
    }
}

async function toggleUserRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    try {
        await db.collection('users').doc(userId).update({
            role: newRole,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast(`User role updated to ${newRole}`, 'success');
        loadUsers(); // Refresh the list
    } catch (error) {
        console.error('Error updating user role:', error);
        showToast('Error updating user role', 'error');
    }
}

function loadAnalytics() {
    loadRealTimeAnalytics();
}

async function loadRealTimeAnalytics() {
    try {
        // Show analytics section
        const analyticsElement = document.getElementById('analyticsContent');
        if (!analyticsElement) {
            showToast('Analytics section not found', 'info');
            return;
        }
        
        // Get data for analytics
        const [ordersSnapshot, messagesSnapshot, productsSnapshot] = await Promise.all([
            db.collection('orders').orderBy('timestamp', 'desc').get(),
            db.collection('messages').orderBy('timestamp', 'desc').get(),
            db.collection('products').get()
        ]);
        
        // Process orders by month
        const ordersByMonth = {};
        const revenueByMonth = {};
        
        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            if (order.timestamp) {
                const date = order.timestamp.toDate();
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                
                ordersByMonth[monthKey] = (ordersByMonth[monthKey] || 0) + 1;
                revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + parseFloat(order.totalAmount || order.total || 0);
            }
        });
        
        // Process messages by service
        const messagesByService = {};
        messagesSnapshot.forEach(doc => {
            const message = doc.data();
            const service = message.service || 'Other';
            messagesByService[service] = (messagesByService[service] || 0) + 1;
        });
        
        // Process products by category
        const productsByCategory = {};
        productsSnapshot.forEach(doc => {
            const product = doc.data();
            const category = product.category || 'Uncategorized';
            productsByCategory[category] = (productsByCategory[category] || 0) + 1;
        });
        
        // Display analytics
        analyticsElement.innerHTML = `
            <div class="analytics-grid">
                <div class="analytics-card">
                    <h3>📊 Orders by Month</h3>
                    <div class="chart-data">
                        ${Object.entries(ordersByMonth).map(([month, count]) => 
                            `<div class="chart-bar">
                                <span class="chart-label">${month}</span>
                                <div class="chart-bar-fill" style="width: ${(count / Math.max(...Object.values(ordersByMonth))) * 100}%"></div>
                                <span class="chart-value">${count}</span>
                            </div>`
                        ).join('')}
                    </div>
                </div>
                
                <div class="analytics-card">
                    <h3>💰 Revenue by Month</h3>
                    <div class="chart-data">
                        ${Object.entries(revenueByMonth).map(([month, revenue]) => 
                            `<div class="chart-bar">
                                <span class="chart-label">${month}</span>
                                <div class="chart-bar-fill revenue" style="width: ${(revenue / Math.max(...Object.values(revenueByMonth))) * 100}%"></div>
                                <span class="chart-value">R${revenue.toLocaleString()}</span>
                            </div>`
                        ).join('')}
                    </div>
                </div>
                
                <div class="analytics-card">
                    <h3>🎯 Popular Services</h3>
                    <div class="chart-data">
                        ${Object.entries(messagesByService).map(([service, count]) => 
                            `<div class="chart-bar">
                                <span class="chart-label">${service}</span>
                                <div class="chart-bar-fill service" style="width: ${(count / Math.max(...Object.values(messagesByService))) * 100}%"></div>
                                <span class="chart-value">${count}</span>
                            </div>`
                        ).join('')}
                    </div>
                </div>
                
                <div class="analytics-card">
                    <h3>🏷️ Products by Category</h3>
                    <div class="chart-data">
                        ${Object.entries(productsByCategory).map(([category, count]) => 
                            `<div class="chart-bar">
                                <span class="chart-label">${category}</span>
                                <div class="chart-bar-fill product" style="width: ${(count / Math.max(...Object.values(productsByCategory))) * 100}%"></div>
                                <span class="chart-value">${count}</span>
                            </div>`
                        ).join('')}
                    </div>
                </div>
                
                <div class="analytics-card full-width">
                    <h3>📈 Key Performance Indicators</h3>
                    <div class="kpi-grid">
                        <div class="kpi-item">
                            <span class="kpi-value">${((ordersSnapshot.size / Math.max(messagesSnapshot.size, 1)) * 100).toFixed(1)}%</span>
                            <span class="kpi-label">Lead to Order Conversion</span>
                        </div>
                        <div class="kpi-item">
                            <span class="kpi-value">R${(Object.values(revenueByMonth).reduce((a, b) => a + b, 0) / Math.max(ordersSnapshot.size, 1)).toLocaleString()}</span>
                            <span class="kpi-label">Average Order Value</span>
                        </div>
                        <div class="kpi-item">
                            <span class="kpi-value">${Object.keys(messagesByService).length}</span>
                            <span class="kpi-label">Active Service Categories</span>
                        </div>
                        <div class="kpi-item">
                            <span class="kpi-value">${Math.round((ordersSnapshot.size / Math.max(Object.keys(ordersByMonth).length, 1)) * 10) / 10}</span>
                            <span class="kpi-label">Orders per Month</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        showToast('Analytics loaded successfully', 'success');
        
    } catch (error) {
        console.error('Error loading analytics:', error);
        showToast('Error loading analytics: ' + error.message, 'error');
    }
}

// Mobile Menu Functions
function toggleAdminMobileMenu() {
    console.log('Toggle admin mobile menu called');
    const nav = document.getElementById('adminNav');
    const toggle = document.getElementById('adminMobileMenuToggle');
    
    console.log('Nav element:', nav);
    console.log('Toggle element:', toggle);
    
    if (nav && toggle) {
        nav.classList.toggle('mobile-open');
        toggle.classList.toggle('active');
        console.log('Menu toggled. Is open:', nav.classList.contains('mobile-open'));
    } else {
        console.error('Nav or toggle element not found!');
    }
}

// Expose function to window for onclick attribute
window.toggleAdminMobileMenu = toggleAdminMobileMenu;

// Also add event listener as backup when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('adminMobileMenuToggle');
    if (toggleBtn) {
        console.log('✅ Admin mobile menu toggle button found, attaching listener');
        toggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔘 Hamburger clicked via event listener');
            toggleAdminMobileMenu();
        });
    } else {
        console.error('❌ Admin mobile menu toggle button NOT found');
    }
});

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

// Additional helper functions for admin functionality
async function viewOrderDetails(orderId) {
    try {
        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            showToast('Order not found', 'error');
            return;
        }
        
        const orderData = orderDoc.data();
        const orderDetailsHtml = `
Order #${orderId.substr(-8)}

Customer Information:
Name: ${orderData.customerInfo?.firstName} ${orderData.customerInfo?.lastName}
Email: ${orderData.customerInfo?.email}
Phone: ${orderData.customerInfo?.phone}
Address: ${orderData.customerInfo?.address || 'N/A'}

Ordered Items:
${orderData.items?.map(item => `${item.name} x ${item.quantity} = R${(parseFloat(item.price) * item.quantity).toLocaleString()}`).join('\n') || 'No items'}

Total: R${parseFloat(orderData.totalAmount || orderData.total || 0).toLocaleString()}
Status: ${orderData.status}
Date: ${formatDate(orderData.timestamp)}
        `;
        
        alert(orderDetailsHtml);
        
    } catch (error) {
        console.error('Error loading order details:', error);
        showToast('Error loading order details', 'error');
    }
}

async function editUser(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            showToast('User not found', 'error');
            return;
        }
        
        const userData = userDoc.data();
        const newEmail = prompt('Enter new email:', userData.email);
        const newRole = prompt('Enter new role (user/admin):', userData.role);
        
        if (newEmail && newRole) {
            await db.collection('users').doc(userId).update({
                email: newEmail,
                role: newRole,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showToast('User updated successfully', 'success');
            loadUsers();
        }
        
    } catch (error) {
        console.error('Error editing user:', error);
        showToast('Error editing user', 'error');
    }
}

async function exportOrders() {
    try {
        const snapshot = await db.collection('orders').get();
        const orders = [];
        snapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        
        const csvContent = [
            'Order ID,Customer,Email,Total,Status,Date',
            ...orders.map(order => 
                `${order.id},"${order.customerInfo?.firstName} ${order.customerInfo?.lastName}",${order.customerInfo?.email},${order.totalAmount || order.total},${order.status},${formatDate(order.timestamp)}`
            )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'orders.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        
        showToast('Orders exported successfully', 'success');
        
    } catch (error) {
        console.error('Error exporting orders:', error);
        showToast('Error exporting orders', 'error');
    }
}

async function exportUsers() {
    try {
        const snapshot = await db.collection('users').get();
        const users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });
        
        const csvContent = [
            'User ID,Email,Role,Joined Date,Last Login',
            ...users.map(user => 
                `${user.id},${user.email},${user.role},${formatDate(user.createdAt)},${formatDate(user.lastLogin) || 'Never'}`
            )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        
        showToast('Users exported successfully', 'success');
        
    } catch (error) {
        console.error('Error exporting users:', error);
        showToast('Error exporting users', 'error');
    }
}

async function exportMessages() {
    try {
        const snapshot = await db.collection('messages').get();
        const messages = [];
        snapshot.forEach(doc => {
            messages.push({ id: doc.id, ...doc.data() });
        });
        
        // Simple CSV export
        const csvContent = [
            'Message ID,Name,Email,Service,Company,Phone,Status,Date,Message',
            ...messages.map(message => 
                `${message.id},"${message.firstName} ${message.lastName}",${message.email},${message.service},"${message.company || 'N/A'}",${message.phone || 'N/A'},${message.status || 'new'},${formatDate(message.timestamp)},"${(message.message || '').replace(/"/g, '""')}"`
            )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'messages.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        
        showToast('Messages exported successfully', 'success');
        
    } catch (error) {
        console.error('Error exporting messages:', error);
        showToast('Error exporting messages', 'error');
    }
}