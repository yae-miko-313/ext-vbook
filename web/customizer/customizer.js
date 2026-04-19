'use strict';

/**
 * VBook Platform Unified Script (V4.2.1 Beta)
 * Lấy toàn bộ lõi từ script.js (Stable) và tích hợp Registry/Tabs.
 */

const API_BASE_URL = 'https://vbook-ext.vercel.app';
let lockedBodyScrollY = 0;
let currentSearch = '';
let sourceViewEnabled = false;
let hideNsfwEnabled = true;
let selectedAuthorKeys = new Set();
let selectedLocales = new Set();
let selectedTypes = new Set();
let filterModalBound = false;
let draftAuthorKeys = new Set();
let draftLocales = new Set();
let draftTypes = new Set();

let extensionCatalog = { novel: [], comic: [], chinese_novel: [], translate: [], tts: [], _unknown: [] };
let memoizedFilterOptions = { authors: null, locales: null, types: null };
let memoizedStats = null;
let gridRenderVersion = 0;

// Registry State
let currentTab = 'extensions';
let selectedExtIds = new Set();
let marketplaceData = [];

// --- HELPER WRAPPERS ---

function escapeHtml(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getDescription(ext) {
    return (ext && (ext.description || (ext.metadata && ext.metadata.description))) || '';
}

function getAllExtensions() {
    return Array.isArray(window.catalogExtensions) ? window.catalogExtensions.slice() : [];
}

function getActiveCatalogSources() {
    const sources = Array.isArray(window.catalogSources) ? window.catalogSources : [];
    return sources.filter((source) => String(source && source.status ? source.status : '').toLowerCase() !== 'error');
}

// --- DATA FETCHING (SYNCED) ---

async function fetchAppData(isRefresh = false) {
    if (!isRefresh) renderLoadingState();
    try {
        const catalogUrl = `${API_BASE_URL}/api/catalog.json`;
        const healthUrl = `${API_BASE_URL}/api/health`;

        const [catalogRes, healthRes] = await Promise.all([
            fetch(catalogUrl).then(r => r.json()),
            fetch(healthUrl).then(r => r.json()).catch(() => ({ sources: [] }))
        ]);

        const newHealth = {};
        if (catalogRes.catalog?.siteHealth) {
            Object.entries(catalogRes.catalog.siteHealth).forEach(([url, s]) => {
                const key = normalizeSiteUrlKey(url);
                if (key) newHealth[key] = s;
            });
        }
        if (healthRes.sources) {
            healthRes.sources.forEach(s => {
                const key = normalizeSiteUrlKey(s.url);
                if (key && !newHealth[key]) newHealth[key] = s;
            });
        }

        window.catalogExtensions = catalogRes.plugin?.data || [];
        window.catalogSources = catalogRes.catalog?.sources || [];
        window.siteHealthByUrl = newHealth;

        if (isRefresh) return; // Silent health refresh ignored for beta simplicity

        categorizeExtensions();
        memoizedFilterOptions = { authors: null, locales: null, types: null };
        memoizedStats = null;
        
        clearLoadingState();
        renderDashboard();
        
        // Load Registry Data
        loadSavedSelection();
        fetchMarketplace();
    } catch (e) { console.error(e); }
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

// --- STABLE FILTER LOGIC (1:1 Port) ---

function normalizeAuthorName(n) { return String(n || '').normalize('NFKC').trim().replace(/\s+/g, ' ') || 'Không rõ'; }
function normalizeAuthorKey(n) { return normalizeAuthorName(n).toLocaleLowerCase('vi'); }
function normalizeSiteUrlKey(u) { try { const p = new URL(String(u || '').trim()); return `${p.protocol.toLowerCase()}//${p.hostname.toLowerCase().replace(/^www\./, '')}${p.pathname.replace(/\/+$/, '') || '/'}`; } catch { return ''; } }
function normalizeLocaleKey(l) { const r = String(l || '_unknown').trim().replace(/-/g, '_').toLowerCase(); if (r.startsWith('vi')) return 'vi'; if (r.startsWith('zh')) return 'zh'; if (r.startsWith('en')) return 'en'; return 'global'; }

function extensionMatchesStructuredFilters(ext) {
    if (hideNsfwEnabled && (ext.tag || '').toLowerCase() === 'nsfw') return false;
    if (selectedAuthorKeys.size > 0 && !selectedAuthorKeys.has(normalizeAuthorKey(ext.author))) return false;
    if (selectedLocales.size > 0 && !selectedLocales.has(normalizeLocaleKey(ext.locale))) return false;
    if (selectedTypes.size > 0 && !selectedTypes.has(ext.type)) return false;
    return true;
}

function filterExtensions() {
    let all = getAllExtensions().filter(extensionMatchesStructuredFilters);
    if (currentSearch) {
        const s = currentSearch.toLowerCase();
        all = all.filter(e => e.name.toLowerCase().includes(s) || e.author.toLowerCase().includes(s));
    }
    return all.sort((a,b) => a.name.localeCompare(b.name, 'vi'));
}

function filterSources() {
    let sources = Array.isArray(window.catalogSources) ? window.catalogSources.slice() : [];
    const search = currentSearch.toLowerCase();
    return sources.map(s => {
        const extItems = (s.extItems || []).filter(extensionMatchesStructuredFilters);
        const searchItems = extItems.filter(e => e.name.toLowerCase().includes(search) || e.author.toLowerCase().includes(search));
        const finalItems = searchItems.length > 0 ? searchItems : (s.displayName||'').toLowerCase().includes(search) ? extItems : [];
        return { ...s, extItems: finalItems, itemCount: finalItems.length };
    }).filter(s => s.extItems.length > 0);
}

// --- RENDERING (STABLE 1:1) ---

function renderStats(exts = null) {
    const all = exts || filterExtensions();
    const counters = {
        'total-extensions': all.length,
        'novel-count': all.filter(e => e.type === 'novel' || e.type === 'chinese_novel').length,
        'comic-count': all.filter(e => e.type === 'comic').length,
        'translate-count': all.filter(e => e.type === 'translate').length,
        'tts-count': all.filter(e => e.type === 'tts').length
    };
    Object.entries(counters).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.textContent = val; });
}

function renderCard(ext) {
    const id = ext.path || ext.name;
    const isSelected = selectedExtIds.has(id);
    const iconUrl = (ext.icon || '').replace(/^http:\/\//i, 'https://');
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(ext.name || 'ext')}&background=f1f1f1&color=333333`;
    const typeLabel = ext.type === 'novel' || ext.type === 'chinese_novel' ? 'TRUYỆN CHỮ' : ext.type.toUpperCase();

    return `
        <article class="ext-card reveal-in ${isSelected ? 'is-selected' : ''}" data-ext-id="${escapeHtml(id)}">
            <button class="ext-add-btn" onclick="toggleSelection('${escapeHtml(id)}')" title="Thêm vào kệ">
                ${isSelected ? '✓' : '+'}
            </button>
            <div class="ext-top-row"><div class="ext-type-badge">${escapeHtml(typeLabel)}</div></div>
            <div class="ext-header">
                <div class="ext-icon-wrap"><img class="ext-icon" src="${escapeHtml(iconUrl)}" onerror="this.src='${escapeHtml(fallback)}'" loading="lazy"></div>
                <div class="ext-title-wrap">
                    <h3 class="ext-name">${escapeHtml(ext.name)}</h3>
                    <p class="ext-site-url">${escapeHtml(ext.author)}</p>
                </div>
                <span class="ext-version">v${escapeHtml(ext.version || '0')}</span>
            </div>
            <p class="ext-description">${escapeHtml(getDescription(ext))}</p>
        </article>
    `;
}

function renderSourceCard(source) {
    const items = source.extItems || [];
    const expanded = window.catalogSourceExpandedState?.[source.id || source.url];
    const avatar = source.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(source.displayName || 'repo')}&background=f1f1f1&color=333333`;
    
    return `
        <article class="source-card ${expanded ? 'is-expanded' : 'is-collapsed'} reveal-in" data-source-key="${escapeHtml(source.id || source.url)}">
            <button class="source-toggle-btn" data-source-toggle="${escapeHtml(source.id || source.url)}">
                <img class="source-card-avatar" src="${escapeHtml(avatar)}">
                <h3 class="source-name">${escapeHtml(source.displayName || 'Source')}</h3>
                <div class="source-toggle-meta">
                    <span class="source-total-pill">${source.itemCount || items.length} ext</span>
                    <span class="source-toggle-icon">${expanded ? '−' : '+'}</span>
                </div>
            </button>
            ${expanded ? `<ul class="source-ext-detail-list">${items.map(e => `<li class="source-ext-pill"><span>${escapeHtml(e.name)}</span></li>`).join('')}</ul>` : ''}
        </article>
    `;
}

function renderGrid() {
    const grid = document.getElementById('extensions-grid');
    if (!grid) return;
    grid.innerHTML = filterExtensions().map(renderCard).join('');
}

function renderSourceView() {
    const grid = document.getElementById('extensions-grid');
    if (!grid) return;
    grid.innerHTML = filterSources().map(renderSourceCard).join('');
}

function renderSources() {
    const list = document.getElementById('repo-list');
    if (!list) return;
    const sources = getActiveCatalogSources();
    list.innerHTML = sources.map(s => `
        <div class="repo-chip" style="padding: 10px; display: flex; align-items: center; gap: 10px;">
            <img src="${s.avatar || ''}" onerror="this.src='https://ui-avatars.com/api/?name=repo'" style="width: 32px; height: 32px; border-radius: 8px;">
            <span class="repo-chip-label" style="flex: 1;">${escapeHtml(s.displayName || s.id)}</span>
            <button class="action-btn secondary" style="min-width: unset; padding: 4px 8px; font-size: 11px;" onclick="copyToClipboard('${escapeHtml(s.url)}')">Copy</button>
        </div>
    `).join('');
    document.getElementById('contribute-source-count').textContent = `${sources.length} nguồn`;
    document.getElementById('source-repo-count').textContent = `Repo nguồn: ${sources.length}`;
}

function renderActiveView() {
    const exts = filterExtensions();
    renderStats(exts);
    if (sourceViewEnabled) renderSourceView();
    else renderGrid();
}

function renderDashboard() {
    renderStats();
    renderActiveView();
    renderSources();
}

// --- PLATFORM LOGIC ---

function setupTabs() {
    document.querySelectorAll('.platform-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            currentTab = tab;
            document.querySelectorAll('.platform-tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            if (tab === 'extensions') {
                sourceViewEnabled = false;
                document.getElementById('view-catalog').classList.add('active');
                renderActiveView();
            } else if (tab === 'sources') {
                sourceViewEnabled = true;
                document.getElementById('view-catalog').classList.add('active');
                renderActiveView();
            } else if (tab === 'market') {
                document.getElementById('view-market').classList.add('active');
                renderMarketplace();
            }
        });
    });
}

// --- REGISTRY Logic ---

function toggleSelection(id) {
    if (selectedExtIds.has(id)) selectedExtIds.delete(id);
    else selectedExtIds.add(id);
    updateCartBar();
    saveSelection();
    if (!sourceViewEnabled) renderGrid();
}

function updateCartBar() {
    const bar = document.getElementById('cart-bar');
    const count = document.querySelector('.cart-count');
    count.textContent = selectedExtIds.size;
    if (selectedExtIds.size > 0) bar.classList.add('visible');
    else bar.classList.remove('visible');
}

function saveSelection() { localStorage.setItem('v4_shelf_selection', JSON.stringify(Array.from(selectedExtIds))); }
function loadSavedSelection() {
    const saved = localStorage.getItem('v4_shelf_selection');
    if (saved) { selectedExtIds = new Set(JSON.parse(saved)); updateCartBar(); }
}

async function fetchMarketplace() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/registry/market`);
        const data = await res.json();
        marketplaceData = data.data || [];
    } catch (e) {}
}

function renderMarketplace() {
    const grid = document.getElementById('market-grid');
    if (!grid) return;
    grid.innerHTML = marketplaceData.map(shelf => `
        <article class="market-card">
            <h3 class="market-card-title">${escapeHtml(shelf.title)}</h3>
            <div class="market-card-meta">bởi <b>${escapeHtml(shelf.author)}</b> • ${shelf.usage_count} lượt dùng</div>
            <p class="market-card-desc">${escapeHtml(shelf.description || 'Không có mô tả')}</p>
            <button class="action-btn" style="width: 100%; margin-top: auto;" onclick="useMarketShelf('${shelf.slug}')">Dùng Kệ Này</button>
        </article>
    `).join('');
}

async function useMarketShelf(slug) {
    const url = `${API_BASE_URL}/api/registry/${slug}.json`;
    await copyToClipboard(url);
    showToast('Đã copy link Registry!');
}

async function handleSaveShelf() {
    const title = document.getElementById('shelf-title').value.trim();
    const author = document.getElementById('shelf-author').value.trim();
    if (!title || !author) { document.getElementById('save-error').style.display = 'block'; return; }
    try {
        const res = await fetch(`${API_BASE_URL}/api/registry/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, author, description: document.getElementById('shelf-desc').value, is_public: document.getElementById('shelf-public').checked, extension_ids: Array.from(selectedExtIds) })
        });
        const result = await res.json();
        if (result.success) {
            document.getElementById('generated-url').value = `${API_BASE_URL}/api/registry/${result.data.slug}.json`;
            document.getElementById('save-modal').classList.remove('show');
            document.getElementById('success-modal').classList.add('show');
        }
    } catch (e) { console.error(e); }
}

// --- INITIALIZATION ---

function setupGlobalListeners() {
    document.addEventListener('click', (e) => {
        const toggle = e.target.closest('[data-source-toggle]');
        if (toggle) {
            const key = toggle.getAttribute('data-source-toggle');
            if (!window.catalogSourceExpandedState) window.catalogSourceExpandedState = {};
            window.catalogSourceExpandedState[key] = !window.catalogSourceExpandedState[key];
            renderActiveView();
        }
    });

    document.getElementById('search-input')?.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        renderActiveView();
    });
}

function clearLoadingState() {}
function renderLoadingState() {}
function copyToClipboard(t) { return navigator.clipboard.writeText(t); }
function copyRegistryLink() { copyToClipboard(document.getElementById('generated-url').value); showToast('Đã copy!'); }
function showToast(m) { const t = document.getElementById('toast'); t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2000); }
function clearSelection() { selectedExtIds.clear(); updateCartBar(); saveSelection(); renderActiveView(); }

// BOOT
setupTabs();
setupGlobalListeners();
fetchAppData();
