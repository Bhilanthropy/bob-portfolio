// ── Platform updates config (edit this to change the "Since you were last here" cards) ──
const PLATFORM_UPDATES = [
    {
        type:  'new',
        label: 'NEW ON PLATFORM',
        title: 'Impact Dashboard rebuilt',
        body:  'We redesigned the dashboard around the crossover story — the moment your portfolio outworks your monthly donation.',
        cta:   { label: 'See it now →', tab: 'impact' }
    },
    {
        type:  'impact',
        label: 'COMMUNITY IMPACT',
        title: '€12,400 realised this quarter',
        body:  'Across all active donors, our collective portfolios distributed €12,400 to causes in Q1 2026.',
        cta:   null
    },
    {
        type:  'progress',
        label: 'IN PROGRESS',
        title: 'Cause-matching engine',
        body:  "We're building an engine so projects that fit your profile find you automatically — no browsing required.",
        cta:   null
    }
];

// ── Demo projects (matched against user themes) ───────────────────────────
const DEMO_PROJECTS = [
    {
        id: 1,
        themes:      ['environment', 'children', 'basic-needs', 'education'],
        title:       'Clean Water Schools Initiative',
        tag:         'Environment · Children',
        org:         'WaterAid East Africa',
        location:    'Kenya & Tanzania',
        summary:     'Installing purification systems in 12 rural schools — giving 6,000 children safe drinking water.',
        body:        'In rural Kenya and Tanzania, students walk up to 5 km daily to collect water that is often contaminated. This project installs solar-powered purification units at 12 schools, providing safe water for drinking and sanitation. Each unit serves ~500 children and runs for 15+ years with minimal maintenance. Your donation directly funds installation and a 2-year technical support contract.',
        goal:        45000,
        raised:      30600,
        gradient:    ['#1a3a2a', '#0d2a3a']
    },
    {
        id: 2,
        themes:      ['health', 'community', 'basic-needs', 'human-rights'],
        title:       'Mobile Medical Clinics',
        tag:         'Health · Community',
        org:         'Médecins du Monde',
        location:    'Bangladesh',
        summary:     'Expanding mobile clinic coverage to 40 underserved villages along the Brahmaputra delta.',
        body:        'Seasonal flooding cuts off millions of people in Bangladesh from healthcare for months at a time. This programme deploys boat-based medical clinics staffed by local doctors and nurses, reaching 40 villages per circuit. Services include maternal care, vaccinations, malaria treatment and mental health support. The project trains 20 community health workers as a sustainable local resource.',
        goal:        80000,
        raised:      52000,
        gradient:    ['#2a1a3a', '#1a0d3a']
    },
    {
        id: 3,
        themes:      ['education', 'technology', 'children', 'freedom'],
        title:       'Code Classrooms Africa',
        tag:         'Education · Technology',
        org:         'Andela Foundation',
        location:    'Nigeria & Ghana',
        summary:     'Equipping 30 rural secondary schools with coding labs and a two-year curriculum.',
        body:        'Sub-Saharan Africa will have the world's largest working-age population by 2035, yet fewer than 15% of schools teach any form of digital skills. This project builds solar-powered computer labs in 30 rural secondary schools, delivers a two-year coding curriculum, and trains teachers in-country. Students completing the programme have a direct pathway to the Andela fellowship.',
        goal:        60000,
        raised:      41800,
        gradient:    ['#1a2a3a', '#0a1a2a']
    },
    {
        id: 4,
        themes:      ['animals', 'environment', 'community'],
        title:       'Rewilding the Karoo',
        tag:         'Animals · Environment',
        org:         'Wildlands Conservation Trust',
        location:    'South Africa',
        summary:     'Reintroducing three keystone species to 18,000 hectares of degraded semi-arid land.',
        body:        'The Great Karoo once supported vast herds of wildlife that maintained its fragile ecosystem. Decades of overgrazing left the land degraded and biodiversity depleted. This project works with 14 private landowners to fence, restore and reintroduce cheetah, African wild dog and black rhino. Reintroduction is paired with community-based eco-tourism creating income for 200+ local families.',
        goal:        120000,
        raised:      73000,
        gradient:    ['#2a1a0d', '#1a2a0d']
    },
    {
        id: 5,
        themes:      ['culture', 'human-rights', 'freedom'],
        title:       'Archive of Disappearing Voices',
        tag:         'Culture · Human Rights',
        org:         'UNESCO Intangible Heritage Fund',
        location:    'Global',
        summary:     'Recording oral histories and indigenous languages at risk of extinction within a decade.',
        body:        'Linguists estimate that half of the world\'s 7,000 languages will be silent by 2100. This project dispatches trained field recorders to document oral histories, songs, ceremonies and everyday speech in 40 at-risk language communities. All recordings are archived in the UNESCO digital vault, made available to communities and published under open licence for academic and educational use.',
        goal:        35000,
        raised:      22400,
        gradient:    ['#2a1a2a', '#1a0a1a']
    }
];

// ── Entry point (called by dashboard.js after auth) ───────────────────────
window.initOverview = function (userData, prevLogin) {
    displayWelcome(userData, prevLogin);
    renderUpdates();
    renderSnapshot(userData);
    setupSnapshotNavigation();
    setupProjectModal();
};

// ── Welcome header ────────────────────────────────────────────────────────
function displayWelcome(userData, prevLogin) {
    const heading = document.getElementById('welcomeHeading');
    const sub     = document.getElementById('welcomeSub');
    const dateEl  = document.getElementById('welcomeDate');

    const name = (userData && userData.name) ? userData.name.split(' ')[0] : 'there';

    if (!prevLogin) {
        heading.textContent = `Welcome, ${name}.`;
        sub.textContent     = "Great to have you here. Let's build your impact.";
    } else {
        const daysSince = Math.floor((Date.now() - prevLogin) / (1000 * 60 * 60 * 24));
        heading.textContent = `Welcome back, ${name}.`;
        if      (daysSince === 0) sub.textContent = 'You were here earlier today.';
        else if (daysSince === 1) sub.textContent = 'You were last here yesterday.';
        else                      sub.textContent = `You were last here ${daysSince} days ago.`;
    }

    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long'
    });
}

// ── Platform update cards ─────────────────────────────────────────────────
function renderUpdates() {
    const grid = document.getElementById('updatesGrid');
    if (!grid) return;

    grid.innerHTML = '';
    PLATFORM_UPDATES.forEach(update => {
        const card = document.createElement('div');
        card.className = `update-card update-card--${update.type}`;
        card.innerHTML = `
            <span class="update-label">${update.label}</span>
            <h3 class="update-title">${update.title}</h3>
            <p class="update-body">${update.body}</p>
            ${update.cta ? `<button class="update-cta" data-goto="${update.cta.tab}">${update.cta.label}</button>` : ''}
        `;
        grid.appendChild(card);
    });

    // Wire any CTA buttons that switch tabs
    grid.querySelectorAll('[data-goto]').forEach(btn => {
        btn.addEventListener('click', () => switchToTab(btn.dataset.goto));
    });
}

// ── Snapshot cards ────────────────────────────────────────────────────────
function renderSnapshot(userData) {
    // Monthly donation
    const monthly = (userData && userData.monthlyDonation) ? userData.monthlyDonation : DEMO_MONTHLY;
    const snapMonthly = document.getElementById('snapMonthly');
    if (snapMonthly) snapMonthly.textContent = `€${monthly}`;

    // Causes payout: run the same simulation used by the impact dashboard
    if (typeof runScenario === 'function') {
        const scenario = runScenario(monthly, DEMO_YEARS);
        const snapCauses = document.getElementById('snapCauses');
        const snapCausesSub  = document.getElementById('snapCausesSub');
        const snapCausesDetail = document.getElementById('snapCausesDetail');

        if (snapCauses) snapCauses.textContent = `€${scenario.causesAmt.toFixed(2)}`;
        if (snapCausesSub) {
            const yr = Math.floor(scenario.crossoverMonth / 12);
            const mo = scenario.crossoverMonth % 12;
            const crossLabel = scenario.crossoverMonth > 0
                ? `Crossover: Year ${yr}${mo > 0 ? `, Month ${mo}` : ''}`
                : 'Crossover not yet reached';
            snapCausesSub.textContent = `40% of monthly dividends · ${crossLabel}`;
        }
        if (snapCausesDetail && userData && userData.themes && userData.themes.length) {
            const perCause = (scenario.causesAmt * 12) / userData.themes.length;
            snapCausesDetail.textContent = `€${Math.round(perCause)}/yr per cause · ${userData.themes.length} themes selected`;
        }
    }

    // Project suggestion
    renderProjectCard(userData);
}

// ── Project suggestion card ───────────────────────────────────────────────
function pickProject(userThemes) {
    if (!userThemes || !userThemes.length) return DEMO_PROJECTS[0];

    let best = DEMO_PROJECTS[0];
    let bestScore = -1;

    DEMO_PROJECTS.forEach(project => {
        const score = project.themes.filter(t => userThemes.includes(t)).length;
        if (score > bestScore) {
            bestScore = score;
            best = project;
        }
    });
    return best;
}

function progressPct(raised, goal) {
    return Math.min(100, Math.round((raised / goal) * 100));
}

function renderProjectCard(userData) {
    const card = document.getElementById('projectCard');
    if (!card) return;

    const project = pickProject(userData && userData.themes);
    const pct = progressPct(project.raised, project.goal);

    card.innerHTML = `
        <div class="project-card-banner" style="background: linear-gradient(135deg, ${project.gradient[0]}, ${project.gradient[1]})">
            <span class="project-card-tag">${project.tag}</span>
        </div>
        <div class="project-card-body">
            <span class="snapshot-card-label">Project match for you</span>
            <h3 class="project-card-title">${project.title}</h3>
            <p class="project-card-summary">${project.summary}</p>
            <div class="project-progress">
                <div class="project-progress-bar">
                    <div class="project-progress-fill" style="width: ${pct}%"></div>
                </div>
                <div class="project-progress-meta">
                    <span>€${project.raised.toLocaleString()} raised</span>
                    <span>${pct}% of €${project.goal.toLocaleString()}</span>
                </div>
            </div>
            <button class="project-contribute-btn" data-project-id="${project.id}">
                Contribute directly →
            </button>
        </div>
    `;

    card.querySelector('[data-project-id]').addEventListener('click', () => {
        openProjectModal(project);
    });
}

// ── Snapshot "go to tab" links ────────────────────────────────────────────
function setupSnapshotNavigation() {
    document.querySelectorAll('[data-goto]').forEach(btn => {
        btn.addEventListener('click', () => switchToTab(btn.dataset.goto));
    });
}

function switchToTab(tabName) {
    const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (tabBtn) tabBtn.click();
}

// ── Project modal ─────────────────────────────────────────────────────────
function setupProjectModal() {
    const modal    = document.getElementById('projectModal');
    const backdrop = document.getElementById('projectModalBackdrop');
    const closeBtn = document.getElementById('projectModalClose');

    if (!modal) return;

    [backdrop, closeBtn].forEach(el => {
        if (el) el.addEventListener('click', closeProjectModal);
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
            closeProjectModal();
        }
    });
}

function openProjectModal(project) {
    const modal   = document.getElementById('projectModal');
    const content = document.getElementById('projectModalContent');
    if (!modal || !content) return;

    const pct = progressPct(project.raised, project.goal);

    content.innerHTML = `
        <div class="modal-banner" style="background: linear-gradient(135deg, ${project.gradient[0]}, ${project.gradient[1]})">
            <span class="modal-tag">${project.tag}</span>
        </div>
        <div class="modal-body">
            <div class="modal-meta">
                <span class="modal-org">${project.org}</span>
                <span class="modal-sep">·</span>
                <span class="modal-location">${project.location}</span>
            </div>
            <h2 class="modal-title">${project.title}</h2>
            <p class="modal-description">${project.body}</p>

            <div class="modal-progress-section">
                <span class="modal-progress-label">Funding progress</span>
                <div class="project-progress-bar modal-progress-bar">
                    <div class="project-progress-fill" style="width: ${pct}%"></div>
                </div>
                <div class="project-progress-meta">
                    <span>€${project.raised.toLocaleString()} raised of €${project.goal.toLocaleString()}</span>
                    <span>${pct}%</span>
                </div>
            </div>

            <div class="modal-actions">
                <a href="#" class="modal-visit-btn" onclick="return false;">
                    Visit project page ↗
                </a>
                <button class="modal-close-secondary" id="modalCloseSecondary">Close</button>
            </div>
        </div>
    `;

    content.querySelector('#modalCloseSecondary')
        .addEventListener('click', closeProjectModal);

    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('modal-open');
    document.body.style.overflow = '';
}
