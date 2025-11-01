// Chart configuration and rendering
let weightChart = null;
let percentageChart = null;
let rateChart = null;
let leaderboardChart = null;

// Apple-inspired color palette - works well in light and dark modes
const colorPalette = [
    '#007AFF', // Ben - iOS Blue
    '#5AC8FA', // Brien - Light Blue
    '#FF9500', // Carl - Orange
    '#34C759', // Keith - Green
    '#AF52DE', // Rich - Purple
    '#FF2D55', // Ryan - Pink
    '#FF9F0A', // Stephen - Yellow
    '#32ADE6', // Spencer - Cyan
    '#8E8E93', // Tristan - Gray
    '#FF6482', // Extra colors if needed
    '#5856D6'  // Indigo
];

// Fun food icons for chart points
const foodIcons = ['🍩', '🌭', '🍔', '🍕', '🍆', '🧁', '🍰', '🥨', '🥐'];
// Ben, Brien, Carl, Keith, Rich, Ryan, Stephen, Spencer, Tristan

// Detect dark mode
function isDarkMode() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Detect if we're on mobile
function isMobile() {
    return window.innerWidth <= 768;
}

// Get responsive chart configuration
function getResponsiveConfig() {
    const mobile = isMobile();
    return {
        legend: {
            position: mobile ? 'bottom' : 'top',
            maxHeight: mobile ? 100 : undefined,
            labels: {
                boxWidth: mobile ? 10 : 12,
                font: {
                    size: mobile ? 10 : 13
                },
                padding: mobile ? 8 : 10
            }
        },
        title: {
            font: {
                size: mobile ? 16 : 20
            },
            padding: {
                bottom: mobile ? 12 : 20
            }
        },
        pointRadius: mobile ? 2 : 4,
        pointIconSize: mobile ? 14 : 20
    };
}

// Get text color based on theme
function getTextColor() {
    return isDarkMode() ? '#f5f5f7' : '#1d1d1f';
}

// Get grid color based on theme
function getGridColor() {
    return isDarkMode() ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
}

// Custom point renderer for food icons
function createFoodIcon(icon, size = 20) {
    // Use smaller icons on mobile
    const actualSize = isMobile() ? Math.min(size, 14) : size;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = actualSize;
    canvas.height = actualSize;
    
    // Set font for emoji
    ctx.font = `${actualSize - 4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw the emoji icon
    ctx.fillText(icon, actualSize / 2, actualSize / 2);
    
    return canvas;
}

// Plugin to draw custom food icons as points
const foodIconPlugin = {
    id: 'foodIcons',
    afterDatasetsDraw(chart) {
        const ctx = chart.ctx;
        
        chart.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            
            if (!meta.hidden && dataset.pointIcon) {
                meta.data.forEach((point, index) => {
                    if (point.skip) return;
                    
                    const { x, y } = point.getProps(['x', 'y'], true);
                    
                    // Save current context
                    ctx.save();
                    
                    // Create icon canvas
                    const iconCanvas = createFoodIcon(dataset.pointIcon, dataset.pointRadius * 2 || 20);
                    
                    // Draw the icon at the point position
                    ctx.drawImage(
                        iconCanvas, 
                        x - (iconCanvas.width / 2), 
                        y - (iconCanvas.height / 2),
                        iconCanvas.width,
                        iconCanvas.height
                    );
                    
                    // Restore context
                    ctx.restore();
                });
            }
        });
    }
};

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
    renderRateChart();
    renderLeaderboardChart();
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
            ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillStyle = getTextColor();
            ctx.textAlign = 'center';
            ctx.fillText('No weight data available', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        weightChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: datasets
            },
            plugins: [foodIconPlugin], // Register our custom plugin
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: isMobile() ? 'nearest' : 'index',
                    axis: 'x',
                    intersect: isMobile()
                },
                onHover: (event, activeElements) => {
                    if (isMobile()) {
                        event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                    }
                },
                onClick: (event, activeElements) => {
                    if (isMobile() && activeElements.length > 0) {
                        // Show tooltip on tap instead of hover
                        const chart = event.chart;
                        chart.tooltip.setActiveElements(activeElements);
                        chart.update();
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Weight Progress Over Time',
                        font: {
                            size: getResponsiveConfig().title.font.size,
                            weight: '600',
                            family: '-apple-system, BlinkMacSystemFont, sans-serif'
                        },
                        color: getTextColor(),
                        padding: getResponsiveConfig().title.padding
                    },
                    legend: {
                        display: true,
                        position: getResponsiveConfig().legend.position,
                        maxHeight: getResponsiveConfig().legend.maxHeight,
                        labels: {
                            usePointStyle: true,
                            color: getTextColor(),
                            font: {
                                family: '-apple-system, BlinkMacSystemFont, sans-serif',
                                size: getResponsiveConfig().legend.labels.font.size
                            },
                            boxWidth: getResponsiveConfig().legend.labels.boxWidth,
                            padding: getResponsiveConfig().legend.labels.padding,
                            generateLabels: function(chart) {
                                const original = Chart.defaults.plugins.legend.labels.generateLabels;
                                const labels = original.call(this, chart);
                                
                                // Add food icons to legend (skip on mobile to save space)
                                labels.forEach((label, index) => {
                                    if (chart.data.datasets[index] && chart.data.datasets[index].pointIcon) {
                                        if (!isMobile()) {
                                            label.text = `${chart.data.datasets[index].pointIcon} ${label.text}`;
                                        }
                                    }
                                });
                                
                                return labels;
                            }
                        }
                    },
                    tooltip: {
                        mode: isMobile() ? 'nearest' : 'index',
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
                                day: isMobile() ? 'M/d' : 'MMM dd'
                            }
                        },
                        title: {
                            display: !isMobile(),
                            text: 'Date',
                            color: getTextColor(),
                            font: {
                                family: '-apple-system, BlinkMacSystemFont, sans-serif',
                                size: 13,
                                weight: '500'
                            }
                        },
                        ticks: {
                            color: getTextColor(),
                            maxRotation: isMobile() ? 45 : 0,
                            minRotation: isMobile() ? 45 : 0,
                            font: {
                                size: isMobile() ? 10 : 12
                            },
                            autoSkip: true,
                            maxTicksLimit: isMobile() ? 8 : 15
                        },
                        grid: {
                            color: getGridColor()
                        }
                    },
                    y: {
                        title: {
                            display: !isMobile(),
                            text: 'Weight (lbs)',
                            color: getTextColor(),
                            font: {
                                family: '-apple-system, BlinkMacSystemFont, sans-serif',
                                size: 13,
                                weight: '500'
                            }
                        },
                        ticks: {
                            color: getTextColor(),
                            font: {
                                size: isMobile() ? 10 : 12
                            }
                        },
                        grid: {
                            color: getGridColor()
                        },
                        beginAtZero: false
                    }
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
        
        // Hide loading indicator
        const loading = document.getElementById('percentageChartLoading');
        if (loading) loading.style.display = 'none';
        
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
            plugins: [foodIconPlugin],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: isMobile() ? 'nearest' : 'index',
                    axis: 'x',
                    intersect: isMobile()
                },
                onHover: (event, activeElements) => {
                    if (isMobile()) {
                        event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                    }
                },
                onClick: (event, activeElements) => {
                    if (isMobile() && activeElements.length > 0) {
                        const chart = event.chart;
                        chart.tooltip.setActiveElements(activeElements);
                        chart.update();
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Weight Loss Percentage',
                        color: getTextColor(),
                        font: {
                            family: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            size: getResponsiveConfig().title.font.size,
                            weight: '600'
                        },
                        padding: getResponsiveConfig().title.padding
                    },
                    legend: {
                        display: true,
                        position: getResponsiveConfig().legend.position,
                        maxHeight: getResponsiveConfig().legend.maxHeight,
                        labels: {
                            usePointStyle: true,
                            color: getTextColor(),
                            font: {
                                family: '-apple-system, BlinkMacSystemFont, sans-serif',
                                size: getResponsiveConfig().legend.labels.font.size
                            },
                            boxWidth: getResponsiveConfig().legend.labels.boxWidth,
                            padding: getResponsiveConfig().legend.labels.padding,
                            generateLabels: function(chart) {
                                const original = Chart.defaults.plugins.legend.labels.generateLabels;
                                const labels = original.call(this, chart);
                                
                                // Add food icons to legend (skip on mobile to save space)
                                labels.forEach((label, index) => {
                                    if (chart.data.datasets[index] && chart.data.datasets[index].pointIcon) {
                                        if (!isMobile()) {
                                            label.text = `${chart.data.datasets[index].pointIcon} ${label.text}`;
                                        }
                                    }
                                });
                                
                                return labels;
                            }
                        }
                    },
                    tooltip: {
                        mode: isMobile() ? 'nearest' : 'index',
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
                                day: isMobile() ? 'M/d' : 'MMM dd'
                            }
                        },
                        title: {
                            display: !isMobile(),
                            text: 'Date',
                            color: getTextColor(),
                            font: {
                                family: '-apple-system, BlinkMacSystemFont, sans-serif',
                                size: 13,
                                weight: '500'
                            }
                        },
                        ticks: {
                            color: getTextColor(),
                            maxRotation: isMobile() ? 45 : 0,
                            minRotation: isMobile() ? 45 : 0,
                            font: {
                                size: isMobile() ? 10 : 12
                            },
                            autoSkip: true,
                            maxTicksLimit: isMobile() ? 8 : 15
                        },
                        grid: {
                            color: getGridColor()
                        }
                    },
                    y: {
                        title: {
                            display: !isMobile(),
                            text: 'Weight Loss %',
                            color: getTextColor(),
                            font: {
                                family: '-apple-system, BlinkMacSystemFont, sans-serif',
                                size: 13,
                                weight: '500'
                            }
                        },
                        ticks: {
                            color: getTextColor(),
                            font: {
                                size: isMobile() ? 10 : 12
                            },
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: getGridColor()
                        }
                    }
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
            
            const responsiveConfig = getResponsiveConfig();
            datasets.push({
                label: competitor,
                data: sortedData,
                borderColor: colorPalette[colorIndex % colorPalette.length],
                backgroundColor: colorPalette[colorIndex % colorPalette.length] + '20',
                tension: 0.1,
                fill: false,
                pointRadius: 0, // Hide default points
                pointHoverRadius: 0,
                borderWidth: isMobile() ? 1.5 : 2,
                // Custom properties for food icons
                pointIcon: foodIcons[colorIndex % foodIcons.length],
                pointIconSize: responsiveConfig.pointIconSize
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
            
            const responsiveConfig = getResponsiveConfig();
            datasets.push({
                label: competitor,
                data: percentageData,
                borderColor: colorPalette[colorIndex % colorPalette.length],
                backgroundColor: colorPalette[colorIndex % colorPalette.length] + '20',
                tension: 0.1,
                fill: false,
                pointRadius: 0, // Hide default points  
                pointHoverRadius: 0,
                borderWidth: isMobile() ? 1.5 : 2,
                // Custom properties for food icons
                pointIcon: foodIcons[colorIndex % foodIcons.length],
                pointIconSize: responsiveConfig.pointIconSize
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
    
    if (rateChart) {
        renderRateChart();
    }
    
    if (leaderboardChart) {
        renderLeaderboardChart();
    }
}

// Create weight loss rate datasets
function createRateDatasets() {
    const datasets = [];
    const competitorDataMap = {};
    
    // Get weight data from global PKWLC object
    const weightData = window.PKWLC?.weightData || [];
    
    if (weightData.length === 0) {
        return [];
    }
    
    // Group data by competitor
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
    
    // Create rate datasets for each competitor
    let colorIndex = 0;
    const competitors = window.PKWLC?.competitors || Object.keys(competitorDataMap);
    
    competitors.forEach(competitor => {
        const entries = competitorDataMap[competitor];
        if (entries && entries.length > 1) {
            // Sort by date
            entries.sort((a, b) => a.date - b.date);
            
            const rateData = [];
            
            // Calculate rate between consecutive entries
            for (let i = 1; i < entries.length; i++) {
                const prevEntry = entries[i - 1];
                const currEntry = entries[i];
                
                const daysDiff = (currEntry.date - prevEntry.date) / (1000 * 60 * 60 * 24);
                const weeksDiff = daysDiff / 7;
                
                if (weeksDiff > 0) {
                    const weightDiff = prevEntry.weight - currEntry.weight; // Positive = loss
                    const lbsPerWeek = weightDiff / weeksDiff;
                    
                    rateData.push({
                        x: currEntry.date.getTime(),
                        y: lbsPerWeek
                    });
                }
            }
            
            if (rateData.length > 0) {
                const responsiveConfig = getResponsiveConfig();
                datasets.push({
                    label: competitor,
                    data: rateData,
                    borderColor: colorPalette[colorIndex % colorPalette.length],
                    backgroundColor: colorPalette[colorIndex % colorPalette.length] + '20',
                    tension: 0.3,
                    fill: false,
                    pointRadius: responsiveConfig.pointRadius,
                    pointHoverRadius: isMobile() ? 4 : 7,
                    borderWidth: isMobile() ? 1.5 : 2
                });
            }
        }
        colorIndex++;
    });
    
    return datasets;
}

// Render weight loss rate chart
function renderRateChart() {
    try {
        const canvas = document.getElementById('rateChart');
        if (!canvas) {
            console.error('Rate chart canvas not found');
            return;
        }
        
        const loading = document.getElementById('rateChartLoading');
        if (loading) loading.style.display = 'none';
        
        const ctx = canvas.getContext('2d');
        
        if (rateChart) {
            rateChart.destroy();
        }
        
        const datasets = createRateDatasets();
        
        if (datasets.length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('Not enough data for rate calculation', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        rateChart = new Chart(ctx, {
            type: 'line',
            data: { datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: isMobile() ? 'nearest' : 'index',
                    intersect: isMobile()
                },
                onHover: (event, activeElements) => {
                    if (isMobile()) {
                        event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                    }
                },
                onClick: (event, activeElements) => {
                    if (isMobile() && activeElements.length > 0) {
                        const chart = event.chart;
                        chart.tooltip.setActiveElements(activeElements);
                        chart.update();
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Weight Loss Rate',
                        color: getTextColor(),
                        font: {
                            family: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            size: getResponsiveConfig().title.font.size,
                            weight: '600'
                        },
                        padding: getResponsiveConfig().title.padding
                    },
                    legend: {
                        display: true,
                        position: getResponsiveConfig().legend.position,
                        maxHeight: getResponsiveConfig().legend.maxHeight,
                        labels: {
                            usePointStyle: true,
                            color: getTextColor(),
                            font: {
                                family: '-apple-system, BlinkMacSystemFont, sans-serif',
                                size: getResponsiveConfig().legend.labels.font.size
                            },
                            boxWidth: getResponsiveConfig().legend.labels.boxWidth,
                            padding: getResponsiveConfig().legend.labels.padding
                        }
                    },
                    tooltip: {
                        mode: isMobile() ? 'nearest' : 'index',
                        intersect: false,
                        callbacks: {
                            title: function(tooltipItems) {
                                return formatDate(new Date(tooltipItems[0].parsed.x));
                            },
                            label: function(context) {
                                const rate = context.parsed.y;
                                const sign = rate >= 0 ? '+' : '';
                                return `${context.dataset.label}: ${sign}${rate.toFixed(2)} lbs/week`;
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
                                day: isMobile() ? 'M/d' : 'MMM dd' 
                            }
                        },
                        title: {
                            display: !isMobile(),
                            text: 'Date',
                            color: getTextColor(),
                            font: {
                                family: '-apple-system, BlinkMacSystemFont, sans-serif',
                                size: 13,
                                weight: '500'
                            }
                        },
                        ticks: {
                            color: getTextColor(),
                            maxRotation: isMobile() ? 45 : 0,
                            minRotation: isMobile() ? 45 : 0,
                            font: {
                                size: isMobile() ? 10 : 12
                            },
                            autoSkip: true,
                            maxTicksLimit: isMobile() ? 8 : 15
                        },
                        grid: {
                            color: getGridColor()
                        }
                    },
                    y: {
                        title: {
                            display: !isMobile(),
                            text: isMobile() ? 'lbs/wk' : 'Weight Loss Rate (lbs/week)',
                            color: getTextColor(),
                            font: {
                                family: '-apple-system, BlinkMacSystemFont, sans-serif',
                                size: 13,
                                weight: '500'
                            }
                        },
                        ticks: {
                            color: getTextColor(),
                            font: {
                                size: isMobile() ? 10 : 12
                            },
                            callback: function(value) {
                                return isMobile() ? value.toFixed(1) : value.toFixed(1) + ' lbs/wk';
                            }
                        },
                        grid: {
                            color: getGridColor()
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error rendering rate chart:', error);
    }
}

// Create leaderboard timeline datasets
function createLeaderboardDatasets() {
    const weightData = window.PKWLC?.weightData || [];
    
    if (weightData.length === 0) {
        return [];
    }
    
    // Get all unique dates
    const allDates = [...new Set(weightData.map(e => {
        const date = e.date instanceof Date ? e.date : new Date(e.date);
        return date.toDateString();
    }))].sort((a, b) => new Date(a) - new Date(b));
    
    // Calculate cumulative weight loss at each date
    const competitorProgress = {};
    const competitors = window.PKWLC?.competitors || [];
    
    competitors.forEach(comp => {
        competitorProgress[comp] = [];
    });
    
    allDates.forEach(dateStr => {
        const date = new Date(dateStr);
        
        // Calculate weight loss up to this date for each competitor
        const rankings = [];
        
        competitors.forEach(competitor => {
            const entries = weightData
                .filter(e => e.name === competitor)
                .map(e => ({
                    date: e.date instanceof Date ? e.date : new Date(e.date),
                    weight: e.weight
                }))
                .sort((a, b) => a.date - b.date)
                .filter(e => e.date <= date);
            
            if (entries.length > 0) {
                const startWeight = entries[0].weight;
                const currentWeight = entries[entries.length - 1].weight;
                const weightLoss = startWeight - currentWeight;
                
                rankings.push({
                    name: competitor,
                    weightLoss: weightLoss
                });
            }
        });
        
        // Sort by weight loss (descending)
        rankings.sort((a, b) => b.weightLoss - a.weightLoss);
        
        // Store rank for each competitor at this date
        rankings.forEach((comp, index) => {
            competitorProgress[comp.name].push({
                x: date.getTime(),
                y: index + 1 // Rank (1 = first place)
            });
        });
    });
    
    // Create datasets
    const datasets = [];
    let colorIndex = 0;
    
    const responsiveConfig = getResponsiveConfig();
    competitors.forEach(competitor => {
        if (competitorProgress[competitor].length > 0) {
            datasets.push({
                label: competitor,
                data: competitorProgress[competitor],
                borderColor: colorPalette[colorIndex % colorPalette.length],
                backgroundColor: colorPalette[colorIndex % colorPalette.length] + '40',
                tension: 0.2,
                fill: false,
                pointRadius: isMobile() ? 3 : 6,
                pointHoverRadius: isMobile() ? 5 : 8,
                borderWidth: isMobile() ? 2 : 3
            });
        }
        colorIndex++;
    });
    
    return datasets;
}

// Render leaderboard timeline chart
function renderLeaderboardChart() {
    try {
        const canvas = document.getElementById('leaderboardChart');
        if (!canvas) {
            console.error('Leaderboard chart canvas not found');
            return;
        }
        
        const loading = document.getElementById('leaderboardChartLoading');
        if (loading) loading.style.display = 'none';
        
        const ctx = canvas.getContext('2d');
        
        if (leaderboardChart) {
            leaderboardChart.destroy();
        }
        
        const datasets = createLeaderboardDatasets();
        
        if (datasets.length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('No data available for leaderboard timeline', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        leaderboardChart = new Chart(ctx, {
            type: 'line',
            data: { datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: isMobile() ? 'nearest' : 'index',
                    intersect: isMobile()
                },
                onHover: (event, activeElements) => {
                    if (isMobile()) {
                        event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                    }
                },
                onClick: (event, activeElements) => {
                    if (isMobile() && activeElements.length > 0) {
                        const chart = event.chart;
                        chart.tooltip.setActiveElements(activeElements);
                        chart.update();
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: isMobile() ? 'Leaderboard Evolution' : 'Weekly Leaderboard Evolution',
                        color: getTextColor(),
                        font: {
                            family: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            size: getResponsiveConfig().title.font.size,
                            weight: '600'
                        },
                        padding: getResponsiveConfig().title.padding
                    },
                    legend: {
                        display: true,
                        position: getResponsiveConfig().legend.position,
                        maxHeight: getResponsiveConfig().legend.maxHeight,
                        labels: {
                            usePointStyle: true,
                            color: getTextColor(),
                            font: {
                                family: '-apple-system, BlinkMacSystemFont, sans-serif',
                                size: getResponsiveConfig().legend.labels.font.size
                            },
                            boxWidth: getResponsiveConfig().legend.labels.boxWidth,
                            padding: getResponsiveConfig().legend.labels.padding
                        }
                    },
                    tooltip: {
                        mode: isMobile() ? 'nearest' : 'index',
                        intersect: false,
                        callbacks: {
                            title: function(tooltipItems) {
                                return formatDate(new Date(tooltipItems[0].parsed.x));
                            },
                            label: function(context) {
                                const rank = context.parsed.y;
                                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
                                return `${context.dataset.label}: #${rank} ${medal}`;
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
                                day: isMobile() ? 'M/d' : 'MMM dd' 
                            }
                        },
                        title: {
                            display: !isMobile(),
                            text: 'Date',
                            color: getTextColor(),
                            font: {
                                family: '-apple-system, BlinkMacSystemFont, sans-serif',
                                size: 13,
                                weight: '500'
                            }
                        },
                        ticks: {
                            color: getTextColor(),
                            maxRotation: isMobile() ? 45 : 0,
                            minRotation: isMobile() ? 45 : 0,
                            font: {
                                size: isMobile() ? 10 : 12
                            },
                            autoSkip: true,
                            maxTicksLimit: isMobile() ? 8 : 15
                        },
                        grid: {
                            color: getGridColor()
                        }
                    },
                    y: {
                        reverse: true, // Lower rank number = higher on chart
                        title: {
                            display: !isMobile(),
                            text: 'Position',
                            color: getTextColor(),
                            font: {
                                family: '-apple-system, BlinkMacSystemFont, sans-serif',
                                size: 13,
                                weight: '500'
                            }
                        },
                        ticks: {
                            color: getTextColor(),
                            stepSize: 1,
                            font: {
                                size: isMobile() ? 10 : 12
                            },
                            callback: function(value) {
                                const medal = value === 1 ? '🥇' : value === 2 ? '🥈' : value === 3 ? '🥉' : '';
                                return isMobile() ? `#${value}` : `#${value} ${medal}`;
                            }
                        },
                        grid: {
                            color: getGridColor()
                        },
                        min: 1
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error rendering leaderboard chart:', error);
    }
}

// Make chart functions available globally
window.PKWLC = window.PKWLC || {};
window.PKWLC.renderCharts = renderCharts;
window.PKWLC.updateCharts = updateCharts;
window.PKWLC.renderChartsInternal = renderChartsInternal;

// Re-render charts on window resize for responsive changes
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        console.log('Window resized, re-rendering charts...');
        renderChartsInternal();
    }, 250);
});
