// Global state
let currentSort = 'name';
let currentTypeFilter = '';
let currentSearch = '';
let rawBaseUrl = '';

function detectRawBaseUrl() {
    const host = window.location.hostname;
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (host.endsWith('github.io')) {
        const owner = host.split('.')[0];
        const repo = pathParts[0] || 'vbook-ext';
        return `https://raw.githubusercontent.com/${owner}/${repo}/main`;
    }
    return 'https://raw.githubusercontent.com/kychitoge/vbook-ext/main';
}

function normalizeRawBaseUrl(value) {
    return (value || '').trim().replace(/\/$/, '');
}

function buildRawLink(path) {
    return `${normalizeRawBaseUrl(rawBaseUrl)}/${path}`;
}

async function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
    }

    // Fallback for non-secure contexts or browsers that block clipboard API.
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();

    const copied = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (!copied) {
        throw new Error('Clipboard copy failed');
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) {
        return;
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
}

function setupQuickLinkActions() {
    const copyQuickLinkBtn = document.getElementById('copy-quick-link');
    const unifiedSelect = document.getElementById('type-unified-select');

    if (!copyQuickLinkBtn || !unifiedSelect) {
        return;
    }

    rawBaseUrl = normalizeRawBaseUrl(detectRawBaseUrl());

    unifiedSelect.addEventListener('change', () => {
        const value = unifiedSelect.value;
        currentTypeFilter = value === 'all' ? '' : value;
        renderGrid();
    });

    copyQuickLinkBtn.addEventListener('click', async () => {
        const type = unifiedSelect.value;
        const link = type === 'all'
            ? buildRawLink('extensions/plugin.json')
            : buildRawLink(`extensions/catalogs/${type}.plugin.json`);

        try {
            await copyToClipboard(link);
            showToast(type === 'all'
                ? 'Da sao chep link plugin.json tong'
                : `Da sao chep link plugin.json cua ${type}`);
        } catch (error) {
            showToast('Khong the sao chep. Hay thu lai hoac copy thu cong.');
        }
    });

    document.addEventListener('click', async (event) => {
        const button = event.target.closest('.ext-copy-btn');
        if (!button) {
            return;
        }

        const pluginPath = button.getAttribute('data-plugin-path');
        if (!pluginPath) {
            return;
        }

        const link = buildRawLink(pluginPath);
        try {
            await copyToClipboard(link);
            showToast('Da sao chep link plugin.json cua extension');
        } catch (error) {
            showToast('Khong the sao chep. Hay thu lai hoac copy thu cong.');
        }
    });
}

function setupBackToTopButton() {
    const button = document.getElementById('back-to-top');
    if (!button) {
        return;
    }

    const toggleVisibility = () => {
        if (window.scrollY > 180) {
            button.classList.add('show');
        } else {
            button.classList.remove('show');
        }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    button.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    toggleVisibility();
}

function getAllExtensions() {
    const all = [];
    Object.keys(extensionCatalog).forEach((type) => {
        extensionCatalog[type].forEach((ext) => {
            all.push({ ...ext, type });
        });
    });
    return all;
}

function filterExtensions() {
    let all = getAllExtensions();

    if (currentTypeFilter) {
        all = all.filter((ext) => ext.type === currentTypeFilter);
    }

    if (currentSearch) {
        const search = currentSearch.toLowerCase();
        all = all.filter((ext) =>
            (ext.name || '').toLowerCase().includes(search) ||
            (ext.author || '').toLowerCase().includes(search) ||
            (ext.description || '').toLowerCase().includes(search)
        );
    }

    switch (currentSort) {
        case 'name':
            all.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
            break;
        case 'version':
            all.sort((a, b) => (b.version || 0) - (a.version || 0));
            break;
        case 'author':
            all.sort((a, b) => (a.author || '').localeCompare(b.author || '', 'vi'));
            break;
        default:
            break;
    }

    return all;
}

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

function renderCard(ext) {
    const typeLabels = {
        novel: '[TRUYỆN CHỮ]',
        comic: '[TRUYỆN TRANH]',
        chinese_novel: '[TRUYỆN TRUNG]',
        translate: '[DỊCH]',
        tts: '[TTS]',
        _unknown: '[KHÔNG RÕ]'
    };

    const typeLabel = typeLabels[ext.type] || ext.type;
    const pluginPath = ext.relativePath ? `${ext.relativePath}/plugin.json` : '';

    return `
        <div class="ext-card">
            <div class="ext-type-badge">${typeLabel}</div>
            <div class="ext-header">
                <h3 class="ext-name">${ext.name || 'Chưa đặt tên'}</h3>
                <span class="ext-version">v${ext.version || '0'}</span>
            </div>
            <p class="ext-author">Tác giả: ${ext.author || 'Không rõ'}</p>
            <p class="ext-description">${ext.description || 'Chưa có mô tả'}</p>
            <div class="ext-actions">
                ${ext.source ? `<a href="${ext.source}" target="_blank" class="ext-link">Nguồn</a>` : '<span class="ext-link" style="opacity:0.35;">Nguồn</span>'}
                ${pluginPath ? `<button class="ext-copy-btn" data-plugin-path="${pluginPath}">Copy Raw</button>` : '<span class="ext-copy-btn" style="opacity:0.35;">Copy Raw</span>'}
            </div>
            ${ext.relativePath ? `<div class="ext-path">${ext.relativePath}</div>` : ''}
        </div>
    `;
}

function renderGrid() {
    const grid = document.getElementById('extensions-grid');
    const extensions = filterExtensions();

    if (extensions.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; padding: 40px; text-align: center; color: #666;">
                <p style="font-size: 18px;">Không tìm thấy extension</p>
                <p style="font-size: 14px;">Hãy thử đổi từ khóa hoặc bộ lọc</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = extensions.map(renderCard).join('');
}

function renderDashboard() {
    renderStats();
    renderGrid();
}

document.getElementById('search-input').addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderGrid();
});

document.getElementById('sort-select').addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderGrid();
});

document.addEventListener('DOMContentLoaded', () => {
    setupQuickLinkActions();
    setupBackToTopButton();
});
