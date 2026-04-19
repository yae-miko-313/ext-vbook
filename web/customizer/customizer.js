'use strict';

/**
 * VBook Platform Unified Script (V4.2.3 Restoration & Enhancement)
 * This version inherits 100% of Stable Logic and enhances with Platform features.
 */

const API_BASE_URL = 'https://vbook-ext.vercel.app'; 

let currentExtSearch = '';
let currentSourceSearch = '';
let hideNsfwEnabled = true;
let selectedAuthorKeys = new Set();
let selectedLocales = new Set();
let selectedTypes = new Set();

// Drafts for Modal
let draftAuthorKeys = new Set();
let draftLocales = new Set();
let draftTypes = new Set();
let draftHideNsfwEnabled = true;

let extensionCatalog = { novel: [], comic: [], chinese_novel: [], translate: [], tts: [], _unknown: [] };
let memoizedFilterOptions = { authors: null, locales: null, types: null };

// Platform State
let currentTab = 'extensions';
let selectedExtIds = new Set();
let marketplaceData = [];
let lockedBodyScrollY = 0;

// --- HELPERS (Safe-Audited Version) ---

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

function normalizeLocaleKey(locale) {
    const raw = String(locale || '_unknown').trim().replace(/-/g, '_').toLowerCase();
    if (raw.startsWith('vi')) return 'vi';
    if (raw.startsWith('zh')) return 'zh';
    if (raw.startsWith('en')) return 'en';
    return 'global';
}

function getLocaleDisplayLabel(key) {
    if (key === 'vi') return 'Tiếng Việt';
    if (key === 'zh') return 'Tiếng Trung';
    if (key === 'en') return 'Tiếng Anh';
    return 'Global';
}

function findDominantAuthor(exts) {
    if (!exts || exts.length === 0) return 'Không rõ';
    const counts = {};
    exts.forEach(e => {
        const author = normalizeAuthorName(e.author);
        counts[author] = (counts[author] || 0) + 1;
    });
    return Object.entries(counts).sort((a,b) => b[1] - a[1])[0][0];
}

// --- DATA FETCHING (with SWR Inheritance) ---

async function fetchAppData(isRefresh = false) {
    if (!isRefresh) renderLoadingState();
    try {
        const catalogUrl = `${API_BASE_URL}/api/catalog.json`;
        const res = await fetch(catalogUrl);
        const catalogRes = await res.json();

        window.catalogExtensions = catalogRes.plugin?.data || [];
        window.catalogSources = catalogRes.catalog?.sources || [];
        
        categorizeExtensions();
        memoizedFilterOptions = { authors: null, locales: null, types: null }; // Reset cache
        
        clearLoadingState();
        renderDashboard();
        
        if (!isRefresh) {
            loadSavedSelection();
            fetchMarketplace();
            // Stable SWR: Periodic health refresh can be added here if backend supports.
            setTimeout(() => fetchAppData(true), 300000); // 5 min refresh
        }
    } catch (e) { 
        console.error('[API] Error:', e);
        if (!isRefresh) {
            document.querySelectorAll('.extensions-grid').forEach(g => {
                g.innerHTML = `<div class="error" style="grid-column:1/-1; padding:40px; text-align:center; color:var(--color-accent);">Lỗi tải dữ liệu. Vui lòng thử lại sau.</div>`;
            });
        }
    }
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

// --- FILTER CORE (Stable Symmetry) ---

function extensionMatchesFilters(ext) {
    if (!ext) return false;
    const authorKey = normalizeAuthorKey(ext.author);
    const localeKey = normalizeLocaleKey(ext.locale);
    let typeValue = ext.type || '_unknown';
    if (typeValue === 'chinese_novel' || typeValue === 'chinese') typeValue = 'novel';

    if (hideNsfwEnabled && (ext.tag || '').toLowerCase() === 'nsfw') return false;
    if (selectedAuthorKeys.size > 0 && !selectedAuthorKeys.has(authorKey)) return false;
    if (selectedLocales.size > 0 && !selectedLocales.has(localeKey)) return false;
    if (selectedTypes.size > 0 && !selectedTypes.has(typeValue)) return false;
    
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

// --- UI COMPONENTS ---

function renderStats() {
    const all = filterExtensions();
    document.getElementById('total-extensions').textContent = all.length;
    document.getElementById('novel-count').textContent = all.filter(e => e.type === 'novel' || e.type === 'chinese_novel').length;
    document.getElementById('comic-count').textContent = all.filter(e => e.type === 'comic').length;
    document.getElementById('translate-count').textContent = all.filter(e => e.type === 'translate').length;
    document.getElementById('tts-count').textContent = all.filter(e => e.type === 'tts').length;
}

function renderSourceStats() {
    const filteredSources = filterSources();
    const allFilteredExts = filteredSources.flatMap(s => s.extItems);
    const authorsCount = new Set(allFilteredExts.map(e => normalizeAuthorKey(e.author))).size;
    
    document.getElementById('total-authors-count').textContent = authorsCount;
    document.getElementById('total-source-repos').textContent = filteredSources.length;
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
            <div class="ext-top-row"><div class="ext-type-badge">${escapeHtml((ext.type || 'unknown').toUpperCase())}</div></div>
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
    
    const repoList = document.getElementById('repo-list');
    if (repoList) {
        const active = getActiveCatalogSources();
        repoList.innerHTML = active.map(s => `<div class="repo-chip"><span>${escapeHtml(s.displayName||s.id)}</span></div>`).join('');
        document.getElementById('contribute-source-count').textContent = active.length;
    }
    updateFilterButtonLabel();
}

// --- MODAL & FILTERS RESTORATION (Stable Sync) ---

function getAuthorFilterOptions() {
    if (memoizedFilterOptions.authors) return memoizedFilterOptions.authors;
    const authorGroups = new Map();
    getAllExtensions().forEach(ext => {
        const author = normalizeAuthorName(ext.author);
        const key = normalizeAuthorKey(author);
        if (!key) return;
        if (!authorGroups.has(key)) authorGroups.set(key, { label: author, total: 0 });
        authorGroups.get(key).total += 1;
    });
    return memoizedFilterOptions.authors = Array.from(authorGroups.entries()).map(([value, info]) => ({ value, label: `${info.label} (${info.total})` })).sort((a,b) => a.label.localeCompare(b.label, 'vi'));
}

function getLocaleFilterOptions() {
    if (memoizedFilterOptions.locales) return memoizedFilterOptions.locales;
    const map = new Map();
    getAllExtensions().forEach(ext => {
        const key = normalizeLocaleKey(ext.locale);
        map.set(key, (map.get(key) || 0) + 1);
    });
    return memoizedFilterOptions.locales = Array.from(map.entries()).map(([value, count]) => ({ value, label: `${getLocaleDisplayLabel(value)} (${count})` }));
}

function getTypeFilterOptions() {
    if (memoizedFilterOptions.types) return memoizedFilterOptions.types;
    const set = new Set();
    getAllExtensions().forEach(ext => {
        let t = ext.type || 'novel';
        if (t === 'chinese_novel' || t === 'chinese') t = 'novel';
        set.add(t);
    });
    return memoizedFilterOptions.types = Array.from(set).map(v => ({ value: v, label: v.toUpperCase() }));
}

function renderFilterChipList(containerId, group, options, selectedSet) {
    const el = document.getElementById(containerId); if (!el) return;
    const allChip = `<button type="button" class="filter-chip ${selectedSet.size === 0 ? 'active' : ''}" data-filter-group="${group}" data-filter-value="__all">Tất cả</button>`;
    el.innerHTML = allChip + options.map(opt => `<button type="button" class="filter-chip ${selectedSet.has(opt.value) ? 'active' : ''}" data-filter-group="${group}" data-filter-value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</button>`).join('');
}

function updateFilterButtonLabel() {
    const btn = document.getElementById('open-filter-btn'); if (!btn) return;
    const total = selectedAuthorKeys.size + selectedLocales.size + selectedTypes.size;
    btn.textContent = total > 0 ? `Lọc (${total})` : 'Lọc';
}

function openFilterModal() {
    const modal = document.getElementById('filter-modal'); if (!modal) return;
    draftAuthorKeys = new Set(selectedAuthorKeys);
    draftLocales = new Set(selectedLocales);
    draftTypes = new Set(selectedTypes);
    draftHideNsfwEnabled = hideNsfwEnabled;

    renderFilterChipList('filter-authors', 'author', getAuthorFilterOptions(), draftAuthorKeys);
    renderFilterChipList('filter-locales', 'locale', getLocaleFilterOptions(), draftLocales);
    renderFilterChipList('filter-types', 'type', getTypeFilterOptions(), draftTypes);
    document.getElementById('filter-nsfw-switch').checked = !draftHideNsfwEnabled;

    modal.classList.add('show');
}

function applyFilterModal() {
    selectedAuthorKeys = new Set(draftAuthorKeys);
    selectedLocales = new Set(draftLocales);
    selectedTypes = new Set(draftTypes);
    hideNsfwEnabled = draftHideNsfwEnabled;
    renderDashboard();
}

// --- SYSTEM & UX ---

function renderLoadingState() {
    const skeleton = `<div class="skeleton-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:20px;">
        ${Array.from({length: 6}).map(() => `<div class="skeleton-card"><div class="skeleton-line skeleton-line-sm"></div><div class="skeleton-line skeleton-line-lg"></div><div class="skeleton-line skeleton-line-md"></div></div>`).join('')}
    </div>`;
    document.querySelectorAll('.extensions-grid').forEach(g => g.innerHTML = skeleton);
}

function clearLoadingState() {}

function setupTabs() {
    document.querySelectorAll('.platform-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            currentTab = btn.getAttribute('data-tab');
            document.querySelectorAll('.platform-tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
            document.getElementById(`view-${currentTab === 'market' ? 'marketplace' : currentTab === 'sources' ? 'sources' : 'extensions'}`).classList.add('active');
            renderDashboard();
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
        const d = await res.json(); marketplaceData = d.data || [];
        if (currentTab === 'market') renderMarketplace();
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
        const res = await fetch(`${API_BASE_URL}/api/registry/save`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ title, author, extension_ids: Array.from(selectedExtIds) }) });
        const r = await res.json();
        if (r.success) {
            document.getElementById('generated-url').value = `${API_BASE_URL}/api/registry/${r.data.slug}.json`;
            document.getElementById('save-modal').classList.remove('show');
            document.getElementById('success-modal').classList.add('show');
        }
    } catch (e) {}
}

function showToast(m) { const t = document.getElementById('toast'); t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2000); }

document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    fetchAppData();
    
    // Search bindings
    ['ext-search-input', 'source-search-input'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', (e) => {
            if (id === 'ext-search-input') currentExtSearch = e.target.value;
            else currentSourceSearch = e.target.value;
            renderDashboard();
        });
    });

    // Global click listeners (Expansion & Filters)
    document.addEventListener('click', (e) => {
        const toggle = e.target.closest('[data-source-toggle]');
        if (toggle) {
            const key = toggle.getAttribute('data-source-toggle');
            if (!window.catalogSourceExpandedState) window.catalogSourceExpandedState = {};
            window.catalogSourceExpandedState[key] = !window.catalogSourceExpandedState[key];
            renderDashboard();
            return;
        }

        const chip = e.target.closest('.filter-chip');
        if (chip) {
            const grp = chip.getAttribute('data-filter-group');
            const val = chip.getAttribute('data-filter-value');
            const target = grp === 'author' ? draftAuthorKeys : (grp === 'locale' ? draftLocales : draftTypes);
            if (val === '__all') target.clear();
            else if (target.has(val)) target.delete(val);
            else target.add(val);
            // Re-render modal chips
            renderFilterChipList('filter-authors', 'author', getAuthorFilterOptions(), draftAuthorKeys);
            renderFilterChipList('filter-locales', 'locale', getLocaleFilterOptions(), draftLocales);
            renderFilterChipList('filter-types', 'type', getTypeFilterOptions(), draftTypes);
            applyFilterModal();
        }
    });

    // Modal Bindings
    document.getElementById('open-filter-btn')?.addEventListener('click', openFilterModal);
    document.getElementById('filter-apply-btn')?.addEventListener('click', () => document.getElementById('filter-modal').classList.remove('show'));
    document.getElementById('filter-cancel-btn')?.addEventListener('click', () => document.getElementById('filter-modal').classList.remove('show'));
    document.querySelectorAll('.filter-modal-backdrop').forEach(b => b.addEventListener('click', () => document.querySelectorAll('.filter-modal').forEach(m => m.classList.remove('show'))));
    document.getElementById('filter-nsfw-switch')?.addEventListener('change', (e) => { draftHideNsfwEnabled = !e.target.checked; applyFilterModal(); });
    
    // Back to top
    const btt = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => btt.classList.toggle('show', window.scrollY > 300));
    btt?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // Guide Modal
    document.getElementById('open-guide-btn')?.addEventListener('click', () => showToast('Đang phát triển hướng dẫn...'));
});
