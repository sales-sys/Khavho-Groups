// Login Page JavaScript
console.log('🔐 Login page JS loaded');

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Check if user is already logged in
    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged(function(user) {
            if (user) {
                // User is already logged in, redirect to home
                console.log('User already logged in, redirecting...');
                window.location.href = '/';
            }
        });
    }
});

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = document.querySelector('.auth-submit-btn');
    
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    // Show loading state
    submitBtn.innerHTML = '<i data-lucide="loader-2"></i> Signing In...';
    submitBtn.disabled = true;
    
    try {
        // Wait for Firebase to be ready
        if (typeof auth === 'undefined') {
            throw new Error('Firebase is not loaded');
        }
        
        // Sign in with Firebase
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log('✅ Login successful:', user.email);
        
        // Check if user has additional profile data
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                console.log('User profile loaded:', userData);
            }
        } catch (profileError) {
            console.log('Note: Could not load user profile (this is optional)');
        }
        
        showSuccess('Login successful! Redirecting...');
        
        // Redirect after short delay
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
        
    } catch (error) {
        console.error('❌ Login error:', error);
        
        let errorMessage = 'Login failed. Please try again.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email address.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password. Please try again.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Please enter a valid email address.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your connection.';
                break;
            default:
                errorMessage = error.message || 'An error occurred during login.';
        }
        
        showError(errorMessage);
        
        // Reset button
        submitBtn.innerHTML = '<i data-lucide="log-in"></i> Sign In';
        submitBtn.disabled = false;
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

function showError(message) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.error-message, .success-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Insert before form
    const form = document.getElementById('loginForm');
    form.parentNode.insertBefore(errorDiv, form);
}

function showSuccess(message) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.error-message, .success-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    // Insert before form
    const form = document.getElementById('loginForm');
    form.parentNode.insertBefore(successDiv, form);
}