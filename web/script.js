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
            ? buildRawLink('extensions/catalogs/all.plugin.json')
            : buildRawLink(`extensions/catalogs/${type}.plugin.json`);

        try {
            await copyToClipboard(link);
            showToast(type === 'all'
                ? 'Đã sao chép link tổng all.plugin.json'
                : `Đã sao chép link plugin.json của nhóm ${type}`);
        } catch (error) {
            showToast('Không thể sao chép. Hãy thử lại hoặc copy thủ công.');
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
            showToast('Đã sao chép link plugin.json của extension');
        } catch (error) {
            showToast('Không thể sao chép. Hãy thử lại hoặc copy thủ công.');
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

function getDescription(ext) {
    return (ext && (ext.description || (ext.metadata && ext.metadata.description))) || '';
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
            getDescription(ext).toLowerCase().includes(search)
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

function formatCatalogUpdatedAt(isoString) {
    if (!isoString) {
        return '';
    }

    const parsed = new Date(isoString);
    if (Number.isNaN(parsed.getTime())) {
        return '';
    }

    return parsed.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function renderCatalogUpdatedTime() {
    const element = document.getElementById('catalog-updated');
    if (!element) {
        return;
    }

    const status = window.catalogStatus || {};
    const updatedLabel = formatCatalogUpdatedAt(status.updatedAt);

    if (!updatedLabel) {
        element.textContent = 'Cập nhật: chưa có dữ liệu';
        return;
    }

    const suffix = status.updatedAtSource === 'header' ? '' : ' (local)';
    element.textContent = `Cập nhật: ${updatedLabel}${suffix}`;
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeAuthorName(author) {
    return String(author || '')
        .normalize('NFKC')
        .trim()
        .replace(/\s+/g, ' ');
}

function normalizeAuthorKey(author) {
    return normalizeAuthorName(author).toLocaleLowerCase('vi');
}

const MOBILE_AUTHOR_PREVIEW_COUNT = 7;

function updateAuthorsMobileCollapse() {
    const listEl = document.getElementById('authors-list');
    const toggleEl = document.getElementById('authors-expand-toggle');
    if (!listEl || !toggleEl) {
        return;
    }

    const authorItems = listEl.querySelectorAll('.author-chip').length;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const shouldCollapse = isMobile && authorItems > MOBILE_AUTHOR_PREVIEW_COUNT;

    if (!shouldCollapse) {
        listEl.classList.remove('authors-list-collapsed', 'authors-list-expanded');
        toggleEl.classList.remove('show');
        toggleEl.setAttribute('aria-expanded', 'false');
        toggleEl.textContent = 'xem thêm';
        return;
    }

    toggleEl.classList.add('show');

    if (!listEl.classList.contains('authors-list-expanded')) {
        listEl.classList.add('authors-list-collapsed');
        toggleEl.setAttribute('aria-expanded', 'false');
        toggleEl.textContent = 'xem thêm';
        return;
    }

    listEl.classList.remove('authors-list-collapsed');
    toggleEl.setAttribute('aria-expanded', 'true');
    toggleEl.textContent = 'Thu gọn';
}

function setupAuthorsMobileToggle() {
    const listEl = document.getElementById('authors-list');
    const toggleEl = document.getElementById('authors-expand-toggle');
    if (!listEl || !toggleEl || toggleEl.dataset.bound === 'true') {
        return;
    }

    toggleEl.addEventListener('click', () => {
        const expanded = listEl.classList.toggle('authors-list-expanded');
        if (expanded) {
            listEl.classList.remove('authors-list-collapsed');
        } else {
            listEl.classList.add('authors-list-collapsed');
        }
        updateAuthorsMobileCollapse();
    });

    window.addEventListener('resize', updateAuthorsMobileCollapse);
    toggleEl.dataset.bound = 'true';
}

function renderAuthorAcknowledgement() {
    const listEl = document.getElementById('authors-list');
    const countEl = document.getElementById('authors-count');
    const topListEl = document.getElementById('authors-top-list');
    const shareListEl = document.getElementById('authors-share-list');

    if (!listEl || !countEl) {
        return;
    }

    const authorGroups = new Map();
    getAllExtensions().forEach((ext) => {
        const author = normalizeAuthorName(ext.author || '');
        if (!author) {
            return;
        }

        const key = normalizeAuthorKey(author);
        if (!authorGroups.has(key)) {
            authorGroups.set(key, { total: 0, variants: new Map() });
        }

        const group = authorGroups.get(key);
        group.total += 1;
        group.variants.set(author, (group.variants.get(author) || 0) + 1);
    });

    const authors = Array.from(authorGroups.values())
        .map((group) => {
            const displayAuthor = Array.from(group.variants.entries())
                .sort((a, b) => {
                    if (b[1] !== a[1]) {
                        return b[1] - a[1];
                    }
                    return a[0].localeCompare(b[0], 'vi');
                })[0][0];
            return [displayAuthor, group.total];
        })
        .sort((a, b) => {
            if (b[1] !== a[1]) {
                return b[1] - a[1];
            }
            return a[0].localeCompare(b[0], 'vi');
        });

    countEl.textContent = String(authors.length);

    const totalByAuthors = authors.reduce((sum, item) => sum + item[1], 0);

    if (authors.length === 0) {
        listEl.innerHTML = '<p class="authors-empty">Chưa có dữ liệu tác giả.</p>';
        if (topListEl) {
            topListEl.innerHTML = '<p class="authors-empty">Chưa có dữ liệu.</p>';
        }
        if (shareListEl) {
            shareListEl.innerHTML = '<p class="authors-empty">Chưa có dữ liệu.</p>';
        }
        updateAuthorsMobileCollapse();
        return;
    }

    if (topListEl) {
        const topAuthors = authors.slice(0, 3);
        topListEl.innerHTML = topAuthors
            .map(([author, total], index) =>
                `<article class="authors-top-item"><span class="authors-top-rank">#${index + 1}</span><span class="authors-top-name" title="${escapeHtml(author)}">${escapeHtml(author)}</span><span class="authors-top-value">${total} plugin</span></article>`
            )
            .join('');
    }

    if (shareListEl) {
        const topShares = authors.slice(0, 8);
        shareListEl.innerHTML = topShares
            .map(([author, total]) => {
                const ratio = totalByAuthors > 0 ? (total / totalByAuthors) * 100 : 0;
                const ratioLabel = `${ratio.toFixed(1)}%`;
                return `<li class="authors-share-item"><div class="authors-share-head"><span class="authors-share-name" title="${escapeHtml(author)}">${escapeHtml(author)}</span><span>${total} (${ratioLabel})</span></div><div class="authors-share-track"><div class="authors-share-fill" style="width:${ratio.toFixed(2)}%"></div></div></li>`;
            })
            .join('');
    }

    listEl.innerHTML = authors
        .map(([author, total]) =>
            `<li class="author-chip"><span class="author-name">${escapeHtml(author)}</span><span class="author-total">${total}</span></li>`
        )
        .join('');

    updateAuthorsMobileCollapse();
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
    const description = getDescription(ext);

    return `
        <div class="ext-card">
            <div class="ext-type-badge">${typeLabel}</div>
            <div class="ext-header">
                <h3 class="ext-name">${ext.name || 'Chưa đặt tên'}</h3>
                <span class="ext-version">v${ext.version || '0'}</span>
            </div>
            <p class="ext-author">Tác giả: ${ext.author || 'Không rõ'}</p>
            <p class="ext-description">${description || 'Chưa có mô tả'}</p>
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
    renderCatalogUpdatedTime();
    renderAuthorAcknowledgement();
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
    setupAuthorsMobileToggle();
});
