// Environment Variables Loader for Netlify
// This script loads environment variables from Netlify build settings

(function() {
    // Only run in production (not localhost)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // These will be set by Netlify environment variables
        // The actual values will be injected during build
        window.FIREBASE_API_KEY = '{{FIREBASE_API_KEY}}';
        window.FIREBASE_AUTH_DOMAIN = '{{FIREBASE_AUTH_DOMAIN}}';
        window.FIREBASE_PROJECT_ID = '{{FIREBASE_PROJECT_ID}}';
        window.FIREBASE_STORAGE_BUCKET = '{{FIREBASE_STORAGE_BUCKET}}';
        window.FIREBASE_MESSAGING_SENDER_ID = '{{FIREBASE_MESSAGING_SENDER_ID}}';
        window.FIREBASE_APP_ID = '{{FIREBASE_APP_ID}}';
    }
})();