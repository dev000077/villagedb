/**
 * ENTE VILLAGE - Main Application Logic
 * Handles Google Sheets fetching, CSV parsing, and UI rendering.
 */

// User's Live Google Sheet (Published to web as CSV)
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRIGB1-ZuQH_YYL-R9ms95_fFmBB7D-3AXhjUT4-GCowCRqqibeeHmY9NhSbjOcK4cDnG19KpGkNjWb/pub?gid=0&single=true&output=csv';
const FALLBACK_JSON = 'https://raw.githubusercontent.com/josephjosedev/TESTNODE/main/villagedb.json';

// Column mappings (based on JSON keys, will be mapped from CSV headers)
const COLUMNS = {
    VILLAGE: 'Village Name',
    TALUK: 'Taluk',
    OFFICER: 'Village Officer Name',
    PHONE: 'Mobile_Number',
    EMAIL: 'Official Mail ID',
    PINCODE: 'Pincode',
    FTTH: 'FTTH NO.'
};

let allData = [];

// DOM Elements
const villageList = document.getElementById('village-list');
const searchBar = document.getElementById('search-bar');
const talukDropdown = document.getElementById('taluk-dropdown');
const loadingMessage = document.getElementById('loading-message');
const lastUpdateTime = document.getElementById('last-update-time');

/**
 * Initialize Application
 */
async function init() {
    try {
        await loadData();
        setupEventListeners();
        render();
    } catch (error) {
        console.error('Initialization failed:', error);
        loadingMessage.innerHTML = `<p style="color: #ef4444;">Error loading data. Please check connection.</p>`;
    }
}

/**
 * Fetch and Parse Data
 */
async function loadData() {
    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error('Google Sheet not found or not published');

        const csvText = await response.text();
        allData = parseCSV(csvText);
        updateStats(allData);

    } catch (e) {
        console.warn('Google Sheets fetch failed, falling back to JSON:', e.message);

        const response = await fetch(FALLBACK_JSON);
        allData = await response.json();
        updateStats(allData);
    }

    loadingMessage.style.display = 'none';
    populateTaluks();
}

/**
 * Basic CSV Parser
 */
function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    return lines.slice(1).map(line => {
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });
        return obj;
    });
}

/**
 * Update Stats Ribbon
 */
function updateStats(data) {
    document.getElementById('total-villages').innerText = data.length;
    const talukSet = new Set(data.map(item => item[COLUMNS.TALUK]).filter(Boolean));
    document.getElementById('total-taluks').innerText = talukSet.size;
}

/**
 * Populate Taluk Dropdown
 */
function populateTaluks() {
    const taluks = [...new Set(allData.map(item => item[COLUMNS.TALUK]).filter(Boolean))].sort();
    talukDropdown.innerHTML = '<option value="">All Taluks</option>';
    taluks.forEach(taluk => {
        const option = document.createElement('option');
        option.value = taluk;
        option.textContent = taluk;
        talukDropdown.appendChild(option);
    });
}

/**
 * Render Cards
 */
function render() {
    const query = searchBar.value.toLowerCase();
    const selectedTaluk = talukDropdown.value;

    const filtered = allData.filter(item => {
        const matchSearch = Object.values(item).some(val =>
            String(val).toLowerCase().includes(query)
        );
        const matchTaluk = !selectedTaluk || item[COLUMNS.TALUK] === selectedTaluk;
        return matchSearch && matchTaluk;
    });

    villageList.innerHTML = '';

    if (filtered.length === 0) {
        villageList.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 5rem; color: var(--text-muted); font-size: 1.1rem;">No matching villages found in Alappuzha.</div>`;
    }

    filtered.forEach((item, index) => {
        const card = createCard(item, index);
        villageList.appendChild(card);
    });

    if (window.lucide) {
        lucide.createIcons();
    }
}

/**
 * Create Individual Village Card (Bento Style)
 */
function createCard(data, index) {
    const div = document.createElement('div');
    div.className = 'village-card';
    div.style.animationDelay = `${(index % 15) * 0.05}s`;

    const villageName = data[COLUMNS.VILLAGE] || 'Unknown Village';
    const taluk = data[COLUMNS.TALUK] || 'N/A';
    const officer = data[COLUMNS.OFFICER] || 'N/A';
    const phone = data[COLUMNS.PHONE] || 'N/A';
    const email = data[COLUMNS.EMAIL] || '';
    const pincode = data[COLUMNS.PINCODE] || 'N/A';
    // const FTTH NO. = data[COLUMNS.FTTH] || 'N/A';

    div.innerHTML = `
        <h3>${villageName}</h3>
        
        <div class="card-content">
            <div class="field">
                <span class="field-label">Taluk</span>
                <span class="field-value">${taluk}</span>
            </div>
            
            <div class="field">
                <span class="field-label">Village Officer</span>
                <span class="field-value">${officer}</span>
            </div>
            
            <div class="field">
                <span class="field-label">Mobile</span>
                <span class="field-value">${phone}</span>
            </div>

            <div class="field">
                <span class="field-label">Pincode</span>
                <span class="field-value">${pincode}</span>
            </div>
            //    <div class="field">
            //     <span class="field-label">FTTH No</span>
            //     <span class="field-value">${FTTH}</span>
            // </div>

            <div class="field full-width">
                <span class="field-label">Official Email</span>
                <span class="email-text">${email || 'No email available'}</span>
            </div>
        </div>
    `;

    return div;
}

/**
 * Event Listeners
 */
function setupEventListeners() {
    searchBar.addEventListener('input', render);
    talukDropdown.addEventListener('change', render);
}

// Start Application
init();
