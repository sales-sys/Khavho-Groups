// Build script to replace environment variables in production
// This runs during Netlify build to inject secure values

const fs = require('fs');
const path = require('path');

// Files that need environment variable replacement
const filesToProcess = [
    'env-loader.js'
];

// Environment variables to replace
const envVars = {
    'FIREBASE_API_KEY': process.env.FIREBASE_API_KEY,
    'FIREBASE_AUTH_DOMAIN': process.env.FIREBASE_AUTH_DOMAIN,
    'FIREBASE_PROJECT_ID': process.env.FIREBASE_PROJECT_ID,
    'FIREBASE_STORAGE_BUCKET': process.env.FIREBASE_STORAGE_BUCKET,
    'FIREBASE_MESSAGING_SENDER_ID': process.env.FIREBASE_MESSAGING_SENDER_ID,
    'FIREBASE_APP_ID': process.env.FIREBASE_APP_ID
};

// Process each file
filesToProcess.forEach(fileName => {
    try {
        const filePath = path.join(__dirname, fileName);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace placeholders with actual environment variables
        Object.entries(envVars).forEach(([key, value]) => {
            const placeholder = `{{${key}}}`;
            content = content.replace(new RegExp(placeholder, 'g'), value || '');
        });
        
        // Write the updated content back
        fs.writeFileSync(filePath, content);
        console.log(`✅ Processed ${fileName}`);
    } catch (error) {
        console.error(`❌ Error processing ${fileName}:`, error.message);
    }
});

console.log('🔐 Environment variables injected successfully!');