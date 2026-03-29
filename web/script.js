// Global state
let filteredExtensions = [];
let currentSort = 'name';
let currentTypeFilter = '';
let currentSearch = '';

// Get all extensions as flat array
function getAllExtensions() {
    let all = [];
    Object.keys(extensionCatalog).forEach(type => {
        extensionCatalog[type].forEach(ext => {
            all.push({ ...ext, type });
        });
    });
    return all;
}

// Filter extensions
function filterExtensions() {
    let all = getAllExtensions();
    
    // Filter by type
    if (currentTypeFilter) {
        all = all.filter(ext => ext.type === currentTypeFilter);
    }
    
    // Filter by search
    if (currentSearch) {
        const search = currentSearch.toLowerCase();
        all = all.filter(ext => 
            (ext.name || '').toLowerCase().includes(search) ||
            (ext.author || '').toLowerCase().includes(search) ||
            (ext.description || '').toLowerCase().includes(search)
        );
    }
    
    // Sort
    switch(currentSort) {
        case 'name':
            all.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
            break;
        case 'version':
            all.sort((a, b) => (b.version || 0) - (a.version || 0));
            break;
        case 'author':
            all.sort((a, b) => (a.author || '').localeCompare(b.author || '', 'vi'));
            break;
    }
    
    filteredExtensions = all;
    return all;
}

// Render stats
function renderStats() {
    const all = getAllExtensions();
    
    document.getElementById('total-extensions').textContent = all.length;
    document.getElementById('novel-count').textContent = extensionCatalog.novel.length;
    document.getElementById('comic-count').textContent = extensionCatalog.comic.length;
    document.getElementById('chinese-count').textContent = extensionCatalog.chinese_novel.length;
    
    const otherCount = 
        (extensionCatalog.translate?.length || 0) +
        (extensionCatalog.tts?.length || 0) +
        (extensionCatalog._unknown?.length || 0);
    document.getElementById('other-count').textContent = otherCount;
}

// Render extension card
function renderCard(ext) {
    const typeLabels = {
        novel: '[NOVEL]',
        comic: '[COMIC]',
        chinese_novel: '[CHINESE]',
        translate: '[TRANS]',
        tts: '[TTS]',
        _unknown: '[UNKNOWN]'
    };
    
    const typeLabel = typeLabels[ext.type] || ext.type;
    
    return `
        <div class="ext-card">
            <div class="ext-type-badge">${typeLabel}</div>
            <div class="ext-header">
                <h3 class="ext-name">${ext.name || 'Unnamed'}</h3>
                <span class="ext-version">v${ext.version || '0'}</span>
            </div>
            <p class="ext-author">Author: ${ext.author || 'Unknown'}</p>
            <p class="ext-description">${ext.description || 'No description'}</p>
            ${ext.source ? `<a href="${ext.source}" target="_blank" class="ext-link">View Source</a>` : ''}
            ${ext.relativePath ? `<div class="ext-path">${ext.relativePath}</div>` : ''}
        </div>
    `;
}

// Render grid
function renderGrid() {
    const grid = document.getElementById('extensions-grid');
    const extensions = filterExtensions();
    
    if (extensions.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; padding: 40px; text-align: center; color: #666;">
                <p style="font-size: 18px;">No extensions found</p>
                <p style="font-size: 14px;">Try changing your search or filters</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = extensions.map(renderCard).join('');
}

// Render all
function renderDashboard() {
    renderStats();
    renderGrid();
}

// Event listeners
document.getElementById('search-input').addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderGrid();
});

document.getElementById('type-filter').addEventListener('change', (e) => {
    currentTypeFilter = e.target.value;
    renderGrid();
});

document.getElementById('sort-select').addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderGrid();
});

// Render on load
document.addEventListener('DOMContentLoaded', () => {
    // Wait for data.js to load extensions
    setTimeout(renderDashboard, 100);
});
