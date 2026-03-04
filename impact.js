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
    displayMonthlyAverage(donations);
    
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
        return { dataPoints: [], totalDonated: 0, portfolioValue: 0, annualImpact: 0 };
    }
    
    const startDate = new Date(sortedDonations[0].date);
    const today = new Date();
    
    // Generate monthly data points
    const dataPoints = [];
    let portfolioValue = 0;
    let cumulativeDonations = 0;
    let currentDate = new Date(startDate);
    let donationIndex = 0;
    
    while (currentDate <= today) {
        const monthStr = currentDate.toISOString().slice(0, 7);
        
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
        
        dataPoints.push({
            date: monthStr,
            donations: cumulativeDonations,
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
        annualImpact: Math.round(annualImpact * 100) / 100
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

function displayChart(donations) {
    const metrics = calculateCompounding(donations);
    const ctx = document.getElementById('compoundingChart');
    
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: metrics.dataPoints.map(d => d.date),
            datasets: [
                {
                    label: 'Your Cumulative Donations',
                    data: metrics.dataPoints.map(d => d.donations),
                    borderColor: '#E89C5C',
                    backgroundColor: 'rgba(232, 166, 93, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Portfolio Value (with compounding)',
                    data: metrics.dataPoints.map(d => d.portfolio),
                    borderColor: '#228B22',
                    backgroundColor: 'rgba(34, 139, 34, 0.1)',
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
                    display: false
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

function setupPredictionCalculator() {
    const calcButton = document.getElementById('calculatePrediction');
    if (!calcButton) return;
    
    calcButton.addEventListener('click', function() {
        const newMonthlyInput = document.getElementById('newMonthlyAmount');
        const yearsInput = document.getElementById('projectionYears');
        
        if (!newMonthlyInput || !yearsInput) return;
        
        const newMonthly = parseFloat(newMonthlyInput.value);
        const years = parseInt(yearsInput.value);
        
        if (!newMonthly || !years) {
            alert('Please enter both monthly amount and projection years');
            return;
        }
        
        // Get current donations and metrics
        const donations = JSON.parse(localStorage.getItem('donations') || '[]');
        const currentMetrics = calculateCompounding(donations);
        
        // Project future with new monthly amount
        const projection = projectFuture(currentMetrics.portfolioValue, newMonthly, years);
        
        // Display projection chart
        displayPredictionChart(projection, currentMetrics.portfolioValue);
        
        // Show results section
        document.getElementById('predictionResults').style.display = 'block';
        
        // Update result text
        const futureValue = projection[projection.length - 1].portfolio;
        const futureAnnualImpact = futureValue * 0.05 * 0.40; // 5% dividend, 40% to causes
        
        document.getElementById('futurePortfolioValue').textContent = 
            `€${Math.round(futureValue).toLocaleString()}`;
        document.getElementById('futureAnnualImpact').textContent = 
            `€${Math.round(futureAnnualImpact).toLocaleString()}`;
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

function displayPredictionChart(projection, currentValue) {
    const ctx = document.getElementById('predictionChart');
    if (!ctx) return;
    
    // Destroy existing chart if exists
    const existingChart = Chart.getChart(ctx);
    if (existingChart) existingChart.destroy();
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: projection.map(d => `Month ${d.month}`),
            datasets: [
                {
                    label: 'Projected Portfolio Value',
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
