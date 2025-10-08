// Contact Form JavaScript for Main Website
// This script handles contact form submissions and syncs with Firebase

// Contact Form Handler
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Firebase to be initialized
    const waitForFirebase = setInterval(() => {
        if (window.firebase && window.db) {
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
            
            // Add event listeners only if fields exist
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
                    
                    // Create contact object
                    const contactData = {
                        firstName: formData.get('firstName') || '',
                        lastName: formData.get('lastName') || '',
                        email: formData.get('email') || '',
                        phone: formData.get('phone') || '',
                        company: formData.get('company') || '',
                        service: formData.get('service') || '',
                        message: formData.get('message') || '',
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        status: 'new'
                    };
                    
                    // Save to Firebase (using 'messages' collection for admin panel compatibility)
                    await window.db.collection('messages').add(contactData);
                    
                    // Show success message
                    showContactSuccess();
                    
                    // Reset form
                    contactForm.reset();
                    
                } catch (error) {
                    console.error('Error submitting contact form:', error);
                    showContactError('Failed to send message. Please try again.');
                } finally {
                    // Reset button
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                }
            });
        }
    }
});

// Show success message
function showContactSuccess() {
    const successMessage = document.getElementById('contactSuccessMessage');
    if (successMessage) {
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 5000);
    }
}

// Show error message
function showContactError(message) {
    alert(message); // Simple fallback - you can improve this with a proper modal
}

// Product availability checker (simplified version without permissions issues)
async function checkProductAvailability() {
    try {
        // This function can be used when needed
        console.log('Product availability check - function available');
        return true;
    } catch (error) {
        console.log('Product availability check not available:', error);
        return false;
    }
}

// WhatsApp contact functionality
function contactViaWhatsApp(productName) {
    const phoneNumber = '+27123456789'; // Replace with your actual WhatsApp business number
    const message = `Hi! I'm interested in: ${productName}. Can you provide more information?`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Make functions globally available
window.checkProductAvailability = checkProductAvailability;
window.contactViaWhatsApp = contactViaWhatsApp;
window.showContactSuccess = showContactSuccess;
window.showContactError = showContactError;