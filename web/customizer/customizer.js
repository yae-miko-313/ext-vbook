'use strict';

/**
 * VBook Platform Unified Script (V4.2 Beta)
 * 1:1 Transplantation from Stable script.js with Integrated Registry features.
 */

const API_BASE_URL = 'https://vbook-ext.vercel.app';
let currentSearch = '';
let currentTab = 'extensions';
let selectedIds = new Set();
let gridRenderVersion = 0;
let marketplaceShelves = [];

// Data state (Replicating script.js structure)
window.catalogExtensions = [];
window.catalogSources = [];

// --- INITIALIZATION ---

async function init() {
    try {
        console.log('[Platform] Initializing Unified V4...');
        setupTabs();
        setupFilters();
        await fetchAppData();
        loadSavedCart();
        loadMarketplace();
    } catch (err) {
        console.error('[Platform] Init Error:', err);
    }
}

async function fetchAppData() {
    console.log('[API] Fetching VBook catalog data...');
    try {
        const res = await fetch(`${API_BASE_URL}/api/catalog.json`);
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        const result = await res.json();
        
        window.catalogExtensions = result.plugin?.data || result.data || [];
        window.catalogSources = result.catalog?.sources || [];
        
        updateStats();
        renderActiveView();
    } catch (err) {
        showToast('Không thể tải kho extension. Vui lòng kiểm tra Vercel!');
        console.error(err);
    }
}

async function loadMarketplace() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/registry/market`);
        if (res.ok) {
            const data = await res.json();
            marketplaceShelves = data.data || [];
        }
    } catch (e) {}
}

// --- VIEW MANAGEMENT ---

function setupTabs() {
    document.querySelectorAll('.platform-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            switchTab(tab);
        });
    });
}

function switchTab(tab) {
    currentTab = tab;
    
    // UI Update
    document.querySelectorAll('.platform-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.platform-tab[data-tab="${tab}"]`).classList.add('active');

    document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${tab}`).classList.add('active');

    renderActiveView();
}

function renderActiveView() {
    if (currentTab === 'extensions') renderGrid();
    else if (currentTab === 'sources') renderSources();
    else if (currentTab === 'market') renderMarket();
}

// --- RENDERING: EXTENSIONS ---

function renderGrid() {
    const grid = document.getElementById('extensions-grid');
    if (!grid) return;

    const searchTerm = (document.getElementById('search-input')?.value || '').toLowerCase();
    const filtered = window.catalogExtensions.filter(ext => {
        return !searchTerm || 
            ext.name.toLowerCase().includes(searchTerm) || 
            ext.author.toLowerCase().includes(searchTerm);
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--color-text-tertiary);">Không tìm thấy extension nào...</div>`;
        return;
    }

    grid.innerHTML = filtered.map(ext => renderCard(ext)).join('');
}

function renderCard(ext) {
    const id = ext.path || ext.name;
    const isSelected = selectedIds.has(id);
    const iconUrl = secureUrl(ext.icon) || '../assets/default-icon.png';

    return `
        <article class="ext-card ${isSelected ? 'is-selected' : ''}">
            <button class="ext-add-btn" onclick="toggleCartItem('${escapeHtml(id)}')" title="Thêm vào kệ">
                ${isSelected ? '✓' : '+'}
            </button>
            <div class="ext-card-header">
                <img class="ext-icon" src="${escapeHtml(iconUrl)}" onerror="this.src='../assets/default-icon.png'" loading="lazy">
                <div class="ext-info">
                    <h3 class="ext-name">${escapeHtml(ext.name)}</h3>
                    <div class="ext-author">${escapeHtml(ext.author)}</div>
                </div>
            </div>
            <div class="ext-desc" style="font-size: 13px; color: var(--color-text-secondary); margin-top: 10px; height: 3em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                ${escapeHtml(ext.description || 'Không có mô tả')}
            </div>
            <div class="ext-tags" style="margin-top: 10px;">
                <span class="tag">${escapeHtml(ext.type)}</span>
                <span class="tag">${escapeHtml(ext.locale)}</span>
            </div>
        </article>
    `;
}

// --- RENDERING: SOURCES ---

function renderSources() {
    const container = document.getElementById('repo-list');
    if (!window.catalogSources.length) {
        container.innerHTML = `<div style="text-align: center; padding: 40px;">Chưa có dữ liệu nguồn...</div>`;
        return;
    }

    container.innerHTML = window.catalogSources.map(source => `
        <div class="market-card" style="margin-bottom: 12px; display: flex; align-items: center; gap: 15px;">
            <img src="${escapeHtml(source.avatar || '../assets/default-icon.png')}" style="width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--glass-border);">
            <div style="flex: 1;">
                <h3 style="margin: 0; font-size: 16px;">${escapeHtml(source.displayName || source.id)}</h3>
                <div style="font-size: 12px; color: var(--color-text-tertiary); font-family: monospace;">${escapeHtml(source.url)}</div>
            </div>
            <button class="action-btn secondary" style="min-width: unset; padding: 8px 12px; font-size: 12px;" onclick="copyToClipboard('${escapeHtml(source.url)}'); showToast('Đã copy nguồn!');">Copy</button>
        </div>
    `).join('');
}

// --- RENDERING: MARKETPLACE ---

function renderMarket() {
    const grid = document.getElementById('market-grid');
    if (!marketplaceShelves.length) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--color-text-tertiary);">Chưa có kệ nào được chia sẻ công khai...</div>`;
        return;
    }

    grid.innerHTML = marketplaceShelves.map(shelf => `
        <div class="market-card">
            <h3 style="font-size: 18px; margin: 0; color: var(--color-accent);">${escapeHtml(shelf.title)}</h3>
            <div style="font-size: 13px; color: var(--color-text-secondary); margin-top: 4px;">bởi <b>${escapeHtml(shelf.author)}</b></div>
            <p style="font-size: 14px; margin: 12px 0; color: var(--color-text-primary); line-height: 1.5;">${escapeHtml(shelf.description || '')}</p>
            <div style="font-size: 12px; display: flex; justify-content: space-between; border-top: 1px solid var(--glass-border); padding-top: 12px; color: var(--color-text-tertiary);">
                <span>🔥 ${shelf.usage_count} lượt dùng</span>
                <span>📅 ${new Date(shelf.updated_at).toLocaleDateString()}</span>
            </div>
            <button class="action-btn" style="width: 100%; margin-top: 15px;" onclick="useShelf('${shelf.slug}', '${shelf.id}')">Dùng Kệ Này</button>
        </div>
    `).join('');
}

// --- CART & BUILDER LOGIC ---

function toggleCartItem(id) {
    if (selectedIds.has(id)) selectedIds.delete(id);
    else selectedIds.add(id);
    
    updateCartBar();
    saveCart();
    renderGrid();
}

function updateCartBar() {
    const bar = document.getElementById('cart-bar');
    const countEl = document.getElementById('cart-count');
    countEl.textContent = selectedIds.size;
    
    if (selectedIds.size > 0) bar.classList.add('visible');
    else bar.classList.remove('visible');
}

function clearCart() {
    selectedIds.clear();
    saveCart();
    updateCartBar();
    renderGrid();
}

function saveCart() { localStorage.setItem('v4_cart_selection', JSON.stringify(Array.from(selectedIds))); }
function loadSavedCart() {
    const saved = localStorage.getItem('v4_cart_selection');
    if (saved) {
        selectedIds = new Set(JSON.parse(saved));
        updateCartBar();
    }
}

// --- REGISTRY SAVING ---

async function handleSave() {
    const title = document.getElementById('shelf-title').value.trim();
    const author = document.getElementById('shelf-author').value.trim();
    const desc = document.getElementById('shelf-desc').value.trim();
    const isPublic = document.getElementById('shelf-public').checked;
    const btn = document.getElementById('final-save-btn');
    const errorEl = document.getElementById('save-error');

    if (!title || !author) {
        errorEl.textContent = 'Vui lòng điền đủ Tên Kệ và Tác Giả!';
        errorEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Đang lưu kệ...';

    try {
        const res = await fetch(`${API_BASE_URL}/api/registry/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title, author, description: desc,
                extension_ids: Array.from(selectedIds),
                is_public: isPublic
            })
        });

        const result = await res.json();
        if (result.success) {
            const url = `${API_BASE_URL}/api/registry/${result.data.slug}.json`;
            document.getElementById('generated-url').value = url;
            hideSaveModal();
            document.getElementById('success-modal').classList.add('show');
        } else throw new Error(result.error);
    } catch (err) {
        errorEl.textContent = 'Lỗi: ' + err.message;
        errorEl.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Lưu & Lấy link';
    }
}

async function useShelf(slug, id) {
    const url = `${API_BASE_URL}/api/registry/${slug}.json`;
    await copyToClipboard(url);
    showToast('Đã copy link Registry!');
    fetch(`${API_BASE_URL}/api/registry/use`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    }).catch(()=>{});
}

// --- UTILS ---

function updateStats() {
    const exts = window.catalogExtensions;
    document.getElementById('total-extensions').textContent = exts.length;
    document.getElementById('novel-count').textContent = exts.filter(e => e.type === 'novel').length;
    document.getElementById('comic-count').textContent = exts.filter(e => e.type === 'comic').length;
    document.getElementById('translate-count').textContent = exts.filter(e => e.type === 'translate').length;
    document.getElementById('tts-count').textContent = exts.filter(e => e.type === 'tts').length;
    document.getElementById('source-repo-count').textContent = `Repo nguồn: ${window.catalogSources.length}`;
}

function setupFilters() {
    document.getElementById('search-input')?.addEventListener('input', renderGrid);
}

function secureUrl(url) {
    if (typeof url !== 'string') return url;
    return url.replace(/^http:\/\//i, 'https://');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function copyToClipboard(text) { await navigator.clipboard.writeText(text); }
async function copyGeneratedLink() {
    const val = document.getElementById('generated-url').value;
    await copyToClipboard(val);
    showToast('Đã copy link!');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function showSaveModal() { document.getElementById('save-modal').classList.add('show'); }
function hideSaveModal() { document.getElementById('save-modal').classList.remove('show'); }
function hideSuccessModal() { document.getElementById('success-modal').classList.remove('show'); }

// Start
init();
