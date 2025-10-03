# PKWLC - PlumbKings Weight Loss Competition Dashboard

A Firebase-powered dashboard for tracking the 3-month PlumbKings weight loss challenge, deployed on GitHub Pages.

## 🏆 Current Challenge

**Duration:** August 4, 2025 - November 4, 2025 (3 months)  
**Participants:** Ben, Brien, Carl, Keith, Rich, Ryan, Stephen, Spencer, Tristan  
**Format:** Monthly milestones with overall 3-month competition  

### 📅 Challenge Milestones
- **Month 1:** September 4, 2025 - First progress check
- **Month 2:** October 4, 2025 - Second progress check  
- **Final:** November 4, 2025 - Challenge completion

## 🏆 Features

- **Real-time Leaderboard** - Rankings based on total weight loss
- **Challenge Timeline** - Track progress through 3-month journey with milestones
- **Interactive Charts** - Weight progress and percentage loss over time
- **Data Entry Form** - Easy weight tracking with competitor selection
- **Firebase Integration** - Secure cloud data storage
- **Local Test Database** - Automatic local development without Firebase setup
- **Responsive Design** - Works on desktop and mobile devices
- **Database Management** - Export/import and clear data functionality

## 🚀 Live Dashboard

Visit: `https://[your-username].github.io/PlumbKings`

## 📊 Demo

The dashboard includes:
- Weight entry form with competitor selection
- Dynamic leaderboard with rankings
- Line charts showing weight progress over time
- Percentage weight loss visualization

## 🛠️ Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project named "PKWLC" (or any name you prefer)
3. Enable Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Choose your preferred location
4. Get your Firebase configuration:
   - Go to Project Settings → General
   - Scroll down to "Your apps" → Web apps
   - Click "Add app" and register your app
   - Copy the configuration values

### 2. GitHub Repository Setup

1. Fork or clone this repository
2. Go to your repository Settings → Secrets and variables → Actions
3. Add the following repository secrets:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN` 
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`

### 3. Enable GitHub Pages

1. Go to repository Settings → Pages
2. Source: Deploy from a branch
3. Branch: `gh-pages` (will be created automatically)
4. The dashboard will be available at: `https://[username].github.io/[repository-name]`

### 4. Local Development

For local development, the dashboard automatically uses a **local test database** that mimics Firebase Firestore functionality. This allows you to develop and test without needing Firebase credentials.

#### Automatic Local Database
- When running locally (`localhost`, `127.0.0.1`, or `file://`), the app automatically uses a local database
- Data is stored in browser's localStorage
- Includes sample data for immediate testing
- No Firebase setup required for local development

#### Start Local Development:

1. **Quick Start** (with local database):
   ```bash
   ./start-dev.sh
   ```

2. **Manual Start**:
   ```bash
   # Using Python
   python3 -m http.server 8000
   
   # Using Node.js
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**: `http://localhost:8000`

#### Local Database Management
When running locally, you have access to console commands for database management:

```javascript
// In browser console:
dbStats()    // Show database statistics
dbExport()   // Export database to JSON file
dbClear()    // Clear all local data
dbSample()   // Add sample weight data
```

#### Using Real Firebase Locally
If you want to use real Firebase in local development:

1. Copy `.env.example` to `.env` and fill in your Firebase config
2. The app will still use local database by default
3. To force Firebase usage, modify `js/firebase-config.js` and set `useLocalDB = false`

## 👥 Adding Competitors

Edit the `competitors` array in `js/app.js`:

```javascript
let competitors = ['Tristan', 'Mike', 'Sarah', 'Alex', 'Jordan'];
```

## 📱 Usage

1. **Adding Weight Data**:
   - Select competitor from dropdown
   - Choose date (defaults to today)
   - Enter weight in pounds
   - Click "Add Weight Entry"

2. **Viewing Progress**:
   - Leaderboard shows current rankings
   - Charts display weight trends over time
   - Percentage chart shows relative progress

## 🔒 Security

- Firebase rules should be configured for your use case
- Environment variables keep API keys secure
- Local `.env` file is gitignored

## 🎨 Customization

- **Colors**: Modify the `colorPalette` array in `js/charts.js`
- **Styling**: Edit `css/styles.css` for visual changes
- **Competitors**: Update the `competitors` array in `js/app.js`

## 📁 Project Structure

```
/
├── index.html              # Main dashboard page
├── css/
│   └── styles.css         # Dashboard styling
├── js/
│   ├── app.js             # Main application logic
│   ├── firebase-config.js # Firebase configuration
│   └── charts.js          # Chart rendering logic
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions deployment
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## 🚀 Deployment

The dashboard automatically deploys to GitHub Pages when you push to the main branch. The GitHub Action:

1. Injects Firebase configuration from secrets
2. Builds the application
3. Deploys to GitHub Pages

## 🤝 Contributing

Feel free to customize the dashboard for your competition! Some ideas:

- Add photo uploads
- Include body measurements
- Add goal setting features
- Implement user authentication
- Add data export functionality

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
