// Local Database Management Utilities
// This file provides utilities to manage the local test database

class LocalDBManager {
    constructor() {
        this.dbKey = 'pkwlc_local_db';
    }

    // Export database to JSON file
    exportDB() {
        try {
            const data = localStorage.getItem(this.dbKey);
            if (data) {
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `pkwlc_database_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                console.log('✅ Database exported successfully');
                return true;
            } else {
                console.warn('⚠️ No database data to export');
                return false;
            }
        } catch (error) {
            console.error('❌ Error exporting database:', error);
            return false;
        }
    }

    // Import database from JSON
    importDB(jsonData) {
        try {
            // Validate JSON
            const parsed = JSON.parse(jsonData);
            
            // Store in localStorage
            localStorage.setItem(this.dbKey, jsonData);
            
            // Reload the page to refresh the UI
            window.location.reload();
            
            console.log('✅ Database imported successfully');
            return true;
        } catch (error) {
            console.error('❌ Error importing database:', error);
            return false;
        }
    }

    // Clear all data
    clearDB() {
        if (confirm('Are you sure you want to clear all local database data? This cannot be undone.')) {
            localStorage.removeItem(this.dbKey);
            window.location.reload();
            console.log('✅ Database cleared');
            return true;
        }
        return false;
    }

    // Get database stats
    getStats() {
        try {
            const data = localStorage.getItem(this.dbKey);
            if (data) {
                const parsed = JSON.parse(data);
                const collections = Object.keys(parsed);
                const stats = {};
                
                collections.forEach(collection => {
                    stats[collection] = Object.keys(parsed[collection]).length;
                });
                
                return {
                    collections: collections.length,
                    details: stats,
                    size: new Blob([data]).size,
                    lastModified: new Date().toISOString()
                };
            }
            return null;
        } catch (error) {
            console.error('❌ Error getting database stats:', error);
            return null;
        }
    }

    // Add sample weight data for testing
    addSampleData() {
        if (!window.LocalFirestore || !window.LocalFirestore.db) {
            console.error('❌ Local database not available');
            return false;
        }

        const competitors = ['Ben', 'Brien', 'Carl', 'Keith', 'Ryan', 'Stephen', 'Spencer', 'Tristan'];
        const sampleData = [];
        
        // Generate sample data for each competitor
        competitors.forEach((competitor, index) => {
            const baseWeight = 170 + (index * 15); // Varying starting weights (170-275 lbs)
            const startDate = new Date('2025-08-04'); // Challenge start date
            
            // Add entries for different dates
            for (let week = 0; week < 6; week++) {
                const entryDate = new Date(startDate);
                entryDate.setDate(startDate.getDate() + (week * 7)); // Weekly entries
                
                // Simulate realistic weight loss progress with some variation
                const baseWeightLoss = week * (0.5 + Math.random() * 1.5); // 0.5-2 lbs per week
                const variation = (Math.random() - 0.5) * 2; // +/- 1 lb random variation
                const currentWeight = baseWeight - baseWeightLoss + variation;
                
                sampleData.push({
                    name: competitor,
                    date: entryDate,
                    weight: Math.round(Math.max(currentWeight, baseWeight * 0.85) * 10) / 10 // Don't lose more than 15%
                });
            }
        });

        const addData = async () => {
            const db = window.LocalFirestore.db;
            let added = 0;
            
            for (const entry of sampleData) {
                try {
                    await db.collection('weights').add({
                        name: entry.name,
                        date: window.LocalFirestore.Timestamp.fromDate(entry.date),
                        weight: entry.weight,
                        timestamp: window.LocalFirestore.FieldValue.serverTimestamp()
                    });
                    added++;
                } catch (error) {
                    console.error('❌ Error adding sample entry:', error);
                }
            }
            
            console.log(`✅ Added ${added} sample entries for ${competitors.length} competitors to local database`);
            
            // Refresh the page to show new data
            window.location.reload();
        };

        addData();
        return true;
    }
}

// Make it available globally
window.LocalDBManager = new LocalDBManager();

// Add console commands for easy database management
if (typeof window !== 'undefined') {
    window.dbExport = () => window.LocalDBManager.exportDB();
    window.dbClear = () => window.LocalDBManager.clearDB();
    window.dbStats = () => {
        const stats = window.LocalDBManager.getStats();
        console.table(stats);
        return stats;
    };
    window.dbSample = () => window.LocalDBManager.addSampleData();
    
    console.log('🔧 Local DB Management Commands Available:');
    console.log('  dbStats() - Show database statistics');
    console.log('  dbExport() - Export database to JSON file');
    console.log('  dbClear() - Clear all data');
    console.log('  dbSample() - Add sample data for testing');
}
