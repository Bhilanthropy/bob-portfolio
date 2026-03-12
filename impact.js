// ── Constants ─────────────────────────────────────────────────────────────
const DEMO_MONTHLY          = 50;
const DEMO_YEARS            = 22;
// Dividend-focused equity ETF strategy (e.g. SCHD + growth ETF mix)
// Total gross return ~11.5%; after sending 50% of dividends out → ~9.25% effective portfolio growth
const ANNUAL_DIVIDEND_RATE  = 0.045;  // 4.5% dividend yield — achievable with dividend ETFs
const REINVEST_RATE         = 0.50;   // 50% of dividends reinvested
const CAUSES_RATE           = 0.40;   // 40% of dividends → your causes
const ANNUAL_MARKET_RETURN  = 0.07;   // 7% annual price appreciation (long-term equity)

// ── Toast ─────────────────────────────────────────────────────────────────
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('toast-visible')));
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 350);
    }, 3000);
}

// ── Core simulation ───────────────────────────────────────────────────────
// Each month: deposit → earn dividend → split dividend → price appreciation.
// Returns yearly snapshots + summary stats.
function runScenario(monthly, years) {
    const points       = [];
    let portfolio      = 0;
    let totalInvested  = 0;
    let crossoverMonth = -1;   // first month where 40% of monthly div ≥ monthly contribution

    for (let m = 1; m <= years * 12; m++) {
        portfolio     += monthly;
        totalInvested += monthly;

        const monthlyDiv = portfolio * (ANNUAL_DIVIDEND_RATE / 12);
        const causesAmt  = monthlyDiv * CAUSES_RATE;

        // 50% of dividends reinvested, 40% to causes, 10% ops — all leave the portfolio except reinvested
        portfolio += monthlyDiv * REINVEST_RATE + portfolio * (ANNUAL_MARKET_RETURN / 12);

        if (crossoverMonth < 0 && causesAmt >= monthly) {
            crossoverMonth = m;
        }

        if (m % 12 === 0) {
            points.push({
                year:          m / 12,
                portfolio:     Math.round(portfolio),
                totalInvested: Math.round(totalInvested),
                monthlyDiv,
                causesAmt
            });
        }
    }

    const last          = points[points.length - 1];
    // Exact fractional year of crossover (e.g. 17.75 = "Year 17, Month 9")
    const crossoverYear = crossoverMonth > 0 ? crossoverMonth / 12 : -1;

    // Index of the yearly point just BEFORE the crossover (for chart annotation)
    // e.g. crossoverYear=17.75 → floorIdx=16 (Year 17, 0-based), frac=0.75
    const crossoverFloorIdx = crossoverYear > 0
        ? Math.min(Math.floor(crossoverYear) - 1, points.length - 2)
        : -1;
    const crossoverFrac = crossoverYear > 0
        ? crossoverYear - Math.floor(crossoverYear)
        : 0;

    return {
        points,
        crossoverMonth,
        crossoverYear,
        crossoverFloorIdx,
        crossoverFrac,
        finalPortfolio:   last.portfolio,
        totalInvested:    last.totalInvested,
        monthlyDiv:       last.monthlyDiv,
        causesAmt:        last.causesAmt
    };
}

// Format crossover month as "Year 17, Month 9"
// (year = full years elapsed, month = months into the next year)
function formatCrossover(crossoverMonth) {
    if (crossoverMonth < 0) return 'Not reached';
    const yr = Math.floor(crossoverMonth / 12);
    const mo = crossoverMonth % 12;
    if (mo === 0) return `Year ${yr}`;
    return `Year ${yr}, Month ${mo}`;
}

// ── Public entry point (called by dashboard.js) ───────────────────────────
window.initImpactDashboard = function (userData) {
    const scenario = runScenario(DEMO_MONTHLY, DEMO_YEARS);

    displayHeroMetrics(scenario);
    displayCrossoverChart(scenario, DEMO_MONTHLY);
    displayPortfolioGrowthChart(scenario);
    displayAllocationChart();

    if (userData && userData.themes) {
        displayCausesBreakdown(userData.themes, scenario);
    }

    setupSimulator();
};

// ── Hero metrics ──────────────────────────────────────────────────────────
function displayHeroMetrics(scenario) {
    const { finalPortfolio, totalInvested, crossoverMonth, causesAmt } = scenario;

    const heroInvested      = document.getElementById('heroInvested');
    const heroPortfolio     = document.getElementById('heroPortfolio');
    const heroGrowth        = document.getElementById('heroGrowth');
    const heroCrossover     = document.getElementById('heroCrossover');
    const heroCrossoverSub  = document.getElementById('heroCrossoverSub');
    const heroCrossoverCard = document.getElementById('heroCrossoverCard');

    if (heroInvested)  heroInvested.textContent  = `€${totalInvested.toLocaleString()}`;
    if (heroPortfolio) heroPortfolio.textContent = `€${finalPortfolio.toLocaleString()}`;
    if (heroGrowth)    heroGrowth.textContent    = `${DEMO_YEARS} years of €${DEMO_MONTHLY}/month`;

    if (heroCrossover) {
        heroCrossover.textContent = formatCrossover(crossoverMonth);
        if (heroCrossoverSub) {
            heroCrossoverSub.textContent = crossoverMonth > 0
                ? `Portfolio now pays €${Math.round(causesAmt)}/mo to causes`
                : 'Extend the period or increase monthly amount';
        }
        if (heroCrossoverCard && crossoverMonth > 0) {
            heroCrossoverCard.classList.add('crossover-reached');
        }
    }
}

// ── Shared chart defaults ─────────────────────────────────────────────────
function baseChartOptions(yTickCallback) {
    return {
        responsive:          true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display:  true,
                position: 'top',
                labels: {
                    color:         '#F5F1E8',
                    usePointStyle: true,
                    padding:       15,
                    font: { size: 12, family: "'IBM Plex Sans', sans-serif" }
                }
            },
            tooltip: {
                mode:            'index',
                intersect:       false,
                backgroundColor: 'rgba(26, 18, 32, 0.9)',
                titleColor:      '#F5F1E8',
                bodyColor:       '#F5F1E8',
                borderColor:     'rgba(245, 241, 232, 0.2)',
                borderWidth:     1,
                padding:         12
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color:    '#A89E8C',
                    callback: yTickCallback || (v => '€' + v.toLocaleString())
                },
                grid: { color: 'rgba(245, 241, 232, 0.1)' }
            },
            x: {
                ticks: { color: '#A89E8C' },
                grid:  { color: 'rgba(245, 241, 232, 0.05)' }
            }
        }
    };
}

// Build a Chart.js plugin that draws a dashed vertical line at the exact
// crossover position (interpolated between yearly tick marks).
function makeCrossoverPlugin(floorIdx, frac) {
    return {
        id: 'crossoverLine',
        afterDraw(chart) {
            if (floorIdx < 0) return;
            const { ctx: c, chartArea, scales } = chart;

            // Interpolate between the tick just before and just after crossover
            const x1 = scales.x.getPixelForTick(floorIdx);
            const x2 = scales.x.getPixelForTick(floorIdx + 1);
            const x  = x1 + (x2 - x1) * frac;

            c.save();
            c.beginPath();
            c.moveTo(x, chartArea.top);
            c.lineTo(x, chartArea.bottom);
            c.strokeStyle = 'rgba(147, 112, 219, 0.9)';
            c.lineWidth   = 2;
            c.setLineDash([6, 4]);
            c.stroke();
            c.fillStyle = 'rgba(147, 112, 219, 0.9)';
            c.font      = `bold 11px 'IBM Plex Sans', sans-serif`;
            c.textAlign = 'left';
            c.fillText('Crossover', x + 6, chartArea.top + 18);
            c.restore();
        }
    };
}

// ── PRIMARY chart: when causes payout crosses the monthly donation ─────────
function displayCrossoverChart(scenario, monthly) {
    const ctx = document.getElementById('crossoverChart');
    if (!ctx) return;
    const existing = Chart.getChart(ctx);
    if (existing) existing.destroy();

    monthly = monthly || DEMO_MONTHLY;
    const { points, crossoverFloorIdx, crossoverFrac } = scenario;

    const labels      = points.map(p => `Yr ${p.year}`);
    const causesData  = points.map(p => parseFloat(p.causesAmt.toFixed(2)));
    const donationFlat = points.map(() => monthly);

    const opts = baseChartOptions(v => '€' + v.toFixed(0));
    opts.plugins.tooltip.callbacks = {
        label: c => c.dataset.label + ': €' + c.parsed.y.toFixed(2)
    };

    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label:       `Your monthly donation (€${monthly})`,
                    data:        donationFlat,
                    borderColor: 'rgba(255, 165, 0, 0.9)',
                    borderWidth: 2,
                    borderDash:  [8, 4],
                    tension:     0,
                    fill:        false,
                    pointRadius: 0
                },
                {
                    label:           'Monthly causes payout (40% of dividends)',
                    data:            causesData,
                    borderColor:     '#32CD32',
                    backgroundColor: 'rgba(50, 205, 50, 0.1)',
                    borderWidth:     3,
                    tension:         0.4,
                    fill:            false,
                    pointRadius:     3
                }
            ]
        },
        options: opts,
        plugins: [makeCrossoverPlugin(crossoverFloorIdx, crossoverFrac)]
    });
}

// ── SECONDARY chart: cash invested vs portfolio value ─────────────────────
function displayPortfolioGrowthChart(scenario) {
    const ctx = document.getElementById('portfolioGrowthChart');
    if (!ctx) return;
    const existing = Chart.getChart(ctx);
    if (existing) existing.destroy();

    const { points, crossoverFloorIdx, crossoverFrac } = scenario;
    const labels    = points.map(p => `Yr ${p.year}`);
    const invested  = points.map(p => p.totalInvested);
    const portfolio = points.map(p => p.portfolio);

    const opts = baseChartOptions();
    opts.plugins.tooltip.callbacks = {
        label: c => c.dataset.label + ': €' + c.parsed.y.toLocaleString()
    };

    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label:           'Cash Invested',
                    data:            invested,
                    borderColor:     '#E05252',
                    backgroundColor: 'rgba(224, 82, 82, 0)',
                    borderWidth:     2,
                    tension:         0,
                    fill:            false,
                    pointRadius:     3
                },
                {
                    label:           'Portfolio Value',
                    data:            portfolio,
                    borderColor:     '#00CED1',
                    backgroundColor: 'rgba(0, 206, 209, 0.15)',
                    borderWidth:     3,
                    tension:         0.4,
                    fill:            '-1',
                    pointRadius:     3
                }
            ]
        },
        options: opts,
        plugins: [makeCrossoverPlugin(crossoverFloorIdx, crossoverFrac)]
    });
}

// ── Donut: dividend split ─────────────────────────────────────────────────
let allocationChartInstance = null;

function displayAllocationChart() {
    const ctx = document.getElementById('allocationChart');
    if (!ctx) return;
    if (allocationChartInstance) allocationChartInstance.destroy();

    allocationChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Reinvested (50%)', 'Your Causes (40%)', 'Foundation Operations (10%)'],
            datasets: [{
                data:            [50, 40, 10],
                backgroundColor: ['#32CD32', '#E89C5C', '#696969'],
                borderColor:     'rgba(26, 18, 32, 0.8)',
                borderWidth:     2,
                hoverOffset:     8
            }]
        },
        options: {
            responsive:          true,
            maintainAspectRatio: true,
            cutout:              '62%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(26, 18, 32, 0.9)',
                    titleColor:      '#F5F1E8',
                    bodyColor:       '#F5F1E8',
                    borderColor:     'rgba(245, 241, 232, 0.2)',
                    borderWidth:     1,
                    callbacks: { label: c => ' ' + c.label }
                }
            }
        }
    });
}

// ── Causes breakdown ──────────────────────────────────────────────────────
function displayCausesBreakdown(themes, scenario) {
    const causesList = document.getElementById('causesList');
    if (!causesList || !themes.length) return;

    const annualCauses = scenario.causesAmt * 12;
    const perCause     = annualCauses / themes.length;

    const themeNames = {
        'basic-needs':  'Basic Needs & Poverty',
        'health':       'Health & Medicine',
        'education':    'Education & Knowledge',
        'environment':  'Environment & Climate',
        'animals':      'Animals',
        'children':     'Children & Youth',
        'human-rights': 'Human Rights & Social Justice',
        'community':    'Community & Social Services',
        'culture':      'Culture, Arts & Heritage',
        'technology':   'Technology & Future Causes',
        'freedom':      'Freedom of Speech'
    };

    causesList.innerHTML = '';
    themes.forEach(theme => {
        const div = document.createElement('div');
        div.className = 'cause-item';
        div.innerHTML = `
            <span class="cause-name">${themeNames[theme] || theme}</span>
            <span class="cause-amount">€${Math.round(perCause).toLocaleString()}/yr</span>
        `;
        causesList.appendChild(div);
    });
}

// ── Impact Simulator ──────────────────────────────────────────────────────
function setupSimulator() {
    const btn = document.getElementById('runSimulation');
    if (!btn) return;

    btn.addEventListener('click', function () {
        const monthly = parseFloat(document.getElementById('simMonthly')?.value);
        const years   = parseInt(document.getElementById('simYears')?.value);

        if (!monthly || !years || monthly <= 0 || years <= 0) {
            showToast('Please enter a valid monthly amount and period', 'error');
            return;
        }

        const s = runScenario(monthly, years);

        document.getElementById('simFinalPortfolio').textContent  = `€${s.finalPortfolio.toLocaleString()}`;
        document.getElementById('simTotalInvested').textContent   = `€${s.totalInvested.toLocaleString()}`;
        document.getElementById('simMonthlyDividend').textContent = `€${s.monthlyDiv.toFixed(2)}`;
        document.getElementById('simCausesMonthly').textContent   = `€${s.causesAmt.toFixed(2)}`;

        const crossoverEl = document.getElementById('simCrossover');
        if (crossoverEl) {
            crossoverEl.textContent = formatCrossover(s.crossoverMonth);
            crossoverEl.style.color = s.crossoverMonth > 0 ? '#32CD32' : '#A89E8C';
        }

        document.getElementById('simResults').style.display = 'block';
        displaySimPortfolioChart(s);
        displaySimCrossoverChart(s, monthly);
        document.getElementById('simResults').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
}

function displaySimPortfolioChart(s) {
    const ctx = document.getElementById('predictionChart');
    if (!ctx) return;
    const existing = Chart.getChart(ctx);
    if (existing) existing.destroy();

    const labels    = s.points.map(p => `Year ${p.year}`);
    const invested  = s.points.map(p => p.totalInvested);
    const portfolio = s.points.map(p => p.portfolio);

    const opts = baseChartOptions();
    opts.plugins.tooltip.callbacks = {
        label: c => c.dataset.label + ': €' + c.parsed.y.toLocaleString()
    };

    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label:           'Cash Invested',
                    data:            invested,
                    borderColor:     '#E05252',
                    backgroundColor: 'rgba(224, 82, 82, 0)',
                    borderWidth:     2,
                    tension:         0,
                    fill:            false,
                    pointRadius:     3
                },
                {
                    label:           'Portfolio Value',
                    data:            portfolio,
                    borderColor:     '#00CED1',
                    backgroundColor: 'rgba(0, 206, 209, 0.15)',
                    borderWidth:     3,
                    tension:         0.4,
                    fill:            '-1',
                    pointRadius:     3
                }
            ]
        },
        options: opts,
        plugins: [makeCrossoverPlugin(s.crossoverFloorIdx, s.crossoverFrac)]
    });
}

function displaySimCrossoverChart(s, monthly) {
    const ctx = document.getElementById('predictionChart2');
    if (!ctx) return;
    const existing = Chart.getChart(ctx);
    if (existing) existing.destroy();

    const labels      = s.points.map(p => `Year ${p.year}`);
    // Show 40% causes payout (same metric as the main crossover chart)
    const causesData  = s.points.map(p => parseFloat(p.causesAmt.toFixed(2)));
    const donationFlat = s.points.map(() => monthly);

    const opts = baseChartOptions(v => '€' + v.toFixed(0));
    opts.plugins.tooltip.callbacks = {
        label: c => c.dataset.label + ': €' + c.parsed.y.toFixed(2)
    };

    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label:       `Monthly Donation (€${monthly})`,
                    data:        donationFlat,
                    borderColor: 'rgba(255, 165, 0, 0.9)',
                    borderWidth: 2,
                    borderDash:  [8, 4],
                    tension:     0,
                    fill:        false,
                    pointRadius: 0
                },
                {
                    label:           'Monthly Causes Payout (40% of dividends)',
                    data:            causesData,
                    borderColor:     '#32CD32',
                    backgroundColor: 'rgba(50, 205, 50, 0.08)',
                    borderWidth:     3,
                    tension:         0.4,
                    fill:            false,
                    pointRadius:     3
                }
            ]
        },
        options: opts,
        plugins: [makeCrossoverPlugin(s.crossoverFloorIdx, s.crossoverFrac)]
    });
}
