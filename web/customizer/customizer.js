'use strict';

// Shared state
// Decoupled API Base for GitHub Pages hosting compatibility
const API_BASE = 'https://vbook-ext.vercel.app/api';
let allExtensions = [];
let selectedIds = new Set();
let currentTab = 'builder';
let marketplaceShelves = [];

// Entry point
async function init() {
    try {
        await Promise.all([
            fetchCatalog(),
            loadMarketplace()
        ]);
        
        // Restore existing session if possible (optional future feature)
        renderBuilder();
        setupFilters();
    } catch (err) {
        console.error('Init failed:', err);
    }
}

// --- DATA FETCHING ---

async function fetchCatalog() {
    try {
        const res = await fetch(`${API_BASE}/plugin.json`);
        const result = await res.json();
        // Extract plain extensions list
        allExtensions = result.data || result.plugin?.data || [];
    } catch (err) {
        showToast('Không thể tải kho extension');
    }
}
async function loadMarketplace() {
    try {
        const res = await fetch(`${API_BASE}/registry/market`);
        const result = await res.json();
        marketplaceShelves = result.data || [];
        if (currentTab === 'market') renderMarket();
    } catch (err) {
        console.error('Market fetch failed:', err);
    }
}

// --- RENDERING ---

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-btn[onclick*="${tab}"]`).classList.add('active');

    if (tab === 'builder') {
        document.getElementById('view-builder').style.display = 'grid';
        document.getElementById('view-market').style.display = 'none';
        renderBuilder();
    } else {
        document.getElementById('view-builder').style.display = 'none';
        document.getElementById('view-market').style.display = 'grid';
        renderMarket();
    }
}

function renderBuilder() {
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
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--color-text-tertiary); padding: 40px;">Không tìm thấy extension nào...</div>`;
        return;
    }

    grid.innerHTML = filtered.map(ext => {
        const isSelected = selectedIds.has(ext.path || ext.name);
        return `
            <div class="ext-card selectable ${isSelected ? 'selected' : ''}" onclick="toggleExtension('${ext.path || ext.name}')">
                <div class="ext-card-header">
                    <img class="ext-icon" src="${ext.icon || '../assets/default-icon.png'}" onerror="this.src='../assets/default-icon.png'" loading="lazy">
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

function renderMarket() {
    const grid = document.getElementById('market-grid');
    if (marketplaceShelves.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Chưa có kệ sách nào được chia sẻ...</div>`;
        return;
    }

    grid.innerHTML = marketplaceShelves.map(shelf => `
        <div class="market-card">
            <h3 style="font-size: 18px; margin: 0;">${escapeHtml(shelf.title)}</h3>
            <div style="font-size: 13px; color: var(--color-text-secondary);">tác giả: <b>${escapeHtml(shelf.author)}</b></div>
            <p style="font-size: 14px; margin: 4px 0;">${escapeHtml(shelf.description || '')}</p>
            <div class="market-stats">
                <span class="market-use-count">🔥 ${shelf.usage_count} lượt dùng</span>
                <span>📅 ${new Date(shelf.updated_at).toLocaleDateString()}</span>
            </div>
            <button class="action-btn" style="width: 100%; margin-top: 8px;" onclick="copyShelfUrl('${shelf.slug}', '${shelf.id}')">Lấy link</button>
        </div>
    `).join('');
}

// --- LOGIC ---

function toggleExtension(id) {
    if (selectedIds.has(id)) {
        selectedIds.delete(id);
    } else {
        selectedIds.add(id);
    }
    updateShelfBar();
    renderBuilder();
}

function clearSelection() {
    selectedIds.clear();
    updateShelfBar();
    renderBuilder();
}

function updateShelfBar() {
    const bar = document.getElementById('shelf-bar');
    const countEl = document.getElementById('selected-count');
    countEl.textContent = selectedIds.size;
    
    if (selectedIds.size > 0) {
        bar.classList.add('visible');
    } else {
        bar.classList.remove('visible');
    }
}

function showSaveModal() {
    document.getElementById('save-modal').classList.add('show');
}

function hideSaveModal() {
    document.getElementById('save-modal').classList.remove('show');
}

function hideSuccessModal() {
    document.getElementById('success-modal').classList.remove('show');
}

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
    errorEl.style.display = 'none';

    try {
        const res = await fetch(`${API_BASE}/registry/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                author,
                description: desc,
                extension_ids: Array.from(selectedIds),
                is_public: isPublic
            })
        });

        const result = await res.json();
        if (result.success) {
            // CRITICAL: Save ownership token to localStorage so user can edit later
            if (result.data.secret_token) {
                const myShelves = JSON.parse(localStorage.getItem('vbook_my_shelves') || '{}');
                myShelves[result.data.slug] = {
                    id: result.data.id,
                    token: result.data.secret_token,
                    created_at: new Date().toISOString()
                };
                localStorage.setItem('vbook_my_shelves', JSON.stringify(myShelves));
            }

            // Generate URL using the Production API Domain, not the current frontend origin
            const url = `https://vbook-ext.vercel.app/api/registry/${result.data.slug}.json`;
            document.getElementById('generated-url').value = url;
            hideSaveModal();
            document.getElementById('success-modal').classList.add('show');
        } else {
            throw new Error(result.error);
        }
    } catch (err) {
        errorEl.textContent = 'Lỗi: ' + err.message;
        errorEl.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Lưu & Lấy link';
    }
}

async function copyShelfUrl(slug, id) {
    const url = `https://vbook-ext.vercel.app/api/registry/${slug}.json`;
    await copyToClipboard(url);
    showToast('Đã copy link vào bộ nhớ tạm!');
    
    // Call usage API
    try {
        fetch(`${API_BASE}/registry/use`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
    } catch (e) {}
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

function setupFilters() {
    document.getElementById('ext-search').addEventListener('input', renderBuilder);
    document.getElementById('type-filter').addEventListener('change', renderBuilder);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Start
init();
