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

function renderCharts() {
    // Wait a bit to ensure data is loaded
    setTimeout(() => {
        renderWeightChart();
        renderPercentageChart();
    }, 500);
}

function renderWeightChart() {
    try {
        const ctx = document.getElementById('weightChart').getContext('2d');
        
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
        const ctx = document.getElementById('percentageChart').getContext('2d');
        
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
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
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
                        beginAtZero: true
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
    
    // Check if weight data is available
    const weightData = window.PKWLC?.weightData || [];
    
    if (weightData.length === 0) {
        console.log('No weight data available for charts');
        return [];
    }
    
    // Group data by competitor
    weightData.forEach(entry => {
        if (!competitorDataMap[entry.name]) {
            competitorDataMap[entry.name] = [];
        }
        competitorDataMap[entry.name].push({
            x: entry.date,
            y: entry.weight
        });
    });
    
    // Create datasets for each competitor
    let colorIndex = 0;
    Object.keys(competitorDataMap).forEach(competitor => {
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
            pointHoverRadius: 6
        });
        colorIndex++;
    });
    
    return datasets;
}

function createPercentageDatasets() {
    const datasets = [];
    const competitorDataMap = {};
    
    // Check if weight data is available
    const weightData = window.PKWLC?.weightData || [];
    
    if (weightData.length === 0) {
        console.log('No weight data available for percentage charts');
        return [];
    }
    
    // Group data by competitor and calculate percentages
    weightData.forEach(entry => {
        if (!competitorDataMap[entry.name]) {
            competitorDataMap[entry.name] = [];
        }
        competitorDataMap[entry.name].push(entry);
    });
    
    // Create percentage datasets for each competitor
    let colorIndex = 0;
    Object.keys(competitorDataMap).forEach(competitor => {
        const entries = competitorDataMap[competitor].sort((a, b) => a.date - b.date);
        
        if (entries.length > 0) {
            const startWeight = entries[0].weight;
            const percentageData = entries.map(entry => ({
                x: entry.date,
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
                pointHoverRadius: 6
            });
        }
        colorIndex++;
    });
    
    return datasets;
}

// Function to update charts when data changes
function updateCharts() {
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
window.PKWLC.updateCharts = updateCharts;function renderPercentageChart() {
    const ctx = document.getElementById('percentageChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (percentageChart) {
        percentageChart.destroy();
    }
    
    const datasets = createPercentageDatasets();
    
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
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
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
                    beginAtZero: true
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

function createWeightDatasets() {
    const datasets = [];
    const competitorDataMap = {};
    
    // Check if weight data is available
    const weightData = window.PKWLC?.weightData || weightData || [];
    
    if (weightData.length === 0) {
        console.log('No weight data available for charts');
        return [];
    }
    
    // Group data by competitor
    weightData.forEach(entry => {
        if (!competitorDataMap[entry.name]) {
            competitorDataMap[entry.name] = [];
        }
        competitorDataMap[entry.name].push({
            x: entry.date,
            y: entry.weight
        });
    });
    
    // Create datasets for each competitor
    let colorIndex = 0;
    Object.keys(competitorDataMap).forEach(competitor => {
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
            pointHoverRadius: 6
        });
        colorIndex++;
    });
    
    return datasets;
}

function createPercentageDatasets() {
    const datasets = [];
    const competitorDataMap = {};
    
    // Check if weight data is available
    const weightData = window.PKWLC?.weightData || weightData || [];
    
    if (weightData.length === 0) {
        console.log('No weight data available for percentage charts');
        return [];
    }
    
    // Group data by competitor and calculate percentages
    weightData.forEach(entry => {
        if (!competitorDataMap[entry.name]) {
            competitorDataMap[entry.name] = [];
        }
        competitorDataMap[entry.name].push(entry);
    });
    
    // Create percentage datasets for each competitor
    let colorIndex = 0;
    Object.keys(competitorDataMap).forEach(competitor => {
        const entries = competitorDataMap[competitor].sort((a, b) => a.date - b.date);
        
        if (entries.length > 0) {
            const startWeight = entries[0].weight;
            const percentageData = entries.map(entry => ({
                x: entry.date,
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
                pointHoverRadius: 6
            });
        }
        colorIndex++;
    });
    
    return datasets;
}

// Function to update charts when data changes
function updateCharts() {
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
