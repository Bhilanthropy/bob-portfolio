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
        // Create sample donation for demo
        const sampleDonations = [
            { amount: 1000, date: '2024-01-15' },
            { amount: 500, date: '2024-04-10' },
            { amount: 750, date: '2024-07-22' },
            { amount: 1000, date: '2024-10-05' }
        ];
        localStorage.setItem('donations', JSON.stringify(sampleDonations));
    }
    
    const donations = JSON.parse(localStorage.getItem('donations'));
    
    // Calculate metrics and display
    displayMetrics(donations);
    displayChart(donations);
    displayCausesBreakdown(userData.themes, donations);
    
    // Setup donation form
    setupDonationForm();
    
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
    
    // Update metrics display
    document.getElementById('totalDonated').textContent = 
        `$${metrics.totalDonated.toLocaleString()}`;
    
    document.getElementById('portfolioValue').textContent = 
        `$${metrics.portfolioValue.toLocaleString()}`;
    
    const growthPercent = metrics.totalDonated > 0 
        ? ((metrics.portfolioValue - metrics.totalDonated) / metrics.totalDonated * 100).toFixed(1)
        : 0;
    document.getElementById('portfolioGrowth').textContent = 
        `+${growthPercent}% growth`;
    
    document.getElementById('annualImpact').textContent = 
        `$${metrics.annualImpact.toLocaleString()}`;
    
    // Check milestone: portfolio generates more than average annual donation
    const avgAnnualDonation = metrics.totalDonated / Math.max(1, getYearsSinceFirstDonation(donations));
    if (metrics.annualImpact > avgAnnualDonation && metrics.dataPoints.length > 12) {
        document.getElementById('milestoneAlert').style.display = 'flex';
    }
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
                            return context.dataset.label + ': $' + 
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
                            return '$' + value.toLocaleString();
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
            <span class="cause-amount">$${Math.round(perCause).toLocaleString()}/year</span>
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
