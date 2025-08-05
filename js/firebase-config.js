// Firebase configuration
const firebaseConfig = {
    apiKey: window.ENV?.FIREBASE_API_KEY || "your_api_key_here",
    authDomain: window.ENV?.FIREBASE_AUTH_DOMAIN || "your_auth_domain_here",
    projectId: window.ENV?.FIREBASE_PROJECT_ID || "your_project_id_here",
    storageBucket: window.ENV?.FIREBASE_STORAGE_BUCKET || "your_storage_bucket_here",
    messagingSenderId: window.ENV?.FIREBASE_MESSAGING_SENDER_ID || "your_sender_id_here",
    appId: window.ENV?.FIREBASE_APP_ID || "your_app_id_here"
};

// Check if we should use local database (for development)
// Use Firebase if we have valid environment variables
const useLocalDB = !window.ENV?.FIREBASE_API_KEY || 
                   window.ENV.FIREBASE_API_KEY === "your_api_key_here" ||
                   (window.location.hostname === 'localhost' && !window.ENV?.FIREBASE_API_KEY) ||
                   (window.location.hostname === '127.0.0.1' && !window.ENV?.FIREBASE_API_KEY) ||
                   (window.location.protocol === 'file:' && !window.ENV?.FIREBASE_API_KEY);

let db;

if (useLocalDB) {
    console.log('🗄️ Using local test database for development');
    // Wait for local-db.js to load
    if (window.LocalFirestore) {
        db = window.LocalFirestore.db;
    } else {
        // LocalFirestore not loaded yet, will be set later
        console.log('⏳ Waiting for local database to initialize...');
    }
} else {
    console.log('🔥 Using Firebase Firestore');
    console.log('🔑 Firebase config loaded from environment variables');
    try {
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        // Initialize Firestore
        db = firebase.firestore();
        console.log('✅ Firebase initialized successfully');
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        console.log('⚠️ Falling back to local database...');
        // Fallback to local database if Firebase fails
        if (window.LocalFirestore) {
            db = window.LocalFirestore.db;
        }
    }
}

// For GitHub Pages deployment with secrets, inject environment variables
if (typeof process !== 'undefined' && process.env) {
    // This will be replaced during build process
    window.ENV = {
        FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
        FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
        FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
        FIREBASE_APP_ID: process.env.FIREBASE_APP_ID
    };
}
