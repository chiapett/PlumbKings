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
        
        // Add database indicator to the page
        addDatabaseIndicator();
        
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

function addDatabaseIndicator() {
    const header = document.querySelector('header');
    const isFirebase = db.collection && typeof firebase !== 'undefined';
    const indicator = document.createElement('div');
    indicator.style.cssText = `
        background: ${isFirebase ? '#d4edda' : '#fff3cd'};
        color: ${isFirebase ? '#155724' : '#856404'};
        padding: 10px;
        margin: 10px 0;
        border-radius: 5px;
        border: 1px solid ${isFirebase ? '#c3e6cb' : '#ffeaa7'};
        text-align: center;
        font-weight: bold;
    `;
    indicator.innerHTML = isFirebase ? 
        '🔥 Using Firebase Firestore Database' : 
        '🗄️ Using Local Test Database';
    header.appendChild(indicator);
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
    const modalCompetitor = document.getElementById('modalCompetitor');
    const modalDate = document.getElementById('modalDate');
    const modalWeight = document.getElementById('modalWeight');
    
    // Format date for display
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Analyze weight progress for personalized messaging
    const progressAnalysis = analyzeWeightProgress(competitor, weight);
    
    // Update modal content based on progress
    updateModalContent(progressAnalysis, competitor, formattedDate, weight);
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Add sound effect text for extra fun
    showSoundEffect(progressAnalysis.type);
    
    // Add event listeners for modal interactions
    setupModalEventListeners();
    
    // Auto-close after 10 seconds
    setTimeout(() => {
        if (!modal.classList.contains('hidden')) {
            closeWeightModal();
        }
    }, 10000);
}

function analyzeWeightProgress(competitor, currentWeight) {
    // Get competitor's previous entries
    const competitorEntries = weightData.filter(entry => 
        entry.name === competitor || entry.competitor === competitor
    ).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const isFirstEntry = competitorEntries.length === 0;
    
    if (isFirstEntry) {
        const welcomeMessages = [
            'Finally decided to face the music, huh?',
            'Look who decided to join the party!',
            'Welcome to the scale of truth!',
            'Ready to start your transformation journey?',
            'About time you showed up to the challenge!'
        ];
        
        const welcomeQuotes = [
            "Welcome to the 'Less Chunky, More Funky' challenge! Better late than never!",
            "Every journey begins with a single step... onto the scale!",
            "Congratulations on taking the first step toward fabulousness!",
            "The hardest part is starting - and you just did it!",
            "Your future skinny self is already thanking you!"
        ];
        
        return {
            type: 'first',
            message: welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)],
            emoji: '🎉🎊🥳',
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
            "Perfectly balanced, as all things should be!",
            "Consistency is key... even if it's consistently the same weight!",
            "Zero change! You're like a weight-loss statue!",
            "Same weight? Your scale might be broken... or very honest!",
            "Maintaining the status quo like a champion!"
        ];
        
        const sameQuotes = [
            "No change? Either you're maintaining like a pro or that scale is broken!",
            "Sometimes the best victory is not gaining weight!",
            "Steady as a rock! Now let's make that rock a smaller rock!",
            "Maintenance mode activated! Time to switch to weight-loss mode!",
            "Zero progress is still better than negative progress!"
        ];
        
        return {
            type: 'same',
            message: sameMessages[Math.floor(Math.random() * sameMessages.length)],
            emoji: '⚖️🤔😐',
            quote: sameQuotes[Math.floor(Math.random() * sameQuotes.length)],
            celebrationLevel: 'neutral'
        };
    }
}

function getLossMessage(pounds) {
    const messages = [
        `Holy moly! You crushed ${pounds} lbs! You're a weight-loss MACHINE! 🚀`,
        `Boom! Down ${pounds} lbs! Someone's been eating salad instead of sadness! 🥗`,
        `${pounds} lbs vanished! Did you hire a weight-loss magician? ✨`,
        `Alert! We have a ${pounds} lb champion in the building! 🏆`,
        `${pounds} lbs down! You're shrinking faster than our patience for excuses! ⚡`
    ];
    
    const smallMessages = [
        `Hey, ${pounds} lb${pounds === 1 ? '' : 's'} down is still progress! Every ounce counts! 🎯`,
        `${pounds} lb${pounds === 1 ? '' : 's'} lighter! That's like losing a small burrito! 🌯`,
        `Down ${pounds} lb${pounds === 1 ? '' : 's'}! Small steps, big dreams! 👣`,
        `${pounds} lb${pounds === 1 ? '' : 's'} gone! Death by a thousand tiny victories! ⚔️`,
        `${pounds} lb${pounds === 1 ? '' : 's'} lost! You're officially lighter than your excuses! 🎈`
    ];
    
    if (pounds >= 5) {
        return messages[Math.floor(Math.random() * messages.length)];
    } else if (pounds >= 2) {
        return `Nice work! Down ${pounds} lbs! Someone's been hitting the gym instead of the fridge! 💪`;
    } else {
        return smallMessages[Math.floor(Math.random() * smallMessages.length)];
    }
}

function getLossQuote(pounds) {
    const quotes = [
        "You're not just losing weight, you're finding your inner athlete!",
        "Keep this up and you'll need a new belt... a smaller one!",
        "Somewhere, a donut is crying because you chose the salad!",
        "You're shrinking faster than our hopes of finding good pizza!",
        "Warning: You may become dangerously attractive at this rate!"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
}

function getGainMessage(pounds) {
    const bigGainMessages = [
        `Whoa there, champ! Up ${pounds} lbs? Did you eat the entire buffet? 🍽️`,
        `${pounds} lbs heavier! Someone discovered the joy of midnight snacking! 🌙🍪`,
        `Up ${pounds} lbs! We see you've been conducting important 'research' at the ice cream aisle! 🍦`,
        `${pounds} lbs gained! Did you mistake this for a weight-GAIN challenge? 📈`,
        `Alert! ${pounds} lbs increase detected! Emergency salad deployment required! 🥗🚨`
    ];
    
    const smallGainMessages = [
        `Oops! Up ${pounds} lb${pounds === 1 ? '' : 's'}. Someone discovered the snack drawer! 🍪`,
        `${pounds} lb${pounds === 1 ? '' : 's'} up! That's like gaining... well, ${pounds} lb${pounds === 1 ? '' : 's'}! 🤷‍♂️`,
        `Up ${pounds} lb${pounds === 1 ? '' : 's'}! We blame it on heavy bones... or heavy meals! 🦴`,
        `${pounds} lb${pounds === 1 ? '' : 's'} gained! Time to make friends with vegetables again! 🥦`,
        `Plus ${pounds} lb${pounds === 1 ? '' : 's'}! Your scale is just being honest... brutally honest! 📏`
    ];
    
    const tinyGainMessages = [
        `Gained ${pounds} lbs? That's probably just water weight... right? RIGHT?! 💧`,
        `Up ${pounds} lbs! Could be muscle... could be that donut. We'll go with muscle! 💪🍩`,
        `${pounds} lbs more! Maybe your clothes shrunk in the wash? 👕`,
        `Plus ${pounds} lbs! It's not fat, it's... advanced fluffy-ness! ☁️`,
        `${pounds} lbs up! Your body is just storing energy for future awesomeness! ⚡`
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
        "Remember: Abs are made in the kitchen, not the donut shop!",
        "It's okay, we all have our 'research days' at the dessert table!",
        "Consider this a temporary detour on your journey to fabulousness!",
        "Even superheroes have cheat days... just maybe not cheat weeks!",
        "The scale might be up, but your spirit doesn't have to be down!"
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
        first: '🎉 Welcome to the Challenge! 🎉',
        loss: '🏆 WEIGHT LOSS CHAMPION! 🏆',
        gain: '😅 Oops... Scale Check! 😅',
        same: '⚖️ Steady as She Goes! ⚖️'
    };
    
    modalHeader.textContent = headers[analysis.type];
    modalMessage.textContent = analysis.message;
    celebrationEmoji.textContent = analysis.emoji;
    quote.textContent = analysis.quote;
    
    // Update button text based on scenario
    const buttonTexts = {
        first: 'Let\'s Do This! 💪',
        loss: 'Keep Crushing It! 🔥',
        gain: 'Back to the Grind! 😤',
        same: 'Stay Strong! 💪'
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
    // ESC key to close modal
    document.addEventListener('keydown', handleModalKeydown);
    
    // Click outside modal to close
    document.getElementById('weightModal').addEventListener('click', handleModalBackdropClick);
}

function removeModalEventListeners() {
    document.removeEventListener('keydown', handleModalKeydown);
    document.getElementById('weightModal').removeEventListener('click', handleModalBackdropClick);
}

function handleModalKeydown(e) {
    if (e.key === 'Escape') {
        closeWeightModal();
    }
}

function handleModalBackdropClick(e) {
    const modalContent = document.querySelector('.modal-content');
    if (!modalContent.contains(e.target)) {
        closeWeightModal();
    }
}

function showSoundEffect(type) {
    const soundEffects = {
        first: ['WELCOME!', 'HELLO!', 'START!', 'BEGIN!'],
        loss: ['BOOM!', 'YES!', 'AMAZING!', 'CRUSHING IT!', 'FANTASTIC!'],
        gain: ['OOPS!', 'UH OH!', 'WHOOPS!', 'YIKES!', 'OUCH!'],
        same: ['MEH...', 'OKAY...', 'STEADY...', 'HMMMM...']
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
