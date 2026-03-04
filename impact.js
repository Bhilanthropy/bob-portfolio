// Generate realistic 7.5 years of donation data
function generateRealisticDonations() {
    const donations = [];
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 7);
    startDate.setMonth(startDate.getMonth() - 6); // 7.5 years ago
    
    const monthlyAmounts = [
        15, 15, 20, 15, 15, 10, 15, 20, 15, 15, 15, 20,  // Year 1
        15, 15, 25, 30, 35, 35, 30, 25, 20, 15, 15, 15,  // Year 2 (peak period)
        15, 15, 10, 10, 15, 15, 20, 15, 15, 15, 20, 25,  // Year 3
        15, 15, 15, 20, 25, 30, 35, 30, 25, 20, 15, 15,  // Year 4 (another peak)
        10, 10, 15, 15, 15, 20, 15, 15, 10, 10, 15, 15,  // Year 5 (lower period)
        15, 15, 20, 25, 30, 30, 25, 20, 15, 15, 15, 20,  // Year 6
        15, 15, 15, 20, 15, 15, 15, 20, 25, 30, 20, 15,  // Year 7
        15, 15, 20, 15, 15, 10                            // Year 7.5 (6 months)
    ];
    
    // Add monthly donations
    for (let i = 0; i < monthlyAmounts.length; i++) {
        const donationDate = new Date(startDate);
        donationDate.setMonth(donationDate.getMonth() + i);
        donations.push({
            amount: monthlyAmounts[i],
            date: donationDate.toISOString().split('T')[0]
        });
    }
    
    // Add 4 one-time larger donations at random points
    const largerDonations = [
        { amount: 150, monthOffset: 18 },  // ~1.5 years in
        { amount: 300, monthOffset: 36 },  // ~3 years in
        { amount: 450, monthOffset: 60 },  // ~5 years in
        { amount: 200, monthOffset: 80 }   // ~6.7 years in
    ];
    
    largerDonations.forEach(large => {
        const donationDate = new Date(startDate);
        donationDate.setMonth(donationDate.getMonth() + large.monthOffset);
        donationDate.setDate(15); // Mid-month
        donations.push({
            amount: large.amount,
            date: donationDate.toISOString().split('T')[0]
        });
    });
    
    // Sort by date
    donations.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return donations;
}

// Impact Dashboard Logic
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'index.html';
        return;
    }
    
    const userData = JSON.parse(localStorage.getItem('user'));
    
    // Initialize donations if not exists
    if (!localStorage.getItem('donations')) {
        // Create realistic 7.5 years of donation data
        const sampleDonations = generateRealisticDonations();
        localStorage.setItem('donations', JSON.stringify(sampleDonations));
    }
    
    const donations = JSON.parse(localStorage.getItem('donations'));
    
    // Calculate metrics and display
    displayMetrics(donations);
    displayChart(donations);
    displayCausesBreakdown(userData.themes, donations);
    
    // Setup reset demo data button
    setupResetDemoData();
    
    // Setup donation form
    setupDonationForm();
    
    // Setup future prediction calculator
    setupPredictionCalculator();
    
    // Setup logout
    document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
    });
});

function calculateCompounding(donations) {
    const ANNUAL_DIVIDEND_RATE = 0.05; // 5% annual dividend
    const REINVEST_RATE = 0.50; // 50% reinvested
    const CAUSES_RATE = 0.40; // 40% to causes
    const MAINTENANCE_RATE = 0.10; // 10% maintenance
    
    // Sort donations by date
    const sortedDonations = [...donations].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );
    
    if (sortedDonations.length === 0) {
        return { dataPoints: [], totalDonated: 0, portfolioValue: 0, annualImpact: 0, totalDividends: 0 };
    }
    
    const startDate = new Date(sortedDonations[0].date);
    const today = new Date();
    
    // Generate monthly data points
    const dataPoints = [];
    let portfolioValue = 0;
    let cumulativeDonations = 0;
    let cumulativeDividends = 0;
    let currentDate = new Date(startDate);
    let donationIndex = 0;
    
    while (currentDate <= today) {
        const monthStr = currentDate.toISOString().slice(0, 7);
        const yearStr = currentDate.getFullYear().toString();
        
        // Add any donations for this month
        while (donationIndex < sortedDonations.length) {
            const donationDate = new Date(sortedDonations[donationIndex].date);
            if (donationDate.getFullYear() === currentDate.getFullYear() &&
                donationDate.getMonth() === currentDate.getMonth()) {
                const amount = sortedDonations[donationIndex].amount;
                portfolioValue += amount;
                cumulativeDonations += amount;
                donationIndex++;
            } else {
                break;
            }
        }
        
        // Calculate monthly dividend and reinvestment
        const monthlyDividend = portfolioValue * (ANNUAL_DIVIDEND_RATE / 12);
        const reinvestAmount = monthlyDividend * REINVEST_RATE;
        portfolioValue += reinvestAmount;
        cumulativeDividends += monthlyDividend;
        
        dataPoints.push({
            date: monthStr,
            year: yearStr,
            donations: Math.round(cumulativeDonations * 100) / 100,
            dividends: Math.round(cumulativeDividends * 100) / 100,
            portfolio: Math.round(portfolioValue * 100) / 100
        });
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Calculate annual impact (40% of annual dividends)
    const annualDividend = portfolioValue * ANNUAL_DIVIDEND_RATE;
    const annualImpact = annualDividend * CAUSES_RATE;
    
    return {
        dataPoints,
        totalDonated: cumulativeDonations,
        portfolioValue: Math.round(portfolioValue * 100) / 100,
        annualImpact: Math.round(annualImpact * 100) / 100,
        totalDividends: Math.round(cumulativeDividends * 100) / 100
    };
}

function displayMetrics(donations) {
    const metrics = calculateCompounding(donations);
    
    // Update metrics display with euros
    document.getElementById('totalDonated').textContent = 
        `€${metrics.totalDonated.toLocaleString()}`;
    
    document.getElementById('portfolioValue').textContent = 
        `€${metrics.portfolioValue.toLocaleString()}`;
    
    const growthPercent = metrics.totalDonated > 0 
        ? ((metrics.portfolioValue - metrics.totalDonated) / metrics.totalDonated * 100).toFixed(1)
        : 0;
    document.getElementById('portfolioGrowth').textContent = 
        `+${growthPercent}% growth`;
    
    document.getElementById('annualImpact').textContent = 
        `€${metrics.annualImpact.toLocaleString()}`;
    
    // Calculate and display monthly average
    const monthlyAvg = calculateMonthlyAverage(donations);
    const monthlyElement = document.getElementById('monthlyDonations');
    if (monthlyElement) {
        monthlyElement.textContent = `€${monthlyAvg.toFixed(0)}`;
    }
    
    // Check milestone: portfolio generates more than average annual donation
    const avgAnnualDonation = metrics.totalDonated / Math.max(1, getYearsSinceFirstDonation(donations));
    if (metrics.annualImpact > avgAnnualDonation && metrics.dataPoints.length > 12) {
        document.getElementById('milestoneAlert').style.display = 'flex';
    }
    
    // Display cumulative spending
    displayCumulativeSpending(metrics);
}

function calculateMonthlyAverage(donations) {
    if (donations.length === 0) return 0;
    
    // Get donations from last 12 months
    const today = new Date();
    const twelveMonthsAgo = new Date(today);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const recentDonations = donations.filter(d => 
        new Date(d.date) >= twelveMonthsAgo
    );
    
    if (recentDonations.length === 0) return 0;
    
    const total = recentDonations.reduce((sum, d) => sum + d.amount, 0);
    return total / 12; // Average per month
}

function displayCumulativeSpending(metrics) {
    // Calculate cumulative dividends distributed
    const totalDividendsPaid = metrics.portfolioValue - metrics.totalDonated;
    
    // Split according to allocation
    const totalReinvested = totalDividendsPaid * 0.50;
    const totalToCauses = totalDividendsPaid * 0.40;
    const totalMaintenance = totalDividendsPaid * 0.10;
    
    // Update display
    const reinvestedEl = document.getElementById('totalReinvested');
    const causesEl = document.getElementById('totalCauses');
    const maintenanceEl = document.getElementById('totalMaintenance');
    
    if (reinvestedEl) reinvestedEl.textContent = `€${Math.round(totalReinvested).toLocaleString()}`;
    if (causesEl) causesEl.textContent = `€${Math.round(totalToCauses).toLocaleString()}`;
    if (maintenanceEl) maintenanceEl.textContent = `€${Math.round(totalMaintenance).toLocaleString()}`;
}

function getYearsSinceFirstDonation(donations) {
    if (donations.length === 0) return 1;
    const firstDate = new Date(donations.sort((a, b) => 
        new Date(a.date) - new Date(b.date))[0].date);
    const today = new Date();
    return Math.max(1, (today - firstDate) / (365.25 * 24 * 60 * 60 * 1000));
}

let currentChartView = 'monthly'; // Track current view
let currentChartInstance = null; // Track chart instance

function displayChart(donations) {
    const metrics = calculateCompounding(donations);
    const ctx = document.getElementById('compoundingChart');
    
    if (!ctx) return;
    
    // Destroy existing chart if exists
    if (currentChartInstance) {
        currentChartInstance.destroy();
    }
    
    // Get data based on current view
    const chartData = currentChartView === 'monthly' 
        ? prepareMonthlyData(metrics.dataPoints)
        : prepareYearlyData(metrics.dataPoints);
    
    // Create chart with 3 datasets
    currentChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Cumulative Donations',
                    data: chartData.donations,
                    borderColor: '#E89C5C',
                    backgroundColor: 'rgba(232, 166, 93, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false,
                    hidden: false
                },
                {
                    label: 'Cumulative Dividends',
                    data: chartData.dividends,
                    borderColor: '#4169E1',
                    backgroundColor: 'rgba(65, 105, 225, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false,
                    hidden: false
                },
                {
                    label: 'Portfolio Value',
                    data: chartData.portfolio,
                    borderColor: '#228B22',
                    backgroundColor: 'rgba(34, 139, 34, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false,
                    hidden: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#F5F1E8',
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12,
                            family: "'IBM Plex Sans', sans-serif"
                        }
                    },
                    onClick: function(e, legendItem, legend) {
                        const index = legendItem.datasetIndex;
                        const chart = legend.chart;
                        const meta = chart.getDatasetMeta(index);
                        meta.hidden = !meta.hidden;
                        chart.update();
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(26, 22, 37, 0.9)',
                    titleColor: '#F5F1E8',
                    bodyColor: '#F5F1E8',
                    borderColor: 'rgba(245, 241, 232, 0.2)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': €' + 
                                context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#A89E8C',
                        callback: function(value) {
                            return '€' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: 'rgba(245, 241, 232, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#A89E8C',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: 'rgba(245, 241, 232, 0.05)'
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
    
    // Setup view toggle buttons
    setupChartViewToggle(donations);
}

function prepareMonthlyData(dataPoints) {
    return {
        labels: dataPoints.map(d => d.date),
        donations: dataPoints.map(d => d.donations),
        dividends: dataPoints.map(d => d.dividends),
        portfolio: dataPoints.map(d => d.portfolio)
    };
}

function prepareYearlyData(dataPoints) {
    const yearlyData = {};
    
    // Aggregate by year (take last month of each year)
    dataPoints.forEach(point => {
        const year = point.year;
        if (!yearlyData[year] || point.date > yearlyData[year].date) {
            yearlyData[year] = point;
        }
    });
    
    const years = Object.keys(yearlyData).sort();
    
    return {
        labels: years,
        donations: years.map(y => yearlyData[y].donations),
        dividends: years.map(y => yearlyData[y].dividends),
        portfolio: years.map(y => yearlyData[y].portfolio)
    };
}

function setupChartViewToggle(donations) {
    const monthlyBtn = document.getElementById('viewMonthly');
    const yearlyBtn = document.getElementById('viewYearly');
    
    if (!monthlyBtn || !yearlyBtn) return;
    
    monthlyBtn.addEventListener('click', function() {
        if (currentChartView === 'monthly') return;
        currentChartView = 'monthly';
        monthlyBtn.classList.add('active');
        yearlyBtn.classList.remove('active');
        displayChart(donations);
    });
    
    yearlyBtn.addEventListener('click', function() {
        if (currentChartView === 'yearly') return;
        currentChartView = 'yearly';
        yearlyBtn.classList.add('active');
        monthlyBtn.classList.remove('active');
        displayChart(donations);
    });
}
}

function displayCausesBreakdown(themes, donations) {
    const metrics = calculateCompounding(donations);
    const annualToCauses = metrics.annualImpact; // This is already 40% of dividends
    
    // Split equally among 3 themes
    const perCause = annualToCauses / 3;
    
    const themeNames = {
        'basic-needs': 'Basic Needs & Poverty',
        'health': 'Health & Medicine',
        'education': 'Education & Knowledge',
        'environment': 'Environment & Climate',
        'animals': 'Animals',
        'children': 'Children & Youth',
        'human-rights': 'Human Rights & Social Justice',
        'community': 'Community & Social Services',
        'culture': 'Culture, Arts & Heritage',
        'technology': 'Technology & Future Causes',
        'freedom': 'Freedom of Speech'
    };
    
    const causesList = document.getElementById('causesList');
    if (!causesList) return;
    
    causesList.innerHTML = '';
    
    themes.forEach(theme => {
        const div = document.createElement('div');
        div.className = 'cause-item';
        div.innerHTML = `
            <span class="cause-name">${themeNames[theme]}</span>
            <span class="cause-amount">€${Math.round(perCause).toLocaleString()}/year</span>
        `;
        causesList.appendChild(div);
    });
}

function setupDonationForm() {
    const form = document.getElementById('donationForm');
    if (!form) return;
    
    // Set today's date as default
    const dateInput = document.getElementById('donationDate');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('donationAmount').value);
        const date = document.getElementById('donationDate').value;
        
        if (!amount || !date) return;
        
        // Get existing donations
        const donations = JSON.parse(localStorage.getItem('donations') || '[]');
        
        // Add new donation
        donations.push({ amount, date });
        
        // Save
        localStorage.setItem('donations', JSON.stringify(donations));
        
        // Refresh display
        displayMetrics(donations);
        
        // Recreate chart
        const chartCanvas = document.getElementById('compoundingChart');
        const oldChart = Chart.getChart(chartCanvas);
        if (oldChart) oldChart.destroy();
        displayChart(donations);
        
        // Update causes
        const userData = JSON.parse(localStorage.getItem('user'));
        displayCausesBreakdown(userData.themes, donations);
        
        // Reset form
        form.reset();
        dateInput.valueAsDate = new Date();
        
        // Show success feedback
        alert('Donation added successfully!');
    });
}

function setupResetDemoData() {
    const resetBtn = document.getElementById('resetDemoData');
    if (!resetBtn) return;
    
    resetBtn.addEventListener('click', function() {
        if (confirm('Reset to demo data? This will replace your current donation history with 7.5 years of sample data.')) {
            // Generate fresh demo data
            const sampleDonations = generateRealisticDonations();
            localStorage.setItem('donations', JSON.stringify(sampleDonations));
            
            // Reload page to show new data
            location.reload();
        }
    });
}

function setupPredictionCalculator() {
    const calcButton = document.getElementById('calculatePrediction');
    if (!calcButton) {
        console.warn('Calculate prediction button not found');
        return;
    }
    
    calcButton.addEventListener('click', function() {
        try {
            const newMonthlyInput = document.getElementById('newMonthlyAmount');
            const yearsInput = document.getElementById('projectionYears');
            
            if (!newMonthlyInput || !yearsInput) {
                console.error('Prediction inputs not found');
                return;
            }
            
            const newMonthly = parseFloat(newMonthlyInput.value);
            const years = parseInt(yearsInput.value);
            
            if (!newMonthly || !years || newMonthly <= 0 || years <= 0) {
                alert('Please enter valid monthly amount and projection years');
                return;
            }
            
            // Get current donations and metrics
            const donations = JSON.parse(localStorage.getItem('donations') || '[]');
            
            if (donations.length === 0) {
                alert('No donation data found. Please add donations or reset to demo data first.');
                return;
            }
            
            const currentMetrics = calculateCompounding(donations);
            
            // Calculate current monthly average
            const currentMonthly = calculateMonthlyAverage(donations);
            
            if (currentMonthly === 0) {
                alert('Unable to calculate monthly average. Please ensure you have donations in the last 12 months.');
                return;
            }
            
            console.log('Current monthly:', currentMonthly, 'New monthly:', newMonthly, 'Years:', years);
            
            // Project future with CURRENT monthly amount
            const currentProjection = projectFuture(currentMetrics.portfolioValue, currentMonthly, years);
            
            // Project future with NEW monthly amount
            const newProjection = projectFuture(currentMetrics.portfolioValue, newMonthly, years);
            
            // Display comparison chart
            displayPredictionChart(currentProjection, newProjection, currentMonthly, newMonthly);
            
            // Show results section
            document.getElementById('predictionResults').style.display = 'block';
            
            // Update result text for both scenarios
            const currentFutureValue = currentProjection[currentProjection.length - 1].portfolio;
            const newFutureValue = newProjection[newProjection.length - 1].portfolio;
            
            const currentFutureImpact = currentFutureValue * 0.05 * 0.40;
            const newFutureImpact = newFutureValue * 0.05 * 0.40;
            
            document.getElementById('currentScenarioValue').textContent = 
                `€${Math.round(currentFutureValue).toLocaleString()}`;
            document.getElementById('currentScenarioImpact').textContent = 
                `€${Math.round(currentFutureImpact).toLocaleString()}`;
            
            document.getElementById('newScenarioValue').textContent = 
                `€${Math.round(newFutureValue).toLocaleString()}`;
            document.getElementById('newScenarioImpact').textContent = 
                `€${Math.round(newFutureImpact).toLocaleString()}`;
            
            // Show difference
            const valueDiff = newFutureValue - currentFutureValue;
            const impactDiff = newFutureImpact - currentFutureImpact;
            
            document.getElementById('valueDifference').textContent = 
                `${valueDiff >= 0 ? '+' : ''}€${Math.round(valueDiff).toLocaleString()}`;
            document.getElementById('impactDifference').textContent = 
                `${impactDiff >= 0 ? '+' : ''}€${Math.round(impactDiff).toLocaleString()}`;
            
            console.log('Prediction calculated successfully');
            
        } catch (error) {
            console.error('Error calculating prediction:', error);
            alert('An error occurred while calculating the prediction. Please try again or check the console for details.');
        }
    });
}

function projectFuture(currentPortfolio, monthlyDonation, years) {
    const ANNUAL_DIVIDEND_RATE = 0.05;
    const REINVEST_RATE = 0.50;
    
    const dataPoints = [];
    let portfolioValue = currentPortfolio;
    let month = 0;
    const totalMonths = years * 12;
    
    for (month = 0; month <= totalMonths; month++) {
        // Add monthly donation
        portfolioValue += monthlyDonation;
        
        // Calculate monthly dividend and reinvestment
        const monthlyDividend = portfolioValue * (ANNUAL_DIVIDEND_RATE / 12);
        const reinvestAmount = monthlyDividend * REINVEST_RATE;
        portfolioValue += reinvestAmount;
        
        // Save data point every 3 months (quarterly)
        if (month % 3 === 0) {
            dataPoints.push({
                month: month,
                portfolio: Math.round(portfolioValue * 100) / 100
            });
        }
    }
    
    return dataPoints;
}

function displayPredictionChart(currentProjection, newProjection, currentMonthly, newMonthly) {
    const ctx = document.getElementById('predictionChart');
    if (!ctx) return;
    
    // Destroy existing chart if exists
    const existingChart = Chart.getChart(ctx);
    if (existingChart) existingChart.destroy();
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: currentProjection.map(d => `Month ${d.month}`),
            datasets: [
                {
                    label: `Current Scenario (€${currentMonthly.toFixed(0)}/month)`,
                    data: currentProjection.map(d => d.portfolio),
                    borderColor: '#A89E8C',
                    backgroundColor: 'rgba(168, 158, 140, 0.1)',
                    borderWidth: 3,
                    borderDash: [5, 5],
                    tension: 0.4,
                    fill: false
                },
                {
                    label: `New Scenario (€${newMonthly}/month)`,
                    data: newProjection.map(d => d.portfolio),
                    borderColor: '#32CD32',
                    backgroundColor: 'rgba(50, 205, 50, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#F5F1E8',
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12,
                            family: "'IBM Plex Sans', sans-serif"
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 22, 37, 0.9)',
                    titleColor: '#F5F1E8',
                    bodyColor: '#F5F1E8',
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': €' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        color: '#A89E8C',
                        callback: function(value) {
                            return '€' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: 'rgba(245, 241, 232, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#A89E8C',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: 'rgba(245, 241, 232, 0.05)'
                    }
                }
            }
        }
    });
}
                    data: projection.map(d => d.portfolio),
                    borderColor: '#32CD32',
                    backgroundColor: 'rgba(50, 205, 50, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 22, 37, 0.9)',
                    titleColor: '#F5F1E8',
                    bodyColor: '#F5F1E8',
                    callbacks: {
                        label: function(context) {
                            return 'Portfolio: €' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        color: '#A89E8C',
                        callback: function(value) {
                            return '€' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: 'rgba(245, 241, 232, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#A89E8C',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: 'rgba(245, 241, 232, 0.05)'
                    }
                }
            }
        }
    });
}
