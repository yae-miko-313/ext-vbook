'use strict';

/**
 * VBook Platform JS (Unified V4 Beta)
 * Located in /web/customizer/
 */

const API_BASE = 'https://vbook-ext.vercel.app/api';
let allExtensions = [];
let allSources = [];
let selectedIds = new Set();
let currentTab = 'extensions';
let marketplaceShelves = [];

// --- INITIALIZATION ---

async function init() {
    try {
        await fetchCatalog();
        loadMarketplace();
        switchTab('extensions'); // Default view
        setupEventListeners();
        loadSavedSelection();
    } catch (err) {
        console.error('Platform Init Error:', err);
    }
}

async function fetchCatalog() {
    try {
        const res = await fetch(`${API_BASE}/plugin.json`);
        if (!res.ok) throw new Error('API 404');
        const result = await res.json();
        
        // Extract data
        const snapshot = result.data || result;
        allExtensions = snapshot.plugin?.data || snapshot.data || [];
        allSources = snapshot.catalog?.sources || [];
        
        updateStats(allExtensions);
    } catch (err) {
        showToast('Không thể tải dữ liệu từ Vercel...');
    }
}

async function loadMarketplace() {
    try {
        const res = await fetch(`${API_BASE}/registry/market`);
        if (res.ok) {
            const result = await res.json();
            marketplaceShelves = result.data || [];
        }
    } catch (e) {}
}

// --- STATE MANAGEMENT ---

function switchTab(tab) {
    currentTab = tab;
    
    // Update UI Buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.tab-btn[onclick*="${tab}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Update Views
    document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active'));
    const targetView = document.getElementById(`view-${tab}`);
    if (targetView) targetView.classList.add('active');

    // Tab-specific rendering
    if (tab === 'extensions') renderExtensions();
    if (tab === 'sources') renderSources();
    if (tab === 'market') renderMarket();
}

// --- RENDERING: EXTENSIONS ---

function renderExtensions() {
    const grid = document.getElementById('builder-grid');
    const searchTerm = document.getElementById('ext-search').value.toLowerCase();
    const typeFilter = document.getElementById('type-filter').value;

    const filtered = allExtensions.filter(ext => {
        const matchesSearch = !searchTerm || 
            ext.name.toLowerCase().includes(searchTerm) || 
            ext.author.toLowerCase().includes(searchTerm);
        const matchesType = typeFilter === 'all' || ext.type === typeFilter;
        return matchesSearch && matchesType;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Không tìm thấy extension nào...</div>`;
        return;
    }

    grid.innerHTML = filtered.map(ext => {
        const id = ext.path || ext.name;
        const isSelected = selectedIds.has(id);
        return `
            <div class="ext-card ${isSelected ? 'selected' : ''}">
                <button class="add-btn" onclick="toggleExtension('${id}')">${isSelected ? '✓' : '+'}</button>
                <div class="ext-card-header">
                    <img class="ext-icon" src="${secureUrl(ext.icon) || '../assets/default-icon.png'}" onerror="this.src='../assets/default-icon.png'" loading="lazy">
                    <div class="ext-info">
                        <div class="ext-name">${escapeHtml(ext.name)}</div>
                        <div class="ext-author">${escapeHtml(ext.author)}</div>
                    </div>
                </div>
                <div class="ext-desc" style="font-size: 12px; margin-top: 8px; color: var(--color-text-secondary); height: 3em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                    ${escapeHtml(ext.description || 'Không có mô tả')}
                </div>
                <div class="ext-tags" style="margin-top: 8px;">
                    <span class="tag">${ext.type}</span>
                    <span class="tag">${ext.locale}</span>
                </div>
            </div>
        `;
    }).join('');
}

// --- RENDERING: SOURCES ---

function renderSources() {
    const container = document.getElementById('repo-list');
    if (allSources.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 40px;">Chưa có dữ liệu nguồn...</div>`;
        return;
    }

    container.innerHTML = allSources.map(source => `
        <div class="market-card" style="margin-bottom: 12px; display: flex; align-items: center; gap: 15px;">
            <img src="${source.avatar || '../assets/default-icon.png'}" style="width: 40px; height: 40px; border-radius: 50%;">
            <div style="flex: 1;">
                <h3 style="margin: 0; font-size: 16px;">${escapeHtml(source.displayName || source.id)}</h3>
                <div style="font-size: 12px; color: var(--color-text-tertiary);">${source.url}</div>
            </div>
            <button class="action-btn secondary" style="padding: 8px 12px;" onclick="copyToClipboard('${source.url}'); showToast('Đã copy!');">Copy Link</button>
        </div>
    `).join('');
}

// --- RENDERING: MARKETPLACE ---

function renderMarket() {
    const grid = document.getElementById('market-grid');
    if (marketplaceShelves.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Chưa có kệ sách nào được chia sẻ...</div>`;
        return;
    }

    grid.innerHTML = marketplaceShelves.map(shelf => `
        <div class="market-card">
            <h3 style="font-size: 18px; margin: 0;">${escapeHtml(shelf.title)}</h3>
            <div style="font-size: 13px; color: var(--color-text-secondary);">bởi <b>${escapeHtml(shelf.author)}</b></div>
            <p style="font-size: 14px; margin: 10px 0;">${escapeHtml(shelf.description || '')}</p>
            <div style="font-size: 12px; display: flex; justify-content: space-between; align-items: center; color: var(--color-text-tertiary);">
                <span>🔥 ${shelf.usage_count} lượt dùng</span>
                <span>📅 ${new Date(shelf.updated_at).toLocaleDateString()}</span>
            </div>
            <button class="action-btn" style="width: 100%; margin-top: 15px;" onclick="useShelf('${shelf.slug}', '${shelf.id}')">Dùng kệ này</button>
        </div>
    `).join('');
}

// --- BUILDER LOGIC ---

function toggleExtension(id) {
    if (selectedIds.has(id)) {
        selectedIds.delete(id);
    } else {
        selectedIds.add(id);
    }
    saveSelection();
    updateCartBar();
    renderExtensions();
}

function updateCartBar() {
    const bar = document.getElementById('cart-bar');
    const countEl = document.getElementById('selected-count');
    countEl.textContent = selectedIds.size;
    
    if (selectedIds.size > 0) {
        bar.classList.add('visible');
    } else {
        bar.classList.remove('visible');
    }
}

function clearSelection() {
    selectedIds.clear();
    saveSelection();
    updateCartBar();
    renderExtensions();
}

function saveSelection() {
    localStorage.setItem('v4_selected_ids', JSON.stringify(Array.from(selectedIds)));
}

function loadSavedSelection() {
    const saved = localStorage.getItem('v4_selected_ids');
    if (saved) {
        selectedIds = new Set(JSON.parse(saved));
        updateCartBar();
    }
}

// --- SAVING SHELF ---

async function handleSave() {
    const title = document.getElementById('shelf-title').value.trim();
    const author = document.getElementById('shelf-author').value.trim();
    const desc = document.getElementById('shelf-desc').value.trim();
    const isPublic = document.getElementById('shelf-public').checked;
    const btn = document.getElementById('final-save-btn');
    const errorEl = document.getElementById('save-error');

    if (!title || !author) {
        errorEl.textContent = 'Vui lòng điền tên kệ và tác giả';
        errorEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Đang lưu...';

    try {
        const res = await fetch(`${API_BASE}/registry/save`, {
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
            const url = `https://vbook-ext.vercel.app/api/registry/${result.data.slug}.json`;
            document.getElementById('generated-url').value = url;
            hideSaveModal();
            document.getElementById('success-modal').classList.add('show');
        } else { throw new Error(result.error); }
    } catch (err) {
        errorEl.textContent = 'Lỗi: ' + err.message;
        errorEl.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Lưu & Lấy link';
    }
}

async function useShelf(slug, id) {
    const url = `https://vbook-ext.vercel.app/api/registry/${slug}.json`;
    await copyToClipboard(url);
    showToast('Đã copy link kệ sách!');
    
    // Usage tracking
    fetch(`${API_BASE}/registry/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    }).catch(()=>{});
}

// --- HELPERS ---

function updateStats(exts) {
    document.getElementById('total-count').textContent = exts.length;
    document.getElementById('novel-count').textContent = exts.filter(e => e.type === 'novel').length;
    document.getElementById('comic-count').textContent = exts.filter(e => e.type === 'comic').length;
}

function setupEventListeners() {
    document.getElementById('ext-search').addEventListener('input', renderExtensions);
    document.getElementById('type-filter').addEventListener('change', renderExtensions);
}

function showSaveModal() { document.getElementById('save-modal').classList.add('show'); }
function hideSaveModal() { document.getElementById('save-modal').classList.remove('show'); }
function hideSuccessModal() { document.getElementById('success-modal').classList.remove('show'); }
function openFilterModal() { document.getElementById('filter-modal').classList.add('show'); }
function closeFilterModal() { document.getElementById('filter-modal').classList.remove('show'); }

function secureUrl(url) {
    if (!url) return '';
    return url.replace(/^http:\/\//i, 'https://');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function copyToClipboard(text) {
    await navigator.clipboard.writeText(text);
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Start
init();
