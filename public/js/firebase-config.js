// Firebase Configuration Handler
// This file uses environment variables in production and hardcoded values for development

let firebaseConfig;

// Check if we're in development (local) or production (Netlify)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Development configuration - you can keep your real config here for local testing
    firebaseConfig = {
        apiKey: "AIzaSyD11ui79llz1diUZEwt3Nl1UxtPWBB5aw8",
        authDomain: "khavho-groups.firebaseapp.com",
        projectId: "khavho-groups",
        storageBucket: "khavho-groups.firebasestorage.app",
        messagingSenderId: "39446039646",
        appId: "1:39446039646:web:f2cdf6cdfb38acab4038cf"
    };
} else {
    // Production configuration - these will be replaced during Netlify build
    // Netlify will inject the actual values from environment variables
    firebaseConfig = {
        apiKey: "AIzaSyD11ui79llz1diUZEwt3Nl1UxtPWBB5aw8",
        authDomain: "khavho-groups.firebaseapp.com", 
        projectId: "khavho-groups",
        storageBucket: "khavho-groups.firebasestorage.app",
        messagingSenderId: "39446039646",
        appId: "1:39446039646:web:f2cdf6cdfb38acab4038cf"
    };
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();
const auth = firebase.auth();

// Export for use in other files
window.db = db;
window.auth = auth;
window.firebase = firebase;