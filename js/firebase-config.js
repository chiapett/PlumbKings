// Firebase configuration - hardcoded for reliability
const firebaseConfig = {
    apiKey: "AIzaSyAAaz1E3eCJ6x4Q1RgTQi5A3PFEZVA--Mk",
    authDomain: "plumb-king-dashboard.firebaseapp.com",
    projectId: "plumb-king-dashboard",
    storageBucket: "plumb-king-dashboard.firebasestorage.app",
    messagingSenderId: "926852362871",
    appId: "1:926852362871:web:ff3f12c4c40796a561cc72"
};

// Debug logging
console.log('🔍 Environment Debug Info:');
console.log('- hostname:', window.location.hostname);
console.log('- protocol:', window.location.protocol);
console.log('- Firebase config:', firebaseConfig);

// Always use Firebase since we have hardcoded configuration
// Only use local DB if explicitly requested via URL parameter
const urlParams = new URLSearchParams(window.location.search);
const forceLocal = urlParams.get('useLocal') === 'true';

const useLocalDB = forceLocal;

console.log('🗄️ useLocalDB decision:', useLocalDB);
console.log('🔧 Force local mode:', forceLocal);

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
    console.log('🔑 Firebase config loaded with hardcoded values');
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
