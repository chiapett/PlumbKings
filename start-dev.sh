#!/bin/bash

# PKWLC Dashboard Local Development Server
echo "🏆 Starting PKWLC Dashboard Local Development Server..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your Firebase configuration"
    exit 1
fi

# Create local env config for development
echo "🔧 Creating local environment configuration..."
cat > js/env-config.js << 'EOF'
// Local development environment configuration
// This file is auto-generated and ignored by git
(function() {
    console.log('🔧 Local development mode - using test database');
    
    // Set environment to use local database
    window.ENV = {
        FIREBASE_API_KEY: "local_development",
        FIREBASE_AUTH_DOMAIN: "local_development", 
        FIREBASE_PROJECT_ID: "local_development",
        FIREBASE_STORAGE_BUCKET: "local_development",
        FIREBASE_MESSAGING_SENDER_ID: "local_development",
        FIREBASE_APP_ID: "local_development"
    };
    
    console.log('�️ Using local test database for development');
})();
EOF

# Start local server
echo "🚀 Starting local web server..."
echo "📱 Dashboard will be available at:"
echo "   http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Try different server options
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    python -m http.server 8000
elif command -v php &> /dev/null; then
    php -S localhost:8000
else
    echo "❌ No suitable web server found."
    echo "Please install Python or PHP, or use a different web server."
    echo "You can also use: npx http-server"
fi
