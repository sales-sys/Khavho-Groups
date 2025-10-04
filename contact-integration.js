// Contact Form JavaScript for Main Website
// This script handles contact form submissions and syncs with Firebase

// Firebase configuration is loaded from firebase-config.js
// Using secure environment variables

// Contact Form Handler
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Firebase to be initialized
    const waitForFirebase = setInterval(() => {
        if (window.db && window.firebase) {
            clearInterval(waitForFirebase);
            initializeContactForm();
        }
    }, 100);
    
    function initializeContactForm() {
        const contactForm = document.getElementById('contactForm');
        
        if (contactForm) {
            // Update hidden name field when first/last name changes
            const firstNameField = document.getElementById('firstName');
            const lastNameField = document.getElementById('lastName');
            const fullNameField = document.getElementById('fullName');
            
            function updateFullName() {
                if (firstNameField && lastNameField && fullNameField) {
                    fullNameField.value = `${firstNameField.value} ${lastNameField.value}`.trim();
                }
            }
        }
        
        if (firstNameField) firstNameField.addEventListener('input', updateFullName);
        if (lastNameField) lastNameField.addEventListener('input', updateFullName);
        
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Update full name before submission
            updateFullName();
            
            // Show loading state
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';
            
            try {
                // Get form data
                const formData = new FormData(contactForm);
                const contactData = {
                    name: formData.get('name') || `${formData.get('firstName')} ${formData.get('lastName')}`.trim(),
                    email: formData.get('email'),
                    subject: formData.get('subject'),
                    message: formData.get('message'),
                    phone: formData.get('phone'),
                    company: formData.get('company'),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'new'
                };
                
                // Validate required fields
                if (!contactData.name || !contactData.email || !contactData.message) {
                    throw new Error('Please fill in all required fields');
                }
                
                // Save to Firebase
                await window.db.collection('contacts').add(contactData);
                
                // Show success message
                showMessage('Thank you! Your message has been sent successfully. We will get back to you within 24 hours.', 'success');
                
                // Reset form
                contactForm.reset();
                
            } catch (error) {
                console.error('Error sending message:', error);
                showMessage('Sorry, there was an error sending your message. Please try again.', 'error');
            } finally {
                // Reset button
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        });
        }
    }
});

// Product availability checker
async function checkProductAvailability() {
    try {
        const snapshot = await db.collection('website-content').doc('products').get();
        if (snapshot.exists) {
            const products = snapshot.data();
            
            // Update product displays on the website
            Object.keys(products).forEach(productId => {
                const product = products[productId];
                updateProductDisplay(productId, product);
            });
        }
    } catch (error) {
        console.error('Error checking product availability:', error);
    }
}

// Update product display based on admin panel changes
function updateProductDisplay(productId, productData) {
    // Find product elements on the page
    const productElements = document.querySelectorAll(`[data-product-id="${productId}"]`);
    
    productElements.forEach(element => {
        // Update stock status
        const stockElement = element.querySelector('.stock-status');
        if (stockElement) {
            if (productData.stock === 0) {
                stockElement.textContent = 'Out of Stock';
                stockElement.className = 'stock-status out-of-stock';
            } else if (productData.stock <= 10) {
                stockElement.textContent = `Only ${productData.stock} left`;
                stockElement.className = 'stock-status low-stock';
            } else {
                stockElement.textContent = 'In Stock';
                stockElement.className = 'stock-status in-stock';
            }
        }
        
        // Update price
        const priceElement = element.querySelector('.product-price');
        if (priceElement && productData.price) {
            priceElement.textContent = `R ${productData.price.toFixed(2)}`;
        }
        
        // Update availability
        const buttonElement = element.querySelector('.product-button');
        if (buttonElement) {
            if (!productData.isAvailable || productData.stock === 0) {
                buttonElement.disabled = true;
                buttonElement.textContent = 'Unavailable';
                buttonElement.className = 'product-button disabled';
            } else {
                buttonElement.disabled = false;
                buttonElement.textContent = 'Order Now';
                buttonElement.className = 'product-button available';
            }
        }
    });
}

// Show notification messages
function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.notification-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `notification-message ${type}`;
    messageDiv.innerHTML = `
        <div class="message-content">
            <span class="message-text">${message}</span>
            <button class="message-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Add styles
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    `;
    
    if (type === 'success') {
        messageDiv.style.backgroundColor = '#f0fff4';
        messageDiv.style.color = '#38a169';
        messageDiv.style.border = '1px solid #68d391';
    } else if (type === 'error') {
        messageDiv.style.backgroundColor = '#fed7d7';
        messageDiv.style.color = '#e53e3e';
        messageDiv.style.border = '1px solid #fc8181';
    } else {
        messageDiv.style.backgroundColor = '#ebf8ff';
        messageDiv.style.color = '#3182ce';
        messageDiv.style.border = '1px solid #90cdf4';
    }
    
    // Add to page
    document.body.appendChild(messageDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentElement) {
            messageDiv.remove();
        }
    }, 5000);
}

// Initialize product availability checking when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check product availability on page load
    checkProductAvailability();
    
    // Check for updates every 30 seconds
    setInterval(checkProductAvailability, 30000);
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .message-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .message-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        margin-left: 10px;
        opacity: 0.7;
    }
    
    .message-close:hover {
        opacity: 1;
    }
    
    .stock-status {
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        text-transform: uppercase;
    }
    
    .stock-status.in-stock {
        background: #f0fff4;
        color: #38a169;
    }
    
    .stock-status.low-stock {
        background: #fef5e7;
        color: #d69e2e;
    }
    
    .stock-status.out-of-stock {
        background: #fed7d7;
        color: #e53e3e;
    }
    
    .product-button.disabled {
        background: #e2e8f0;
        color: #a0aec0;
        cursor: not-allowed;
    }
    
    .product-button.available {
        background: #F37021;
        color: white;
        cursor: pointer;
    }
`;
document.head.appendChild(style);