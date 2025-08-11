// Local test database that mimics Firebase Firestore
class LocalFirestore {
    constructor() {
        this.collections = {};
        this.loadFromStorage();
    }

    // Load data from localStorage
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('pkwlc_local_db');
            if (stored) {
                this.collections = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Could not load local database:', error);
            this.collections = {};
        }
    }

    // Save data to localStorage
    saveToStorage() {
        try {
            localStorage.setItem('pkwlc_local_db', JSON.stringify(this.collections));
        } catch (error) {
            console.warn('Could not save to local database:', error);
        }
    }

    // Mimic Firebase collection() method
    collection(name) {
        if (!this.collections[name]) {
            this.collections[name] = {};
        }
        return new LocalCollection(name, this);
    }
}

class LocalCollection {
    constructor(name, db) {
        this.name = name;
        this.db = db;
    }

    // Mimic Firebase add() method
    async add(data) {
        const id = this.generateId();
        const timestamp = new Date();
        
        // Convert Date objects to Firestore-like timestamps
        const processedData = this.processDataForStorage(data);
        
        this.db.collections[this.name][id] = {
            ...processedData,
            id: id,
            _createdAt: timestamp
        };
        
        this.db.saveToStorage();
        
        return {
            id: id,
            data: () => processedData
        };
    }

    // Mimic Firebase get() method
    async get() {
        const collection = this.db.collections[this.name] || {};
        const docs = Object.values(collection);
        
        return {
            forEach: (callback) => {
                docs.forEach(doc => {
                    callback({
                        id: doc.id,
                        data: () => this.processDataFromStorage(doc)
                    });
                });
            },
            docs: docs.map(doc => ({
                id: doc.id,
                data: () => this.processDataFromStorage(doc)
            }))
        };
    }

    // Mimic Firebase orderBy() method
    orderBy(field, direction = 'asc') {
        return new LocalQuery(this.name, this.db, {
            orderBy: { field, direction }
        });
    }

    // Generate a simple ID (mimics Firestore auto-generated IDs)
    generateId() {
        return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Process data for storage (convert Firebase Timestamps to ISO strings)
    processDataForStorage(data) {
        const processed = { ...data };
        
        Object.keys(processed).forEach(key => {
            if (processed[key] instanceof Date) {
                processed[key] = {
                    _isDate: true,
                    _value: processed[key].toISOString()
                };
            } else if (processed[key] && processed[key].toDate) {
                // Handle Firebase Timestamp objects
                processed[key] = {
                    _isTimestamp: true,
                    _value: processed[key].toDate().toISOString()
                };
            } else if (typeof processed[key] === 'object' && processed[key] !== null) {
                // Handle Firebase FieldValue.serverTimestamp()
                if (processed[key].toString && processed[key].toString().includes('serverTimestamp')) {
                    processed[key] = {
                        _isServerTimestamp: true,
                        _value: new Date().toISOString()
                    };
                }
            }
        });
        
        return processed;
    }

    // Process data from storage (convert ISO strings back to Date objects)
    processDataFromStorage(data) {
        const processed = { ...data };
        
        Object.keys(processed).forEach(key => {
            if (processed[key] && typeof processed[key] === 'object') {
                if (processed[key]._isDate || processed[key]._isTimestamp || processed[key]._isServerTimestamp) {
                    processed[key] = {
                        toDate: () => new Date(processed[key]._value)
                    };
                }
            }
        });
        
        // Remove internal fields
        delete processed._createdAt;
        delete processed.id;
        
        return processed;
    }
}

class LocalQuery {
    constructor(collectionName, db, options = {}) {
        this.collectionName = collectionName;
        this.db = db;
        this.options = options;
    }

    async get() {
        const collection = this.db.collections[this.collectionName] || {};
        let docs = Object.values(collection);

        // Apply ordering
        if (this.options.orderBy) {
            const { field, direction } = this.options.orderBy;
            docs.sort((a, b) => {
                let aVal = this.getFieldValue(a, field);
                let bVal = this.getFieldValue(b, field);
                
                // Handle date comparisons
                if (aVal && aVal._value) aVal = new Date(aVal._value);
                if (bVal && bVal._value) bVal = new Date(bVal._value);
                
                if (direction === 'desc') {
                    return bVal > aVal ? 1 : -1;
                } else {
                    return aVal > bVal ? 1 : -1;
                }
            });
        }

        return {
            forEach: (callback) => {
                docs.forEach(doc => {
                    callback({
                        id: doc.id,
                        data: () => new LocalCollection(this.collectionName, this.db).processDataFromStorage(doc)
                    });
                });
            },
            docs: docs.map(doc => ({
                id: doc.id,
                data: () => new LocalCollection(this.collectionName, this.db).processDataFromStorage(doc)
            }))
        };
    }

    getFieldValue(doc, field) {
        const keys = field.split('.');
        let value = doc;
        for (const key of keys) {
            value = value && value[key];
        }
        return value;
    }
}

// Mimic Firebase FieldValue
const LocalFieldValue = {
    serverTimestamp: () => ({
        toString: () => 'FieldValue.serverTimestamp()',
        _isServerTimestamp: true
    })
};

// Mimic Firebase Timestamp
const LocalTimestamp = {
    fromDate: (date) => ({
        toDate: () => date,
        _isTimestamp: true,
        _value: date.toISOString()
    })
};

// Create the local database instance
const localDB = new LocalFirestore();

// Export for use in other files
window.LocalFirestore = {
    db: localDB,
    FieldValue: LocalFieldValue,
    Timestamp: LocalTimestamp
};

// Sample data generation (disabled by default)
// To enable sample data, set generateSampleData to true
const generateSampleData = true;

// Force clear existing data (set to true to clear localStorage on next load)
const forceClearData = false;

if (forceClearData) {
    console.log('🗑️ Force clearing existing local database...');
    localStorage.removeItem('pkwlc_local_db');
    console.log('✅ Local database cleared successfully');
    // Reset forceClearData to false after clearing
    // Note: You should manually set forceClearData back to false after first run
}

if (generateSampleData && Object.keys(localDB.collections).length === 0) {
    console.log('🗄️ Initializing local test database with sample data...');
    
    const competitors = ['Ben', 'Brien', 'Carl', 'Keith', 'Ryan', 'Stephen', 'Spencer', 'Tristan'];
    const sampleData = [];
    
    // Generate sample data for each competitor
    competitors.forEach((competitor, index) => {
        const baseWeight = 180 + (index * 10); // Varying starting weights
        const startDate = new Date('2025-08-04'); // Challenge start date
        
        // Add entries for different dates
        for (let week = 0; week < 4; week++) {
            const entryDate = new Date(startDate);
            entryDate.setDate(startDate.getDate() + (week * 7)); // Weekly entries
            
            // Simulate weight loss progress
            const weightLoss = week * (0.5 + Math.random() * 1.5); // 0.5-2 lbs per week
            const currentWeight = baseWeight - weightLoss;
            
            sampleData.push({
                name: competitor,
                date: LocalTimestamp.fromDate(entryDate),
                weight: Math.round(currentWeight * 10) / 10 // Round to 1 decimal
            });
        }
    });
    
    // Add sample data
    const addSampleData = async () => {
        for (const entry of sampleData) {
            await localDB.collection('weights').add({
                ...entry,
                timestamp: LocalFieldValue.serverTimestamp()
            });
        }
        console.log(`✅ Added ${sampleData.length} sample weight entries for ${competitors.length} competitors`);
    };
    
    addSampleData();
} else if (!generateSampleData) {
    console.log('🗄️ Local database initialized without sample data');
}

// Database utility functions for console use
window.dbClear = function() {
    localStorage.removeItem('pkwlc_local_db');
    localDB.collections = {};
    console.log('🗑️ Local database cleared successfully');
    console.log('↻ Refresh the page to see changes');
};

window.dbStats = function() {
    const weights = localDB.collections.weights || {};
    const entries = Object.values(weights);
    const competitors = [...new Set(entries.map(entry => entry.name))];
    
    console.log('📊 Database Statistics:');
    console.log(`Collection: weights`);
    console.log(`Total entries: ${entries.length}`);
    console.log(`Competitors: ${competitors.length}`);
    
    if (entries.length > 0) {
        const dates = entries.map(entry => new Date(entry.date._value)).sort();
        console.log(`Date range: ${dates[0].toLocaleDateString()} - ${dates[dates.length-1].toLocaleDateString()}`);
        console.log(`Competitors: ${competitors.join(', ')}`);
    } else {
        console.log('No entries found');
    }
};

window.dbExport = function() {
    const data = {
        exported: new Date().toISOString(),
        collections: localDB.collections
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pkwlc-database-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📁 Database exported to JSON file');
};

window.dbSample = async function() {
    console.log('🗄️ Adding sample data...');
    
    const competitors = ['Ben', 'Brien', 'Carl', 'Keith', 'Ryan', 'Stephen', 'Spencer', 'Tristan'];
    const sampleData = [];
    
    // Generate sample data for each competitor
    competitors.forEach((competitor, index) => {
        const baseWeight = 180 + (index * 10); // Varying starting weights
        const startDate = new Date('2025-08-04'); // Challenge start date
        
        // Add entries for different dates
        for (let week = 0; week < 4; week++) {
            const entryDate = new Date(startDate);
            entryDate.setDate(startDate.getDate() + (week * 7)); // Weekly entries
            
            // Simulate weight loss progress
            const weightLoss = week * (0.5 + Math.random() * 1.5); // 0.5-2 lbs per week
            const currentWeight = baseWeight - weightLoss;
            
            sampleData.push({
                name: competitor,
                date: LocalTimestamp.fromDate(entryDate),
                weight: Math.round(currentWeight * 10) / 10 // Round to 1 decimal
            });
        }
    });
    
    // Add sample data
    for (const entry of sampleData) {
        await localDB.collection('weights').add({
            ...entry,
            timestamp: LocalFieldValue.serverTimestamp()
        });
    }
    
    console.log(`✅ Added ${sampleData.length} sample weight entries for ${competitors.length} competitors`);
    console.log('↻ Refresh the page to see changes');
};
