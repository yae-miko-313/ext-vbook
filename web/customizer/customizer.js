'use strict';

/**
 * VBook Platform Unified Script (V4.2.3 Core-Tab Architecture)
 * Each tab has a dedicated core view and independent statistics.
 */

const API_BASE_URL = 'https://vbook-ext.vercel.app'; 

let currentExtSearch = '';
let currentSourceSearch = '';
let hideNsfwEnabled = true;
let selectedAuthorKeys = new Set();
let selectedLocales = new Set();
let selectedTypes = new Set();

let extensionCatalog = { novel: [], comic: [], chinese_novel: [], translate: [], tts: [], _unknown: [] };
let gridRenderVersion = 0;

// Registry State
let currentTab = 'extensions';
let selectedExtIds = new Set();
let marketplaceData = [];

// --- HELPERS ---

function escapeHtml(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getDescription(ext) { return (ext && (ext.description || (ext.metadata && ext.metadata.description))) || ''; }
function getAllExtensions() { return Array.isArray(window.catalogExtensions) ? window.catalogExtensions.slice() : []; }
function getActiveCatalogSources() {
    const sources = Array.isArray(window.catalogSources) ? window.catalogSources : [];
    return sources.filter((source) => String(source && source.status ? source.status : '').toLowerCase() !== 'error');
}

function normalizeSiteUrlKey(rawUrl) {
    try {
        const parsed = new URL(String(rawUrl || '').trim());
        return `${parsed.protocol.toLowerCase()}//${parsed.hostname.toLowerCase().replace(/^www\./, '')}${parsed.pathname.replace(/\/+$/, '') || '/'}`;
    } catch { return ''; }
}

function normalizeAuthorName(name) { return String(name || '').normalize('NFKC').trim().replace(/\s+/g, ' ') || 'Không rõ'; }
function normalizeAuthorKey(author) { return normalizeAuthorName(author).toLocaleLowerCase('vi'); }

function findDominantAuthor(exts) {
    if (!exts || exts.length === 0) return 'Không rõ';
    const counts = {};
    exts.forEach(e => {
        const author = normalizeAuthorName(e.author);
        counts[author] = (counts[author] || 0) + 1;
    });
    return Object.entries(counts).sort((a,b) => b[1] - a[1])[0][0];
}

// --- DATA FETCHING ---

async function fetchAppData() {
    try {
        const catalogUrl = `${API_BASE_URL}/api/catalog.json`;
        const res = await fetch(catalogUrl);
        const catalogRes = await res.json();

        window.catalogExtensions = catalogRes.plugin?.data || [];
        window.catalogSources = catalogRes.catalog?.sources || [];
        
        categorizeExtensions();
        renderDashboard();
        
        loadSavedSelection();
        fetchMarketplace();
    } catch (e) { console.error('[API] Error:', e); }
}

function categorizeExtensions() {
    const all = getAllExtensions();
    Object.keys(extensionCatalog).forEach(k => extensionCatalog[k] = []);
    all.forEach(ext => {
        let type = ext.type || '_unknown';
        if (type === 'chinese_novel' || type === 'chinese') type = 'novel';
        if (extensionCatalog[type]) extensionCatalog[type].push(ext);
        else extensionCatalog._unknown.push(ext);
    });
}

// --- FILTERING ---

function extensionMatchesFilters(ext) {
    if (hideNsfwEnabled && (ext.tag || '').toLowerCase() === 'nsfw') return false;
    if (selectedAuthorKeys.size > 0 && !selectedAuthorKeys.has(normalizeAuthorKey(ext.author))) return false;
    // Locales and Types can be added if modals are used
    return true;
}

function filterExtensions() {
    let all = getAllExtensions().filter(extensionMatchesFilters);
    if (currentExtSearch) {
        const s = currentExtSearch.toLowerCase();
        all = all.filter(e => (e.name||'').toLowerCase().includes(s) || (e.author||'').toLowerCase().includes(s));
    }
    all.sort((a,b) => (a.name||'').localeCompare(b.name||'', 'vi'));
    return all;
}

function filterSources() {
    let sources = Array.isArray(window.catalogSources) ? window.catalogSources : [];
    const search = currentSourceSearch.toLowerCase();
    
    return sources.map(source => {
        const items = (source.extItems || []).filter(extensionMatchesFilters);
        const dominantAuthor = findDominantAuthor(items);
        
        const matchesSearch = dominantAuthor.toLowerCase().includes(search) || (source.url||'').toLowerCase().includes(search);
        const filteredItems = items.filter(e => (e.name||'').toLowerCase().includes(search) || (e.author||'').toLowerCase().includes(search));
        
        const finalItems = filteredItems.length > 0 ? filteredItems : (matchesSearch ? items : []);
        return { ...source, extItems: finalItems, dominantAuthor };
    }).filter(s => s.extItems.length > 0);
}

// --- RENDERING ---

function renderStats() {
    const all = filterExtensions();
    document.getElementById('total-extensions').textContent = all.length;
    document.getElementById('novel-count').textContent = all.filter(e => e.type === 'novel' || e.type === 'chinese_novel').length;
    document.getElementById('comic-count').textContent = all.filter(e => e.type === 'comic').length;
    document.getElementById('translate-count').textContent = all.filter(e => e.type === 'translate').length;
    document.getElementById('tts-count').textContent = all.filter(e => e.type === 'tts').length;
}

function renderSourceStats() {
    const sources = getActiveCatalogSources();
    const authors = new Set(getAllExtensions().map(e => normalizeAuthorKey(e.author)));
    document.getElementById('total-authors-count').textContent = authors.size;
    document.getElementById('total-source-repos').textContent = sources.length;
}

function renderCard(ext) {
    const id = ext.path || ext.name;
    const isSelected = selectedExtIds.has(id);
    const iconUrl = (ext.icon || '').replace(/^http:\/\//i, 'https://');
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(ext.name || 'ext')}&background=f1f1f1&color=333333`;
    
    return `
        <div class="ext-card reveal-in ${isSelected ? 'is-selected' : ''}" data-ext-id="${escapeHtml(id)}">
            <button class="ext-add-btn" onclick="toggleSelection('${escapeHtml(id)}')" title="Thêm vào kệ">
                ${isSelected ? '✓' : '+'}
            </button>
            <div class="ext-top-row"><div class="ext-type-badge">${escapeHtml(ext.type.toUpperCase())}</div></div>
            <div class="ext-header">
                <div class="ext-icon-wrap"><img class="ext-icon" src="${escapeHtml(iconUrl)}" onerror="this.src='${escapeHtml(fallback)}'" loading="lazy"></div>
                <div class="ext-title-wrap">
                    <h3 class="ext-name">${escapeHtml(ext.name)}</h3>
                    <p class="ext-site-url">${escapeHtml(ext.author)}</p>
                </div>
            </div>
            <p class="ext-description">${escapeHtml(getDescription(ext))}</p>
        </div>
    `;
}

function renderSourceCard(source) {
    const items = source.extItems || [];
    const expanded = window.catalogSourceExpandedState?.[source.id || source.url];
    const avatar = source.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(source.dominantAuthor)}&background=f1f1f1&color=333333`;
    
    return `
        <div class="source-card ${expanded ? 'is-expanded' : 'is-collapsed'} reveal-in" data-source-key="${escapeHtml(source.id || source.url)}">
            <button class="source-toggle-btn" data-source-toggle="${escapeHtml(source.id || source.url)}">
                <img class="source-card-avatar" src="${escapeHtml(avatar)}">
                <div style="flex:1; text-align:left;">
                    <h3 class="source-name">${escapeHtml(source.dominantAuthor)}</h3>
                    <div style="font-size:11px; opacity:0.6; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:300px;">${escapeHtml(source.url)}</div>
                </div>
                <div class="source-toggle-meta">
                    <span class="source-total-pill">${items.length} ext</span>
                    <span class="source-toggle-icon">${expanded ? '−' : '+'}</span>
                </div>
            </button>
            ${expanded ? `<div class="source-ext-grid">${items.map(renderCard).join('')}</div>` : ''}
        </div>
    `;
}

function renderDashboard() {
    if (currentTab === 'extensions') {
        renderStats();
        document.getElementById('extensions-grid').innerHTML = filterExtensions().map(renderCard).join('');
    } else if (currentTab === 'sources') {
        renderSourceStats();
        document.getElementById('sources-grid').innerHTML = filterSources().map(renderSourceCard).join('');
    }
    
    // Always render bottom list
    const repoList = document.getElementById('repo-list');
    if (repoList) {
        const active = getActiveCatalogSources();
        repoList.innerHTML = active.map(s => `<div class="repo-chip"><span>${escapeHtml(s.displayName||s.id)}</span></div>`).join('');
        document.getElementById('contribute-source-count').textContent = active.length;
    }
}

// --- SYSTEM ---

function setupTabs() {
    document.querySelectorAll('.platform-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            currentTab = btn.getAttribute('data-tab');
            document.querySelectorAll('.platform-tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
            document.getElementById(`view-${currentTab === 'market' ? 'marketplace' : currentTab === 'sources' ? 'sources' : 'extensions'}`).classList.add('active');
            
            renderDashboard();
            if (currentTab === 'market') renderMarketplace();
        });
    });
}

function toggleSelection(id) {
    if (selectedExtIds.has(id)) selectedExtIds.delete(id); else selectedExtIds.add(id);
    document.getElementById('cart-count').textContent = selectedExtIds.size;
    document.getElementById('cart-bar').classList.toggle('visible', selectedExtIds.size > 0);
    localStorage.setItem('v4_shelf_selection', JSON.stringify(Array.from(selectedExtIds)));
    renderDashboard();
}

function loadSavedSelection() {
    const saved = localStorage.getItem('v4_shelf_selection');
    if (saved) {
        selectedExtIds = new Set(JSON.parse(saved));
        document.getElementById('cart-count').textContent = selectedExtIds.size;
        document.getElementById('cart-bar').classList.toggle('visible', selectedExtIds.size > 0);
    }
}

async function fetchMarketplace() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/registry/market`);
        const data = await res.json();
        marketplaceData = data.data || [];
    } catch (e) {}
}

function renderMarketplace() {
    const grid = document.getElementById('market-grid'); if (!grid) return;
    grid.innerHTML = marketplaceData.map(s => `
        <article class="market-card">
            <h3 style="color:var(--color-accent)">${escapeHtml(s.title)}</h3>
            <p>Bởi ${escapeHtml(s.author)}</p>
            <button class="action-btn" onclick="navigator.clipboard.writeText('${API_BASE_URL}/api/registry/${s.slug}.json'); showToast('Đã copy!')">Copy Link Kệ</button>
        </article>
    `).join('');
}

async function handleSaveShelf() {
    const title = document.getElementById('shelf-title').value.trim();
    const author = document.getElementById('shelf-author').value.trim();
    if (!title || !author) { alert('Vui lòng điền đủ thông tin!'); return; }
    try {
        const res = await fetch(`${API_BASE_URL}/api/registry/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, author, extension_ids: Array.from(selectedExtIds) })
        });
        const result = await res.json();
        if (result.success) {
            document.getElementById('generated-url').value = `${API_BASE_URL}/api/registry/${result.data.slug}.json`;
            document.getElementById('save-modal').classList.remove('show');
            document.getElementById('success-modal').classList.add('show');
        }
    } catch (e) { console.error(e); }
}

function showToast(m) { const t = document.getElementById('toast'); t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2000); }

document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    fetchAppData();
    
    document.getElementById('ext-search-input')?.addEventListener('input', (e) => {
        currentExtSearch = e.target.value;
        renderDashboard();
    });
    
    document.getElementById('source-search-input')?.addEventListener('input', (e) => {
        currentSourceSearch = e.target.value;
        renderDashboard();
    });

    document.addEventListener('click', (e) => {
        const toggle = e.target.closest('[data-source-toggle]');
        if (toggle) {
            const key = toggle.getAttribute('data-source-toggle');
            if (!window.catalogSourceExpandedState) window.catalogSourceExpandedState = {};
            window.catalogSourceExpandedState[key] = !window.catalogSourceExpandedState[key];
            renderDashboard();
        }
    });
});
