// Register Page JavaScript
console.log('📝 Register page JS loaded');

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
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
    
    // Password confirmation validation
    const password = document.getElementById('registerPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    if (confirmPassword) {
        confirmPassword.addEventListener('input', validatePasswordMatch);
    }
});

function validatePasswordMatch() {
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const confirmField = document.getElementById('confirmPassword');
    
    if (confirmPassword && password !== confirmPassword) {
        confirmField.setCustomValidity('Passwords do not match');
        confirmField.style.borderColor = '#dc3545';
    } else {
        confirmField.setCustomValidity('');
        confirmField.style.borderColor = '#e1e5e9';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = document.querySelector('.auth-submit-btn');
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showError('Please fill in all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
    }
    
    // Show loading state
    submitBtn.innerHTML = '<i data-lucide="loader-2"></i> Creating Account...';
    submitBtn.disabled = true;
    
    try {
        // Wait for Firebase to be ready
        if (typeof auth === 'undefined') {
            throw new Error('Firebase is not loaded');
        }
        
        // Create user with Firebase
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log('✅ Registration successful:', user.email);
        
        // Update user profile with display name
        await user.updateProfile({
            displayName: name
        });
        
        // Save additional user data to Firestore
        try {
            await db.collection('users').doc(user.uid).set({
                name: name,
                email: email,
                role: 'user', // Default role
                createdAt: new Date(),
                emailVerified: user.emailVerified
            });
            console.log('✅ User profile saved to Firestore');
        } catch (firestoreError) {
            console.log('⚠️ Could not save to Firestore (continuing anyway):', firestoreError);
        }
        
        showSuccess('Account created successfully! Redirecting...');
        
        // Redirect after short delay
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        
        let errorMessage = 'Registration failed. Please try again.';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'An account with this email already exists. Try logging in instead.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Please enter a valid email address.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak. Please use at least 6 characters.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your connection.';
                break;
            default:
                errorMessage = error.message || 'An error occurred during registration.';
        }
        
        showError(errorMessage);
        
        // Reset button
        submitBtn.innerHTML = '<i data-lucide="user-plus"></i> Create Account';
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
    const form = document.getElementById('registerForm');
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
    const form = document.getElementById('registerForm');
    form.parentNode.insertBefore(successDiv, form);
}