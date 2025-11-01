// Application state
let competitors = ['Ben', 'Brien', 'Carl', 'Keith', 'Rich', 'Ryan', 'Stephen', 'Spencer', 'Tristan'];
let weightData = [];
let allWeightData = []; // Store all data across all seasons
let charts = {};

// Auto-detect current season based on today's date
function detectCurrentSeason() {
    const today = new Date();
    // After Nov 4th 2025, default to Season 2
    if (today >= new Date('2025-11-04')) {
        return 2;
    }
    return 1;
}

let currentSeason = detectCurrentSeason();

// Season configurations
const seasons = [
    {
        id: 1,
        name: 'Season 1',
        startDate: new Date('2025-08-04'),
        endDate: new Date('2025-11-04'),
        milestones: [
            { name: 'Month 1', date: new Date('2025-09-04'), description: 'First Month Challenge' },
            { name: 'Month 2', date: new Date('2025-10-04'), description: 'Second Month Challenge' },
            { name: 'Month 3', date: new Date('2025-11-04'), description: 'Final Challenge' }
        ]
    },
    {
        id: 2,
        name: 'Season 2',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2026-01-31'),
        milestones: [
            { name: 'Month 1', date: new Date('2025-12-01'), description: 'First Month Challenge' },
            { name: 'Month 2', date: new Date('2026-01-01'), description: 'Second Month Challenge' },
            { name: 'Month 3', date: new Date('2026-01-31'), description: 'Final Challenge' }
        ]
    }
];

// Get current season config
function getCurrentSeasonConfig() {
    return seasons.find(s => s.id === currentSeason) || seasons[1];
}

// Challenge configuration (will be dynamic based on season)
let challengeConfig = getCurrentSeasonConfig();

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
        
        // Setup season toggles
        setupSeasonToggles();
        
        // Update UI with current season
        updateSeasonUI();
        
        // Initial render
        renderChallengeTimeline();
        renderLeaderboard();
        renderCharts();
        
        console.log('✅ PKWLC Dashboard initialized successfully');
        console.log(`📅 Current season: ${currentSeason} (${getCurrentSeasonConfig().name})`);
    } catch (error) {
        console.error('❌ Error initializing app:', error);
        showMessage('Error initializing dashboard. Check console for details.', 'error');
    }
}

// Filter weight data by current season
function filterDataBySeason(data) {
    const seasonConfig = getCurrentSeasonConfig();
    const startDate = seasonConfig.startDate;
    const endDate = seasonConfig.endDate;
    
    // Filter entries within the season date range
    const seasonData = data.filter(entry => {
        const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
    });
    
    // For Season 2+, add virtual carryover entries at the start of the season
    if (currentSeason > 1) {
        const carryoverWeights = getSeasonCarryoverWeights(currentSeason);
        const carryoverEntries = [];
        
        competitors.forEach(competitor => {
            if (carryoverWeights[competitor]) {
                // Add a virtual entry at the start of the season with carryover weight
                carryoverEntries.push({
                    id: `carryover-${competitor}`,
                    name: competitor,
                    date: new Date(startDate),
                    weight: carryoverWeights[competitor],
                    isCarryover: true
                });
            }
        });
        
        // Combine carryover entries with actual season data
        return [...carryoverEntries, ...seasonData].sort((a, b) => {
            const dateA = a.date instanceof Date ? a.date : new Date(a.date);
            const dateB = b.date instanceof Date ? b.date : new Date(b.date);
            return dateA - dateB;
        });
    }
    
    return seasonData;
}

// Get the last weight from previous season for each competitor
function getSeasonCarryoverWeights(seasonId) {
    if (seasonId === 1) return {}; // Season 1 has no carryover
    
    const previousSeason = seasons.find(s => s.id === seasonId - 1);
    if (!previousSeason) return {};
    
    const carryoverWeights = {};
    
    competitors.forEach(competitor => {
        // Get all entries from previous season
        const previousSeasonData = allWeightData.filter(entry => {
            const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
            return (entry.name === competitor || entry.competitor === competitor) &&
                   entryDate >= previousSeason.startDate && 
                   entryDate <= previousSeason.endDate;
        });
        
        // Sort by date and get the last entry
        if (previousSeasonData.length > 0) {
            previousSeasonData.sort((a, b) => {
                const dateA = a.date instanceof Date ? a.date : new Date(a.date);
                const dateB = b.date instanceof Date ? b.date : new Date(b.date);
                return dateB - dateA;
            });
            carryoverWeights[competitor] = previousSeasonData[0].weight;
        }
    });
    
    return carryoverWeights;
}

// Switch season
function switchSeason(seasonId) {
    currentSeason = seasonId;
    challengeConfig = getCurrentSeasonConfig();
    
    // Update active button state
    document.querySelectorAll('.season-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.season) === seasonId);
    });
    
    // Filter data and re-render everything
    weightData = filterDataBySeason(allWeightData);
    
    // CRITICAL: Update the global data that charts use
    window.PKWLC = window.PKWLC || {};
    window.PKWLC.weightData = weightData;
    window.PKWLC.allWeightData = allWeightData;
    window.PKWLC.competitors = competitors;
    
    console.log(`Switched to Season ${seasonId}: ${weightData.length} entries visible`);
    
    // Update UI
    updateSeasonUI();
    
    // Re-render all views
    renderChallengeTimeline();
    renderLeaderboard();
    renderCharts();
    
    // Show message
    showMessage(`Switched to ${challengeConfig.name}`, 'success');
}

// Update header and UI with current season info
function updateSeasonUI() {
    const seasonConfig = getCurrentSeasonConfig();
    
    // Update season dates in header
    const seasonDatesSpan = document.getElementById('season-dates');
    if (seasonDatesSpan) {
        const startStr = seasonConfig.startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const endStr = seasonConfig.endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        seasonDatesSpan.textContent = `${startStr} - ${endStr}`;
    }
}

// Setup season toggle listeners
function setupSeasonToggles() {
    document.querySelectorAll('.season-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const seasonId = parseInt(btn.dataset.season);
            switchSeason(seasonId);
        });
    });
    
    // Set initial active state
    document.querySelectorAll('.season-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.season) === currentSeason);
    });
}

function getBiggestLoserForMilestone(milestoneDate) {
    // Calculate weight loss up to the milestone date
    const competitorProgress = {};
    const carryoverWeights = getSeasonCarryoverWeights(currentSeason);
    
    // Initialize competitor data
    competitors.forEach(competitor => {
        competitorProgress[competitor] = {
            name: competitor,
            startWeight: carryoverWeights[competitor] || null,
            milestoneWeight: null,
            weightLoss: 0
        };
    });
    
    // Process weight entries up to milestone date
    weightData.forEach(entry => {
        const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
        
        if (entryDate <= milestoneDate && competitorProgress[entry.name]) {
            // Set start weight (first entry) if no carryover
            if (!competitorProgress[entry.name].startWeight) {
                competitorProgress[entry.name].startWeight = entry.weight;
            }
            
            // Update milestone weight (last entry before or on milestone date)
            if (!competitorProgress[entry.name].milestoneWeight || entryDate > new Date(competitorProgress[entry.name].lastDate)) {
                competitorProgress[entry.name].milestoneWeight = entry.weight;
                competitorProgress[entry.name].lastDate = entryDate;
            }
        }
    });
    
    // Calculate weight loss for each competitor
    let biggestLoser = null;
    let maxWeightLoss = 0;
    
    Object.values(competitorProgress).forEach(competitor => {
        if (competitor.startWeight && competitor.milestoneWeight) {
            competitor.weightLoss = competitor.startWeight - competitor.milestoneWeight;
            
            if (competitor.weightLoss > maxWeightLoss) {
                maxWeightLoss = competitor.weightLoss;
                biggestLoser = competitor;
            }
        }
    });
    
    return biggestLoser;
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
    
    // Add monthly milestones with biggest loser info
    challengeConfig.milestones.forEach(milestone => {
        let milestoneClass = 'upcoming';
        if (today >= milestone.date) {
            milestoneClass = 'completed';
        } else if (Math.abs(today - milestone.date) <= 7 * 24 * 60 * 60 * 1000) { // Within 1 week
            milestoneClass = 'current';
        }
        
        // Get biggest loser for this milestone if it has passed
        let biggestLoserInfo = '';
        if (today >= milestone.date && weightData.length > 0) {
            const biggestLoser = getBiggestLoserForMilestone(milestone.date);
            if (biggestLoser && biggestLoser.weightLoss > 0) {
                biggestLoserInfo = `
                    <div class="milestone-winner">
                        🏆 Biggest Loser: ${biggestLoser.name}<br>
                        Lost ${biggestLoser.weightLoss.toFixed(1)} lbs
                    </div>
                `;
            }
        }
        
        html += `
            <div class="milestone ${milestoneClass}">
                <div class="milestone-date">${formatDate(milestone.date)}</div>
                <div class="milestone-name">${milestone.name}</div>
                <div class="milestone-description">${milestone.description}</div>
                ${biggestLoserInfo}
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
            
            // Show modal instead of simple message
            showWeightModal(competitor, date, weight);
            
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
        if (db.collection && typeof firebase !== 'undefined') {
            // Firebase Firestore
            console.log('🔥 Adding to Firebase Firestore');
            entryData.date = firebase.firestore.Timestamp.fromDate(new Date(date));
            entryData.timestamp = firebase.firestore.FieldValue.serverTimestamp();
        } else {
            // Local database
            console.log('🗄️ Adding to Local database');
            entryData.date = window.LocalFirestore.Timestamp.fromDate(new Date(date));
            entryData.timestamp = window.LocalFirestore.FieldValue.serverTimestamp();
        }

        const docRef = await db.collection('weights').add(entryData);
        console.log('✅ Weight entry added successfully, ID:', docRef.id || 'local');
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
        
        allWeightData = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            allWeightData.push({
                id: doc.id,
                name: data.name,
                date: data.date.toDate(),
                weight: data.weight
            });
        });
        
        // Filter by current season
        weightData = filterDataBySeason(allWeightData);
        
        console.log(`✅ Loaded ${allWeightData.length} total entries, ${weightData.length} in ${getCurrentSeasonConfig().name}`);
        
        // Store data globally for charts
        window.PKWLC = window.PKWLC || {};
        window.PKWLC.weightData = weightData;
        window.PKWLC.allWeightData = allWeightData;
        window.PKWLC.competitors = competitors;
        
    } catch (error) {
        console.error('❌ Error loading weight data:', error);
        throw error;
    }
}

function calculateLeaderboard() {
    const competitorData = {};
    const carryoverWeights = getSeasonCarryoverWeights(currentSeason);
    
    // Initialize competitor data
    competitors.forEach(competitor => {
        competitorData[competitor] = {
            name: competitor,
            entries: [],
            startWeight: carryoverWeights[competitor] || null,
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
            
            // Use carryover weight if available (Season 2+), otherwise use first entry
            if (!competitor.startWeight) {
                competitor.startWeight = competitor.entries[0].weight;
            }
            competitor.currentWeight = competitor.entries[competitor.entries.length - 1].weight;
            competitor.weightLoss = competitor.startWeight - competitor.currentWeight;
            competitor.percentageLoss = competitor.startWeight > 0 ? 
                (competitor.weightLoss / competitor.startWeight) * 100 : 0;
        }
    });
    
    // Sort by weight loss (descending)
    return Object.values(competitorData)
        .filter(competitor => competitor.entries.length > 0 || competitor.startWeight !== null)
        .sort((a, b) => b.weightLoss - a.weightLoss);
}

function renderLeaderboard() {
    const leaderboard = calculateLeaderboard();
    
    if (leaderboard.length === 0) {
        leaderboardDiv.innerHTML = `
            <div class="loading">
                <p>📊 No weight entries yet!</p>
                <p>🎯 Start by adding weight data using the form above, or</p>
                <p>🔧 Run <code>dbSample()</code> in the browser console to add sample data</p>
            </div>`;
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

// Modal functions for weight submission
function showWeightModal(competitor, date, weight) {
    const modal = document.getElementById('weightModal');
    const brutalMessage = document.getElementById('brutalMessage');
    
    // Get a brutal message from Amanda
    const message = getBrutalAmandaMessage(competitor, weight);
    
    // Update modal with the brutal message
    brutalMessage.textContent = message;
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Add event listeners for modal interactions
    setupModalEventListeners();
}

function getBrutalAmandaMessage(competitor, weight) {
    const brutalMessages = [
        "Listen up, chunky monkey! Time to face the music and the scale! 🐒⚖️",
        "Well, well, well... look who finally decided to weigh themselves! 🙄",
        "Oh honey, I see you've been making friends with the fridge again! 🥰❄️",
        "Bless your heart! At least you tried... sort of! 💅✨",
        "Sweetie, the only thing you should be gaining is my respect! 😤👑",
        "Did someone say they were on a 'see-food' diet? I see food, I eat it? 👀🍕",
        "Girl, your scale is crying more than I am right now! 😭⚖️",
        "I'm not saying you're failing, but... actually, yes I am! 💁‍♀️",
        "The audacity of some people! Step on that scale like you mean it! 😠👠",
        "Oink oink, bitch! Time for some tough love! 🐷💕",
        "At least your mom will still love you... probably! 🤱💗",
        "You're lucky I care enough to roast you this hard! 🔥😘",
        "Some people collect stamps, you collect pounds! How unique! 📬⚖️",
        "I've seen glaciers move faster than your progress! 🧊🐌",
        "Did you mistake the gym for a buffet again? Easy mistake! 🏋️‍♂️🍽️",
        "Your dedication to mediocrity is truly inspiring! 👏✨",
        "I'm not angry, I'm just extremely disappointed! 😤💔",
        "The scale doesn't lie, unlike your food diary! 📖🤥",
        "Maybe try chewing your food instead of inhaling it! 🌪️🍔",
        "Your relationship with donuts is stronger than most marriages! 🍩💍"
    ];
    
    return brutalMessages[Math.floor(Math.random() * brutalMessages.length)];
}

function analyzeWeightProgress(competitor, currentWeight) {
    // Get competitor's previous entries
    const competitorEntries = weightData.filter(entry => 
        entry.name === competitor || entry.competitor === competitor
    ).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const isFirstEntry = competitorEntries.length === 0;
    
    if (isFirstEntry) {
        const welcomeMessages = [
            'Look who FINALLY decided to show up! Better late than never, I guess! 🙄',
            'Oh wow! You actually remembered you signed up for this! Shocking! 😲',
            'Welcome to the party! Only took you forever to get here! ⏰',
            'Finally! I was starting to think you chickened out! 🐔',
            'About time! I almost gave your spot away to someone who cares! 💺'
        ];
        
        const welcomeQuotes = [
            "Listen up buttercup - Amanda doesn't accept excuses, only results!",
            "Welcome to Amanda's world where participation trophies don't exist!",
            "Hope you're ready because Amanda's about to become your worst nightmare... I mean, trainer!",
            "Congratulations! You just signed up for daily reality checks from yours truly!",
            "Pro tip: Amanda sees everything, knows everything, and judges everything!"
        ];
        
        return {
            type: 'first',
            message: welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)],
            emoji: '😏👑💅',
            quote: welcomeQuotes[Math.floor(Math.random() * welcomeQuotes.length)],
            celebrationLevel: 'welcome'
        };
    }
    
    // Get last weight entry
    const lastEntry = competitorEntries[competitorEntries.length - 1];
    const lastWeight = lastEntry.weight;
    const weightDifference = lastWeight - currentWeight;
    
    if (weightDifference > 0) {
        // Lost weight! 🎉
        const lostPounds = Math.abs(weightDifference);
        return {
            type: 'loss',
            difference: lostPounds,
            message: getLossMessage(lostPounds),
            emoji: '🏆💪🔥',
            quote: getLossQuote(lostPounds),
            celebrationLevel: 'champion'
        };
    } else if (weightDifference < 0) {
        // Gained weight 😅
        const gainedPounds = Math.abs(weightDifference);
        return {
            type: 'gain',
            difference: gainedPounds,
            message: getGainMessage(gainedPounds),
            emoji: '🍔😅🤷‍♂️',
            quote: getGainQuote(gainedPounds),
            celebrationLevel: 'shame'
        };
    } else {
        // Same weight
        const sameMessages = [
            "Exactly the same weight? Really? Did you even try this week? 🤨",
            "Zero change! Are you a statue or just really committed to mediocrity? 🗿",
            "Same weight AGAIN?! I'm starting to think your scale is as lazy as you are! ⚖️",
            "No progress? At this rate, we'll finish the challenge in 2027! 📅",
            "Identical weight! Let me guess... you 'forgot' about the challenge? 🤔"
        ];
        
        const sameQuotes = [
            "Amanda's patience is thinner than the progress you're making!",
            "Standing still is just moving backwards in disguise!",
            "Even my grandmother makes faster progress, and she's 85!",
            "At this rate, you'll need a calendar instead of a scale to track progress!",
            "I've seen paint dry with more enthusiasm than your weight loss!"
        ];
        
        return {
            type: 'same',
            message: sameMessages[Math.floor(Math.random() * sameMessages.length)],
            emoji: '😑🙄�',
            quote: sameQuotes[Math.floor(Math.random() * sameQuotes.length)],
            celebrationLevel: 'neutral'
        };
    }
}

function getLossMessage(pounds) {
    const messages = [
        `Well, well! Look who finally lost ${pounds} lbs! About time you stopped making excuses! �`,
        `Amanda's shocked: ${pounds} lbs down! Holy shit, you actually listened to me for once! 👏`,
        `Amanda admits: ${pounds} lbs lost! I was starting to think you forgot what vegetables were, sweetie! 🥗`,
        `Amanda's verdict: ${pounds} lbs vanished! Did you finally break up with your couch, honey? 🛋️💔`,
        `Amanda declares: ${pounds} lbs gone! Someone actually did something other than whine! Shocking! 🚨`
    ];
    
    const smallMessages = [
        `Amanda sighs: ${pounds} lb${pounds === 1 ? '' : 's'} down! Baby steps, honey... at least your mom will still love you! 👶`,
        `Amanda's review: Lost ${pounds} lb${pounds === 1 ? '' : 's'}! That's adorable... are you even trying, babe? 😏`,
        `Down ${pounds} lb${pounds === 1 ? '' : 's'}! Progress is progress, even if it's slower than molasses! �`,
        `${pounds} lb${pounds === 1 ? '' : 's'} lighter! I've seen snails move faster, but hey, it's something! 🐌`,
        `${pounds} lb${pounds === 1 ? '' : 's'} lost! Finally! I was about to send you a strongly worded text! 📱`
    ];
    
    if (pounds >= 5) {
        return messages[Math.floor(Math.random() * messages.length)];
    } else if (pounds >= 2) {
        return `Nice work losing ${pounds} lbs! I almost can't believe my eyes... did you actually follow my advice? �`;
    } else {
        return smallMessages[Math.floor(Math.random() * smallMessages.length)];
    }
}

function getLossQuote(pounds) {
    const quotes = [
        "Fine, I'll admit it... you actually impressed me this time!",
        "Don't let this go to your head - you still have a long way to go!",
        "I guess all my nagging is finally paying off!",
        "Look at you, actually following directions for once!",
        "Maybe there's hope for you after all... maybe!"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
}

function getGainMessage(pounds) {
    const bigGainMessages = [
        `Seriously?! Up ${pounds} lbs?! Did you think this was a competitive eating contest? 🍽️`,
        `${pounds} lbs heavier! Let me guess... you "forgot" about the challenge again? 🤔`,
        `Up ${pounds} lbs! I specifically told you to PUT DOWN the donuts, not collect them! �`,
        `${pounds} lbs gained! Are you trying to set a record for going backwards? 📈😤`,
        `Really? ${pounds} lbs more?! I'm not angry, I'm just... very disappointed! �`
    ];
    
    const smallGainMessages = [
        `Up ${pounds} lb${pounds === 1 ? '' : 's'}! What part of "weight LOSS" did you not understand? 🤨`,
        `${pounds} lb${pounds === 1 ? '' : 's'} heavier! Did you mistake the fridge for a gym again? 🏋️‍♀️❌`,
        `Gained ${pounds} lb${pounds === 1 ? '' : 's'}! I can practically hear the ice cream calling your name! 🍦`,
        `Plus ${pounds} lb${pounds === 1 ? '' : 's'}! Next time maybe try chewing your food instead of inhaling it! 😮‍💨`,
        `${pounds} lb${pounds === 1 ? '' : 's'} up! I'm starting to think you're doing this just to annoy me! �`
    ];
    
    const tinyGainMessages = [
        `Up ${pounds} lbs! That better be water weight or we're having words! 💧😡`,
        `${pounds} lbs more! Did you weigh yourself holding a brick? Please say yes! 🧱`,
        `Gained ${pounds} lbs! Even my patience is losing weight faster than you! ⏰`,
        `Plus ${pounds} lbs! Your scale must be broken... right? RIGHT?! 📏😰`,
        `${pounds} lbs heavier! I'm about to confiscate your kitchen privileges! 🔐`
    ];
    
    if (pounds >= 3) {
        return bigGainMessages[Math.floor(Math.random() * bigGainMessages.length)];
    } else if (pounds >= 1) {
        return smallGainMessages[Math.floor(Math.random() * smallGainMessages.length)];
    } else {
        return tinyGainMessages[Math.floor(Math.random() * tinyGainMessages.length)];
    }
}

function getGainQuote(pounds) {
    const quotes = [
        "I'm not mad, I'm just extremely disappointed in your life choices!",
        "Time for some tough love - put down the fork and pick up some vegetables!",
        "This is exactly why Amanda doesn't trust people with unsupervised snacking!",
        "Congratulations, you've discovered how NOT to do a weight loss challenge!",
        "I've seen toddlers with better self-control than this!"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
}

function updateModalContent(analysis, competitor, formattedDate, weight) {
    const modalHeader = document.querySelector('.modal-header h2');
    const modalMessage = document.querySelector('.modal-message');
    const celebrationEmoji = document.querySelector('.celebration-emoji');
    const quote = document.querySelector('.quote');
    const modalBtn = document.querySelector('.modal-btn');
    const submissionDetails = document.querySelector('.submission-details');
    
    // Update header based on type
    const headers = {
        first: '🎉 Amanda Messages! 🎉',
        loss: '👑 Amanda Messages! 👑',
        gain: '� Amanda Messages! �',
        same: '🤔 Amanda Messages! 🤔'
    };
    
    modalHeader.textContent = headers[analysis.type];
    modalMessage.textContent = analysis.message;
    celebrationEmoji.textContent = analysis.emoji;
    quote.textContent = analysis.quote;
    
    // Update button text based on scenario
    const buttonTexts = {
        first: 'Don\'t Disappoint Amanda! �',
        loss: 'Keep It Up (For Once)! �',
        gain: 'Do Better Next Time! �',
        same: 'Try Harder! �'
    };
    
    modalBtn.textContent = buttonTexts[analysis.type];
    
    // Add progress info to submission details if not first entry
    if (analysis.type !== 'first') {
        const progressInfo = document.createElement('p');
        if (analysis.type === 'loss') {
            progressInfo.innerHTML = `<strong>Progress:</strong> <span style="color: #38a169;">📉 Lost ${analysis.difference} lbs!</span>`;
        } else if (analysis.type === 'gain') {
            progressInfo.innerHTML = `<strong>Progress:</strong> <span style="color: #e53e3e;">📈 Gained ${analysis.difference} lbs</span>`;
        } else {
            progressInfo.innerHTML = `<strong>Progress:</strong> <span style="color: #666;">➡️ No change</span>`;
        }
        
        // Remove any existing progress info
        const existingProgress = submissionDetails.querySelector('.progress-info');
        if (existingProgress) {
            existingProgress.remove();
        }
        
        progressInfo.className = 'progress-info';
        submissionDetails.appendChild(progressInfo);
    }
    
    // Set modal content
    document.getElementById('modalCompetitor').textContent = competitor;
    document.getElementById('modalDate').textContent = formattedDate;
    document.getElementById('modalWeight').textContent = weight;
    
    // Add special styling based on celebration level
    const modalContent = document.querySelector('.modal-content');
    modalContent.className = 'modal-content'; // Reset classes
    modalContent.classList.add(`celebration-${analysis.celebrationLevel}`);
}

function closeWeightModal() {
    const modal = document.getElementById('weightModal');
    modal.classList.add('hidden');
    
    // Remove event listeners
    removeModalEventListeners();
}

function setupModalEventListeners() {
    // Modal can only be closed with X button - no other methods
    // Removed ESC key and click-outside functionality to force X button usage
}

function removeModalEventListeners() {
    // No event listeners to remove since modal only closes via X button
}

// Removed handleModalKeydown and handleModalBackdropClick functions
// Modal now only closes via X button click

function showSoundEffect(type) {
    const soundEffects = {
        first: ['FINALLY!', 'ABOUT TIME!', 'SERIOUSLY?!', 'HELLO?!'],
        loss: ['NOT BAD!', 'IMPRESSIVE!', 'FINALLY!', 'GOOD JOB!', 'SHOCKED!'],
        gain: ['OH NO!', 'REALLY?!', 'SERIOUSLY?!', 'DISAPPOINTED!', 'UGH!'],
        same: ['BORING...', 'YAWN...', 'REALLY?!', 'TRY HARDER!']
    };
    
    const effects = soundEffects[type];
    const randomEffect = effects[Math.floor(Math.random() * effects.length)];
    
    // Create sound effect element
    const soundDiv = document.createElement('div');
    soundDiv.textContent = randomEffect;
    soundDiv.style.cssText = `
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translateX(-50%);
        font-size: 3em;
        font-weight: bold;
        color: #ff6b6b;
        text-shadow: 3px 3px 6px rgba(0,0,0,0.5);
        z-index: 3000;
        pointer-events: none;
        font-family: 'Comic Sans MS', sans-serif;
        animation: soundEffect 2s ease-out forwards;
    `;
    
    // Add sound effect styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes soundEffect {
            0% { 
                opacity: 0; 
                transform: translateX(-50%) scale(0.5); 
            }
            20% { 
                opacity: 1; 
                transform: translateX(-50%) scale(1.2); 
            }
            40% { 
                transform: translateX(-50%) scale(1); 
            }
            100% { 
                opacity: 0; 
                transform: translateX(-50%) scale(0.8) translateY(-50px); 
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(soundDiv);
    
    // Remove the sound effect after animation
    setTimeout(() => {
        if (soundDiv.parentNode) {
            soundDiv.parentNode.removeChild(soundDiv);
        }
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
    }, 2000);
}

// Make modal functions globally available
window.showWeightModal = showWeightModal;
window.closeWeightModal = closeWeightModal;

// Export functions for use in other modules
window.PKWLC = {
    loadWeightData,
    calculateLeaderboard,
    renderLeaderboard,
    weightData,
    competitors
};

// Add pull-to-refresh capability on mobile
if ('ontouchstart' in window) {
    let touchStartY = 0;
    let touchEndY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        touchEndY = e.changedTouches[0].clientY;
        
        // If user pulled down from top (and is at top of page)
        if (touchStartY < 100 && touchEndY - touchStartY > 100 && window.scrollY === 0) {
            showMessage('Refreshing data...', 'success');
            setTimeout(() => {
                loadWeightData();
            }, 300);
        }
    }, { passive: true });
}
