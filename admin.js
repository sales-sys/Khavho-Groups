// Firebase will be initialized by firebase-config.js
// Using shared Firebase configuration
// Wait for Firebase to be initialized, then get references
window.addEventListener('DOMContentLoaded', function() {
    // Give Firebase a moment to initialize
    setTimeout(() => {
        if (window.auth && window.db) {
            initializeAdmin();
        } else {
            console.error('Firebase not properly initialized');
            showError('Firebase configuration error. Please refresh the page.');
        }
    }, 100);
});

function initializeAdmin() {
    // Use global Firebase instances
    const auth = window.auth;
    const db = window.db;

    // Global variables
    let currentUser = null;
    let unsubscribeListeners = [];

// Create a better local placeholder image
function createImagePlaceholder() {
    return 'data:image/svg+xml;base64,' + btoa(`
        <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="50" height="50" fill="#f7fafc"/>
            <rect x="10" y="15" width="30" height="20" fill="#e2e8f0" rx="2"/>
            <circle cx="18" cy="22" r="3" fill="#cbd5e0"/>
            <path d="m25 30 5-5 10 10v5H10v-8l8-8 7 6z" fill="#a0aec0"/>
        </svg>
    `);
}

// DOM Elements
const authUI = document.getElementById('auth-ui');
const adminDashboard = document.getElementById('admin-dashboard');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authError = document.getElementById('auth-error');

// Product Management Elements
const addProductForm = document.getElementById('add-product-form');
const editProductModal = document.getElementById('edit-product-modal');
const editProductForm = document.getElementById('edit-product-form');
const saveEditButton = document.getElementById('save-edit-button');
const cancelEditButton = document.getElementById('cancel-edit-button');
const closeModalBtn = document.querySelector('.close-modal');

// Authentication State Observer
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        // Check if user is admin
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists && userDoc.data().role === 'admin') {
                showAdminDashboard();
                loadAdminData();
            } else {
                showMessage('Access denied. Admin privileges required.', 'error');
                auth.signOut();
            }
        } catch (error) {
            console.error('Error checking user role:', error);
            showMessage('Error verifying admin status.', 'error');
            auth.signOut();
        }
    } else {
        currentUser = null;
        showAuthUI();
        cleanupListeners();
    }
});

// Show/Hide UI Functions
function showAuthUI() {
    authUI.style.display = 'flex';
    adminDashboard.style.display = 'none';
}

function showAdminDashboard() {
    authUI.style.display = 'none';
    adminDashboard.style.display = 'block';
}

// Login Handler
loginButton.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        showAuthError('Please enter both email and password.');
        return;
    }

    try {
        console.log('Attempting login with email:', email);
        loginButton.textContent = 'Logging in...';
        loginButton.disabled = true;
        
        // Clear any previous errors
        showAuthError('');
        
        await auth.signInWithEmailAndPassword(email, password);
        console.log('Login successful, waiting for auth state change...');
        clearAuthError();
    } catch (error) {
        console.error('Login error:', error);
        showAuthError(getAuthErrorMessage(error.code));
    } finally {
        loginButton.textContent = 'Login';
        loginButton.disabled = false;
    }
});

// Logout Handler
logoutButton.addEventListener('click', () => {
    auth.signOut();
});

// Enhanced loadAdminData Function
function loadAdminData() {
    // Clear existing listeners
    cleanupListeners();
    
    // Load Users
    const usersUnsubscribe = db.collection('users').onSnapshot((snapshot) => {
        const tbody = document.querySelector('#users-table tbody');
        tbody.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const user = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.email || 'N/A'}</td>
                <td><span class="status-badge ${user.role === 'admin' ? 'status-available' : 'status-unavailable'}">${user.role || 'user'}</span></td>
                <td>${user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <button class="btn-edit" onclick="editUser('${doc.id}')">Edit</button>
                    <button class="btn-danger" onclick="deleteUser('${doc.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }, (error) => {
        console.error('Error loading users:', error);
        showMessage('Error loading users data.', 'error');
    });
    
    // Load Orders
    const ordersUnsubscribe = db.collection('orders').onSnapshot((snapshot) => {
        const tbody = document.querySelector('#orders-table tbody');
        tbody.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const order = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${doc.id}</td>
                <td>${order.customerEmail || 'N/A'}</td>
                <td>R${order.total ? order.total.toFixed(2) : '0.00'}</td>
                <td><span class="status-badge status-${order.status || 'pending'}">${order.status || 'pending'}</span></td>
                <td>${order.createdAt ? new Date(order.createdAt.toDate()).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <button class="btn-edit" onclick="editOrder('${doc.id}')">Edit</button>
                    <button class="btn-danger" onclick="deleteOrder('${doc.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }, (error) => {
        console.error('Error loading orders:', error);
        showMessage('Error loading orders data.', 'error');
    });
    
    // Load Contacts
    const contactsUnsubscribe = db.collection('contacts').onSnapshot((snapshot) => {
        const tbody = document.querySelector('#contacts-table tbody');
        tbody.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const contact = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${contact.name || 'N/A'}</td>
                <td>${contact.email || 'N/A'}</td>
                <td>${contact.subject || 'N/A'}</td>
                <td>${contact.createdAt ? new Date(contact.createdAt.toDate()).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <button class="btn-edit" onclick="viewContact('${doc.id}')">View</button>
                    <button class="btn-danger" onclick="deleteContact('${doc.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }, (error) => {
        console.error('Error loading contacts:', error);
        showMessage('Error loading contacts data.', 'error');
    });
    
    // Load Settings
    const settingsUnsubscribe = db.collection('settings').onSnapshot((snapshot) => {
        const settingsList = document.getElementById('settings-list');
        settingsList.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const setting = doc.data();
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <strong>${doc.id}:</strong> ${setting.value || 'N/A'}
                <button class="btn-edit" onclick="editSetting('${doc.id}')">Edit</button>
            `;
            settingsList.appendChild(listItem);
        });
    }, (error) => {
        console.error('Error loading settings:', error);
        showMessage('Error loading settings data.', 'error');
    });
    
    // Load Products (NEW)
    const productsUnsubscribe = db.collection('products').onSnapshot((snapshot) => {
        const tbody = document.querySelector('#products-table tbody');
        tbody.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const product = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <img src="${product.imageUrl || createImagePlaceholder()}" 
                         alt="${product.name}" class="product-image" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZjdmYWZjIi8+CjxyZWN0IHg9IjEwIiB5PSIxNSIgd2lkdGg9IjMwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjZTJlOGYwIiByeD0iMiIvPgo8Y2lyY2xlIGN4PSIxOCIgY3k9IjIyIiByPSIzIiBmaWxsPSIjY2JkNWUwIi8+CjxwYXRoIGQ9Im0yNSAzMCA1LTUgMTAgMTB2NUgxMHYtOGw4LTggNyA2eiIgZmlsbD0iI2EwYWVjMCIvPgo8L3N2Zz4K'">>
                </td>
                <td>
                    <strong>${product.name || 'N/A'}</strong>
                    <br><small>${product.description ? product.description.substring(0, 50) + '...' : ''}</small>
                </td>
                <td>R${product.price ? product.price.toFixed(2) : '0.00'}</td>
                <td>
                    <span class="status-badge ${product.available ? 'status-available' : 'status-unavailable'}">
                        ${product.available ? 'Available' : 'Unavailable'}
                    </span>
                </td>
                <td>
                    <button class="btn-edit" onclick="editProduct('${doc.id}')">Edit</button>
                    <button class="btn-danger" onclick="deleteProduct('${doc.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }, (error) => {
        console.error('Error loading products:', error);
        showMessage('Error loading products data.', 'error');
    });
    
    // Store unsubscribe functions
    unsubscribeListeners = [
        usersUnsubscribe,
        ordersUnsubscribe,
        contactsUnsubscribe,
        settingsUnsubscribe,
        productsUnsubscribe
    ];
}

// Cleanup Listeners
function cleanupListeners() {
    unsubscribeListeners.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    });
    unsubscribeListeners = [];
}

// Product Management Functions
// Add Product Form Handler
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productData = {
        name: document.getElementById('product-name').value.trim(),
        description: document.getElementById('product-description').value.trim(),
        price: parseFloat(document.getElementById('product-price').value),
        imageUrl: document.getElementById('product-image-url').value.trim(),
        available: document.getElementById('product-available').checked,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (!productData.name || !productData.imageUrl || isNaN(productData.price)) {
        showMessage('Please fill in all required fields correctly.', 'error');
        return;
    }
    
    try {
        addProductForm.classList.add('loading');
        await db.collection('products').add(productData);
        showMessage('Product added successfully!', 'success');
        addProductForm.reset();
    } catch (error) {
        console.error('Error adding product:', error);
        showMessage('Error adding product. Please try again.', 'error');
    } finally {
        addProductForm.classList.remove('loading');
    }
});

// Edit Product Function
window.editProduct = async (productId) => {
    try {
        const doc = await db.collection('products').doc(productId).get();
        if (doc.exists) {
            const product = doc.data();
            
            // Populate edit form
            document.getElementById('edit-product-id').value = productId;
            document.getElementById('edit-product-name').value = product.name || '';
            document.getElementById('edit-product-description').value = product.description || '';
            document.getElementById('edit-product-price').value = product.price || '';
            document.getElementById('edit-product-image-url').value = product.imageUrl || '';
            document.getElementById('edit-product-available').checked = product.available || false;
            
            // Show modal
            editProductModal.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error loading product for edit:', error);
        showMessage('Error loading product data.', 'error');
    }
};

// Save Edit Button Handler
saveEditButton.addEventListener('click', async () => {
    const productId = document.getElementById('edit-product-id').value;
    
    const updatedData = {
        name: document.getElementById('edit-product-name').value.trim(),
        description: document.getElementById('edit-product-description').value.trim(),
        price: parseFloat(document.getElementById('edit-product-price').value),
        imageUrl: document.getElementById('edit-product-image-url').value.trim(),
        available: document.getElementById('edit-product-available').checked,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (!updatedData.name || !updatedData.imageUrl || isNaN(updatedData.price)) {
        showMessage('Please fill in all required fields correctly.', 'error');
        return;
    }
    
    try {
        saveEditButton.classList.add('loading');
        await db.collection('products').doc(productId).update(updatedData);
        showMessage('Product updated successfully!', 'success');
        editProductModal.style.display = 'none';
    } catch (error) {
        console.error('Error updating product:', error);
        showMessage('Error updating product. Please try again.', 'error');
    } finally {
        saveEditButton.classList.remove('loading');
    }
});

// Cancel Edit Button Handler
cancelEditButton.addEventListener('click', () => {
    editProductModal.style.display = 'none';
});

// Close Modal Handler
closeModalBtn.addEventListener('click', () => {
    editProductModal.style.display = 'none';
});

// Delete Product Function
window.deleteProduct = async (productId) => {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        try {
            await db.collection('products').doc(productId).delete();
            showMessage('Product deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting product:', error);
            showMessage('Error deleting product. Please try again.', 'error');
        }
    }
};

// Placeholder functions for other data management
window.editUser = (userId) => {
    console.log('Edit user:', userId);
    showMessage('User editing functionality coming soon.', 'info');
};

window.deleteUser = async (userId) => {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            await db.collection('users').doc(userId).delete();
            showMessage('User deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting user:', error);
            showMessage('Error deleting user.', 'error');
        }
    }
};

window.editOrder = (orderId) => {
    console.log('Edit order:', orderId);
    showMessage('Order editing functionality coming soon.', 'info');
};

window.deleteOrder = async (orderId) => {
    if (confirm('Are you sure you want to delete this order?')) {
        try {
            await db.collection('orders').doc(orderId).delete();
            showMessage('Order deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting order:', error);
            showMessage('Error deleting order.', 'error');
        }
    }
};

window.viewContact = async (contactId) => {
    try {
        const doc = await db.collection('contacts').doc(contactId).get();
        if (doc.exists) {
            const contact = doc.data();
            alert(`Contact Details:\n\nName: ${contact.name}\nEmail: ${contact.email}\nSubject: ${contact.subject}\nMessage: ${contact.message}`);
        }
    } catch (error) {
        console.error('Error viewing contact:', error);
        showMessage('Error loading contact details.', 'error');
    }
};

window.deleteContact = async (contactId) => {
    if (confirm('Are you sure you want to delete this contact?')) {
        try {
            await db.collection('contacts').doc(contactId).delete();
            showMessage('Contact deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting contact:', error);
            showMessage('Error deleting contact.', 'error');
        }
    }
};

window.editSetting = (settingId) => {
    console.log('Edit setting:', settingId);
    showMessage('Settings editing functionality coming soon.', 'info');
};

// Utility Functions
function showAuthError(message) {
    if (authError) {
        authError.textContent = message;
        authError.style.display = message ? 'block' : 'none';
        if (message) {
            authError.classList.add('show');
        } else {
            authError.classList.remove('show');
        }
    }
}

function clearAuthError() {
    authError.textContent = '';
    authError.classList.remove('show');
}

function showMessage(message, type = 'success') {
    const messageContainer = document.getElementById('message-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    messageContainer.appendChild(messageDiv);
    
    // Remove message after 4 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 4000);
}

function getAuthErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'Invalid email address.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        default:
            return 'Login failed. Please check your credentials.';
    }
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === editProductModal) {
        editProductModal.style.display = 'none';
    }
});

// Enter key handlers
emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        passwordInput.focus();
    }
});

passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginButton.click();
    }
});

} // End of initializeAdmin function