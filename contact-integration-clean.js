// Contact Integration
// This file handles contact form integrations and external services

console.log('📧 Contact integration loaded');

// Make sure contact form function is globally available  
if (typeof submitContactForm === 'function') {
    window.submitContactForm = submitContactForm;
    console.log('✅ Contact form function made globally available');
} else {
    console.warn('⚠️ submitContactForm function not found');
}

// Additional contact integrations can be added here
// For example: third-party email services, CRM integrations, etc.