// Application state
let competitors = ['Ben', 'Brien', 'Carl', 'Keith', 'Ryan', 'Stephen', 'Spencer', 'Tristan'];
let weightData = [];
let charts = {};

// Challenge configuration
const challengeConfig = {
    startDate: new Date('2025-08-04'), // Today
    endDate: new Date('2025-11-04'),   // 3 months from now
    milestones: [
        { name: 'Month 1', date: new Date('2025-09-04'), description: 'First Month Challenge' },
        { name: 'Month 2', date: new Date('2025-10-04'), description: 'Second Month Challenge' },
        { name: 'Month 3', date: new Date('2025-11-04'), description: 'Final Challenge' }
    ]
};

// DOM elements
const competitorSelect = document.getElementById('competitor');
const dateInput = document.getElementById('date');
const weightInput = document.getElementById('weight');
const weightForm = document.getElementById('weightForm');
const leaderboardDiv = document.getElementById('leaderboardTable');
const messageDiv = document.getElementById('message');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for all scripts to load
    setTimeout(() => {
        initializeApp();
    }, 100);
});

async function initializeApp() {
    try {
        // Ensure database is available
        if (!db && window.LocalFirestore) {
            db = window.LocalFirestore.db;
            console.log('🗄️ Local database initialized');
        }
        
        if (!db) {
            throw new Error('Database not initialized');
        }
        
        // Set today's date as default
        dateInput.valueAsDate = new Date();
        
        // Populate competitor dropdown
        populateCompetitorDropdown();
        
        // Load existing data
        await loadWeightData();
        
        // Setup form handler
        setupFormHandler();
        
        // Initial render
        renderChallengeTimeline();
        renderLeaderboard();
        renderCharts();
        
        console.log('✅ PKWLC Dashboard initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing app:', error);
        showMessage('Error initializing dashboard. Check console for details.', 'error');
    }
}

function renderChallengeTimeline() {
    const timelineDiv = document.getElementById('challengeTimeline');
    const today = new Date();
    
    // Calculate days elapsed and remaining
    const totalDays = Math.ceil((challengeConfig.endDate - challengeConfig.startDate) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.max(0, Math.ceil((today - challengeConfig.startDate) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, Math.ceil((challengeConfig.endDate - today) / (1000 * 60 * 60 * 24)));
    const progressPercent = Math.min(100, (daysElapsed / totalDays) * 100);
    
    let html = `
        <div class="challenge-stats">
            <div class="stat-card">
                <div class="stat-value">${daysElapsed}</div>
                <div class="stat-label">Days Completed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${daysRemaining}</div>
                <div class="stat-label">Days Remaining</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${progressPercent.toFixed(0)}%</div>
                <div class="stat-label">Challenge Progress</div>
            </div>
        </div>
        
        <div class="timeline">
    `;
    
    // Add start milestone
    const startClass = today >= challengeConfig.startDate ? 'completed' : 'upcoming';
    html += `
        <div class="milestone ${startClass}">
            <div class="milestone-date">${formatDate(challengeConfig.startDate)}</div>
            <div class="milestone-name">🚀 Start</div>
            <div class="milestone-description">Challenge Begins</div>
        </div>
    `;
    
    // Add monthly milestones
    challengeConfig.milestones.forEach(milestone => {
        let milestoneClass = 'upcoming';
        if (today >= milestone.date) {
            milestoneClass = 'completed';
        } else if (Math.abs(today - milestone.date) <= 7 * 24 * 60 * 60 * 1000) { // Within 1 week
            milestoneClass = 'current';
        }
        
        html += `
            <div class="milestone ${milestoneClass}">
                <div class="milestone-date">${formatDate(milestone.date)}</div>
                <div class="milestone-name">${milestone.name}</div>
                <div class="milestone-description">${milestone.description}</div>
            </div>
        `;
    });
    
    html += '</div>';
    timelineDiv.innerHTML = html;
}

function populateCompetitorDropdown() {
    competitorSelect.innerHTML = '<option value="">Select competitor...</option>';
    competitors.forEach(competitor => {
        const option = document.createElement('option');
        option.value = competitor;
        option.textContent = competitor;
        competitorSelect.appendChild(option);
    });
}

function setupFormHandler() {
    weightForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const competitor = competitorSelect.value;
        const date = dateInput.value;
        const weight = parseFloat(weightInput.value);
        
        if (!competitor || !date || !weight) {
            showMessage('Please fill in all fields', 'error');
            return;
        }
        
        try {
            await addWeightEntry(competitor, date, weight);
            showMessage('Weight entry added successfully!', 'success');
            
            // Reset form
            weightForm.reset();
            dateInput.valueAsDate = new Date();
            
            // Refresh data and displays
            await loadWeightData();
            renderChallengeTimeline();
            renderLeaderboard();
            renderCharts();
            
        } catch (error) {
            console.error('Error adding weight entry:', error);
            showMessage('Error adding weight entry', 'error');
        }
    });
}

async function addWeightEntry(competitor, date, weight) {
    try {
        const entryData = {
            name: competitor,
            weight: weight
        };

        // Handle date and timestamp based on database type
        if (db.collection) {
            // Firebase Firestore
            entryData.date = firebase.firestore.Timestamp.fromDate(new Date(date));
            entryData.timestamp = firebase.firestore.FieldValue.serverTimestamp();
        } else {
            // Local database
            entryData.date = window.LocalFirestore.Timestamp.fromDate(new Date(date));
            entryData.timestamp = window.LocalFirestore.FieldValue.serverTimestamp();
        }

        await db.collection('weights').add(entryData);
        console.log('✅ Weight entry added successfully');
    } catch (error) {
        console.error('❌ Error adding weight entry:', error);
        throw error;
    }
}

// Function to load and display weight data
async function loadWeightData() {
    try {
        const snapshot = await db.collection('weights')
            .orderBy('date', 'asc')
            .get();
        
        weightData = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            weightData.push({
                id: doc.id,
                name: data.name,
                date: data.date.toDate(),
                weight: data.weight
            });
        });
        
        console.log(`✅ Loaded ${weightData.length} weight entries`);
        
        // Store data globally for charts
        window.PKWLC = window.PKWLC || {};
        window.PKWLC.weightData = weightData;
        window.PKWLC.competitors = competitors;
        
    } catch (error) {
        console.error('❌ Error loading weight data:', error);
        throw error;
    }
}

function calculateLeaderboard() {
    const competitorData = {};
    
    // Initialize competitor data
    competitors.forEach(competitor => {
        competitorData[competitor] = {
            name: competitor,
            entries: [],
            startWeight: null,
            currentWeight: null,
            weightLoss: 0,
            percentageLoss: 0
        };
    });
    
    // Process weight entries
    weightData.forEach(entry => {
        if (competitorData[entry.name]) {
            competitorData[entry.name].entries.push(entry);
        }
    });
    
    // Calculate statistics for each competitor
    Object.values(competitorData).forEach(competitor => {
        if (competitor.entries.length > 0) {
            // Sort entries by date
            competitor.entries.sort((a, b) => a.date - b.date);
            
            competitor.startWeight = competitor.entries[0].weight;
            competitor.currentWeight = competitor.entries[competitor.entries.length - 1].weight;
            competitor.weightLoss = competitor.startWeight - competitor.currentWeight;
            competitor.percentageLoss = competitor.startWeight > 0 ? 
                (competitor.weightLoss / competitor.startWeight) * 100 : 0;
        }
    });
    
    // Sort by weight loss (descending)
    return Object.values(competitorData)
        .filter(competitor => competitor.entries.length > 0)
        .sort((a, b) => b.weightLoss - a.weightLoss);
}

function renderLeaderboard() {
    const leaderboard = calculateLeaderboard();
    
    if (leaderboard.length === 0) {
        leaderboardDiv.innerHTML = '<div class="loading">No weight entries yet. Add some data to see the leaderboard!</div>';
        return;
    }
    
    let html = '<table class="leaderboard-table"><thead><tr>';
    html += '<th>Rank</th><th>Competitor</th><th>Start Weight</th><th>Current Weight</th><th>Weight Loss</th><th>Percentage</th><th>Entries</th>';
    html += '</tr></thead><tbody>';
    
    leaderboard.forEach((competitor, index) => {
        const rank = index + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        const weightLossClass = competitor.weightLoss >= 0 ? 'weight-loss' : 'weight-loss negative';
        
        html += `<tr>
            <td><span class="rank ${rankClass}">${rank}</span></td>
            <td><strong>${competitor.name}</strong></td>
            <td>${competitor.startWeight.toFixed(1)} lbs</td>
            <td>${competitor.currentWeight.toFixed(1)} lbs</td>
            <td class="${weightLossClass}">${competitor.weightLoss >= 0 ? '+' : ''}${competitor.weightLoss.toFixed(1)} lbs</td>
            <td class="${weightLossClass}">${competitor.percentageLoss.toFixed(1)}%</td>
            <td>${competitor.entries.length}</td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    leaderboardDiv.innerHTML = html;
}

function showMessage(text, type = 'success') {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        messageDiv.classList.add('hidden');
    }, 3000);
}

// Utility function to format date
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Debug function to check data
window.debugChartData = function() {
    console.log('=== PKWLC Debug Info ===');
    console.log('Weight Data:', window.PKWLC?.weightData);
    console.log('Competitors:', window.PKWLC?.competitors);
    console.log('Weight Chart:', window.weightChart);
    console.log('Percentage Chart:', window.percentageChart);
    console.log('Charts loaded?', !!window.Chart);
    
    // Try to manually render charts
    if (window.PKWLC?.renderChartsInternal) {
        console.log('Manually rendering charts...');
        window.PKWLC.renderChartsInternal();
    }
};

// Add to global PKWLC object
window.PKWLC.debugChartData = window.debugChartData;

// Export functions for use in other modules
window.PKWLC = {
    loadWeightData,
    calculateLeaderboard,
    renderLeaderboard,
    weightData,
    competitors
};
