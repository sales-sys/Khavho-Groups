// Firebase Configuration Handler
// This file will use environment variables in production

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
    // Production configuration - uses Netlify environment variables
    firebaseConfig = {
        apiKey: window.FIREBASE_API_KEY || "demo-key",
        authDomain: window.FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
        projectId: window.FIREBASE_PROJECT_ID || "demo-project",
        storageBucket: window.FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
        messagingSenderId: window.FIREBASE_MESSAGING_SENDER_ID || "123456789",
        appId: window.FIREBASE_APP_ID || "demo-app-id"
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