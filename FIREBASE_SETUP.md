# Setting up GitHub Secrets for Firebase

To enable Firebase integration on GitHub Pages, you need to add the following secrets to your GitHub repository:

## 📋 Required Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets with the values from your Firebase configuration:

```
FIREBASE_API_KEY = AIzaSyAAaz1E3eCJ6x4Q1RgTQi5A3PFEZVA--Mk
FIREBASE_AUTH_DOMAIN = plumb-king-dashboard.firebaseapp.com
FIREBASE_PROJECT_ID = plumb-king-dashboard
FIREBASE_STORAGE_BUCKET = plumb-king-dashboard.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID = 926852362871
FIREBASE_APP_ID = 1:926852362871:web:ff3f12c4c40796a561cc72
```

## 🚀 How It Works

1. **Local Development**: Uses local test database by default
2. **GitHub Pages**: Uses Firebase when secrets are configured
3. **Automatic Detection**: App detects environment and chooses appropriate database

## ✅ Verification

After setting up secrets:
1. Push changes to main branch
2. Wait for GitHub Actions to deploy
3. Visit your GitHub Pages site
4. Look for "🔥 Using Firebase Firestore Database" indicator
5. Test adding weight data
6. Check Firebase Console for new entries

## 🔧 Troubleshooting

- **Still seeing local database**: Check that all secrets are set correctly
- **Firebase errors**: Verify Firebase project permissions and rules
- **Data not saving**: Check browser console for error messages
