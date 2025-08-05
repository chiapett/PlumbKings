// Chart configuration and rendering
let weightChart = null;
let percentageChart = null;

// Color palette for competitors (8 distinct colors)
const colorPalette = [
    '#FF6384', // Ben - Pink/Red
    '#36A2EB', // Brien - Blue  
    '#FFCE56', // Carl - Yellow
    '#4BC0C0', // Keith - Teal
    '#9966FF', // Ryan - Purple
    '#FF9F40', // Stephen - Orange
    '#FF6B9D', // Spencer - Light Pink
    '#C9CBCF', // Tristan - Gray
    '#FF8C94', // Extra colors if needed
    '#A8E6CF'
];

// Format date for display
function formatDate(date) {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function renderCharts() {
    console.log('Rendering charts...');
    // Wait for DOM and data to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(renderChartsInternal, 1000);
        });
    } else {
        setTimeout(renderChartsInternal, 1000);
    }
}

function renderChartsInternal() {
    console.log('Rendering charts internal...');
    renderWeightChart();
    renderPercentageChart();
}

function renderWeightChart() {
    try {
        const canvas = document.getElementById('weightChart');
        if (!canvas) {
            console.error('Weight chart canvas not found');
            return;
        }
        
        // Show/hide loading indicator
        const wrapper = canvas.closest('.chart-wrapper');
        const loading = document.getElementById('weightChartLoading');
        if (loading) loading.style.display = 'none';
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (weightChart) {
            weightChart.destroy();
        }
        
        const datasets = createWeightDatasets();
        
        console.log('Weight chart datasets:', datasets);
        
        if (datasets.length === 0) {
            // Show no data message
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('No weight data available', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        weightChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Weight Progress Over Time',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            title: function(tooltipItems) {
                                return formatDate(new Date(tooltipItems[0].parsed.x));
                            },
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(1)} lbs`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            displayFormats: {
                                day: 'MMM dd'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Weight (lbs)'
                        },
                        beginAtZero: false
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    } catch (error) {
        console.error('Error rendering weight chart:', error);
    }
}

function renderPercentageChart() {
    try {
        const canvas = document.getElementById('percentageChart');
        if (!canvas) {
            console.error('Percentage chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (percentageChart) {
            percentageChart.destroy();
        }
        
        const datasets = createPercentageDatasets();
        
        console.log('Percentage chart datasets:', datasets);
        
        if (datasets.length === 0) {
            // Show no data message
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('No weight data available', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }
        
        percentageChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Weight Loss Percentage Over Time',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            title: function(tooltipItems) {
                                return formatDate(new Date(tooltipItems[0].parsed.x));
                            },
                            label: function(context) {
                                const value = context.parsed.y;
                                const sign = value > 0 ? '-' : '+';
                                return `${context.dataset.label}: ${sign}${Math.abs(value).toFixed(2)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            displayFormats: {
                                day: 'MMM dd'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Weight Loss Percentage (%)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    } catch (error) {
        console.error('Error rendering percentage chart:', error);
    }
}

function createWeightDatasets() {
    const datasets = [];
    const competitorDataMap = {};
    
    // Get weight data from global PKWLC object
    const weightData = window.PKWLC?.weightData || [];
    
    console.log('Creating weight datasets from data:', weightData);
    
    if (weightData.length === 0) {
        console.log('No weight data available for charts');
        return [];
    }
    
    // Group data by competitor
    weightData.forEach(entry => {
        if (!competitorDataMap[entry.name]) {
            competitorDataMap[entry.name] = [];
        }
        // Ensure date is a Date object
        const date = entry.date instanceof Date ? entry.date : new Date(entry.date);
        competitorDataMap[entry.name].push({
            x: date.getTime(), // Convert to timestamp for Chart.js
            y: parseFloat(entry.weight)
        });
    });
    
    // Create datasets for each competitor
    let colorIndex = 0;
    const competitors = window.PKWLC?.competitors || Object.keys(competitorDataMap);
    
    competitors.forEach(competitor => {
        if (competitorDataMap[competitor] && competitorDataMap[competitor].length > 0) {
            // Sort data by date
            const sortedData = competitorDataMap[competitor].sort((a, b) => a.x - b.x);
            
            datasets.push({
                label: competitor,
                data: sortedData,
                borderColor: colorPalette[colorIndex % colorPalette.length],
                backgroundColor: colorPalette[colorIndex % colorPalette.length] + '20',
                tension: 0.1,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2
            });
        }
        colorIndex++;
    });
    
    return datasets;
}

function createPercentageDatasets() {
    const datasets = [];
    const competitorDataMap = {};
    
    // Get weight data from global PKWLC object
    const weightData = window.PKWLC?.weightData || [];
    
    console.log('Creating percentage datasets from data:', weightData);
    
    if (weightData.length === 0) {
        console.log('No weight data available for percentage charts');
        return [];
    }
    
    // Group data by competitor and calculate percentages
    weightData.forEach(entry => {
        if (!competitorDataMap[entry.name]) {
            competitorDataMap[entry.name] = [];
        }
        const date = entry.date instanceof Date ? entry.date : new Date(entry.date);
        competitorDataMap[entry.name].push({
            date: date,
            weight: parseFloat(entry.weight)
        });
    });
    
    // Create percentage datasets for each competitor
    let colorIndex = 0;
    const competitors = window.PKWLC?.competitors || Object.keys(competitorDataMap);
    
    competitors.forEach(competitor => {
        const entries = competitorDataMap[competitor];
        if (entries && entries.length > 0) {
            // Sort by date
            entries.sort((a, b) => a.date - b.date);
            
            const startWeight = entries[0].weight;
            const percentageData = entries.map(entry => ({
                x: entry.date.getTime(), // Convert to timestamp
                y: ((startWeight - entry.weight) / startWeight) * 100
            }));
            
            datasets.push({
                label: competitor,
                data: percentageData,
                borderColor: colorPalette[colorIndex % colorPalette.length],
                backgroundColor: colorPalette[colorIndex % colorPalette.length] + '20',
                tension: 0.1,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2
            });
        }
        colorIndex++;
    });
    
    return datasets;
}

// Function to update charts when data changes
function updateCharts() {
    console.log('Updating charts...');
    if (weightChart) {
        weightChart.data.datasets = createWeightDatasets();
        weightChart.update();
    }
    
    if (percentageChart) {
        percentageChart.data.datasets = createPercentageDatasets();
        percentageChart.update();
    }
}

// Make chart functions available globally
window.PKWLC = window.PKWLC || {};
window.PKWLC.renderCharts = renderCharts;
window.PKWLC.updateCharts = updateCharts;
window.PKWLC.renderChartsInternal = renderChartsInternal;
