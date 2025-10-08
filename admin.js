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

// Placeholder functions for other sections
async function loadOrders() {
    showToast('Orders management coming soon', 'info');
}

async function loadUsers() {
    showToast('User management coming soon', 'info');
}

async function loadProducts() {
    showToast('Product management coming soon', 'info');
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

function exportMessages() {
    showToast('Export feature coming soon', 'info');
}