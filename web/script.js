let currentSearch = '';
let currentViewMode = 'extension';
let viewModeBound = false;

async function copyToClipboard(text) {
    if (!text) {
        throw new Error('Nothing to copy');
    }

    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
    }

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

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getDescription(ext) {
    return (ext && (ext.description || (ext.metadata && ext.metadata.description))) || '';
}

function getAllExtensions() {
    return Array.isArray(window.catalogExtensions) ? window.catalogExtensions.slice() : [];
}

function filterExtensions() {
    let all = getAllExtensions();

    if (currentSearch) {
        const search = currentSearch.toLowerCase();
        all = all.filter((ext) =>
            (ext.name || '').toLowerCase().includes(search) ||
            (ext.author || '').toLowerCase().includes(search) ||
            (ext.source || '').toLowerCase().includes(search) ||
            getDescription(ext).toLowerCase().includes(search)
        );
    }

    all.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
    return all;
}

function filterSources() {
    let sources = Array.isArray(window.catalogSources) ? window.catalogSources.slice() : [];

    if (!currentSearch) {
        return sources;
    }

    const search = currentSearch.toLowerCase();
    return sources.filter((source) => {
        if ((source.displayName || '').toLowerCase().includes(search)) {
            return true;
        }

        if ((source.url || '').toLowerCase().includes(search)) {
            return true;
        }

        const extItems = Array.isArray(source.extItems) ? source.extItems : [];
        return extItems.some((ext) =>
            (ext.name || '').toLowerCase().includes(search) ||
            (ext.source || '').toLowerCase().includes(search)
        );
    });
}

function getAuthorDisplayName(author) {
    return normalizeAuthorName(author || '');
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

function renderStats() {
    const all = getAllExtensions();

    document.getElementById('total-extensions').textContent = all.length;
    document.getElementById('novel-count').textContent = extensionCatalog.novel.length;
    document.getElementById('comic-count').textContent = extensionCatalog.comic.length;
    document.getElementById('chinese-count').textContent = extensionCatalog.chinese_novel.length;

    const otherCount =
        (extensionCatalog.translate && extensionCatalog.translate.length ? extensionCatalog.translate.length : 0) +
        (extensionCatalog.tts && extensionCatalog.tts.length ? extensionCatalog.tts.length : 0) +
        (extensionCatalog._unknown && extensionCatalog._unknown.length ? extensionCatalog._unknown.length : 0);

    document.getElementById('other-count').textContent = otherCount;
}

function renderSourceRepoCount() {
    const info = document.getElementById('source-repo-count');
    if (!info) {
        return;
    }

    const repoTotal = Array.isArray(window.catalogSources) ? window.catalogSources.length : 0;
    info.textContent = `Repo nguồn: ${repoTotal}`;
}

function renderAggregateButton() {
    const button = document.getElementById('copy-aggregate-btn');
    if (!button) {
        return;
    }

    const copyUrl = window.catalogMeta && window.catalogMeta.aggregateCopyUrl ? window.catalogMeta.aggregateCopyUrl : '';
    button.disabled = !copyUrl;
    button.setAttribute('data-copy-url', copyUrl);
}

function toRepoBrowseUrl(rawUrl) {
    try {
        const parsed = new URL(rawUrl);
        const parts = parsed.pathname.split('/').filter(Boolean);

        if (parsed.hostname.includes('raw.githubusercontent.com') && parts.length >= 4) {
            const owner = parts[0];
            const repo = parts[1];
            const branch = parts[3];
            const path = parts.slice(4).join('/');
            return `https://github.com/${owner}/${repo}/blob/${branch}/${path}`;
        }

        if (parsed.hostname.includes('gitlab.com') && parts.length >= 4 && parts[2] === '-' && parts[3] === 'raw') {
            const group = parts[0];
            const project = parts[1];
            const branch = parts[4] || 'main';
            const path = parts.slice(5).join('/');
            return `https://gitlab.com/${group}/${project}/-/blob/${branch}/${path}`;
        }
    } catch (_error) {
        return rawUrl;
    }

    return rawUrl;
}

function avatarFromRawUrl(rawUrl) {
    try {
        const parsed = new URL(rawUrl);
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parsed.hostname.includes('raw.githubusercontent.com') && parts.length >= 1) {
            return `https://avatars.githubusercontent.com/${parts[0]}?size=80`;
        }
        if (parsed.hostname.includes('gitlab.com') && parts.length >= 1) {
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(parts[0])}&background=f1f1f1&color=333333`;
        }
    } catch (_error) {
        return 'https://ui-avatars.com/api/?name=repo&background=f1f1f1&color=333333';
    }
    return 'https://ui-avatars.com/api/?name=repo&background=f1f1f1&color=333333';
}

function avatarFallback(label) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(label || 'repo')}&background=f1f1f1&color=333333`;
}

function renderContributeSection() {
    const repoListEl = document.getElementById('repo-list');
    const countEl = document.getElementById('contribute-source-count');
    const referenceListLinkEl = document.getElementById('reference-list-link');
    if (!repoListEl || !countEl) {
        return;
    }

    const sources = Array.isArray(window.catalogSources) ? window.catalogSources : [];
    countEl.textContent = `${sources.length} nguồn`;

    repoListEl.innerHTML = sources
        .map((source) => {
            const browseUrl = toRepoBrowseUrl(source.url || '');
            const label = source.displayName || source.id || source.url || 'unknown-source';
            const avatarUrl = avatarFromRawUrl(source.url || '');
            const fallbackUrl = avatarFallback(label);
            return `<a class="repo-chip" href="${escapeHtml(browseUrl)}" target="_blank" rel="noopener noreferrer"><img class="repo-avatar" src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(label)} avatar" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${escapeHtml(fallbackUrl)}';"><span class="repo-chip-label" title="${escapeHtml(label)}">${escapeHtml(label)}</span></a>`;
        })
        .join('');

    if (!sources.length) {
        repoListEl.innerHTML = '<p class="authors-empty">Chưa có nguồn tham chiếu.</p>';
    }

    if (referenceListLinkEl) {
        const referenceListUrl = window.catalogMeta && window.catalogMeta.referenceListUrl
            ? window.catalogMeta.referenceListUrl
            : '';
        if (referenceListUrl) {
            referenceListLinkEl.href = referenceListUrl;
            referenceListLinkEl.style.display = 'inline-flex';
        } else {
            referenceListLinkEl.style.display = 'none';
        }
    }
}

function renderCard(ext) {
    const typeLabels = {
        novel: 'TRUYỆN CHỮ',
        comic: 'TRUYỆN TRANH',
        chinese_novel: 'TRUYỆN TRUNG',
        translate: 'DỊCH',
        tts: 'TTS',
        _unknown: 'KHÔNG RÕ'
    };

    const typeLabel = typeLabels[ext.type] || ext.type;
    const extensionUrl = ext.path || '';
    const description = getDescription(ext);

    return `
        <div class="ext-card">
            <div class="ext-type-badge">${escapeHtml(typeLabel)}</div>
            <div class="ext-header">
                <h3 class="ext-name">${escapeHtml(ext.name || 'Chưa đặt tên')}</h3>
                <span class="ext-version">v${escapeHtml(ext.version || '0')}</span>
            </div>
            <p class="ext-author">Tác giả: ${escapeHtml(ext.author || 'Không rõ')}</p>
            <p class="ext-description">${escapeHtml(description || 'Chưa có mô tả')}</p>
            <div class="ext-actions">
                ${ext.source ? `<a href="${escapeHtml(ext.source)}" target="_blank" class="ext-link">Site URL</a>` : '<span class="ext-link ext-link-disabled">Site URL</span>'}
                ${extensionUrl ? `<button class="ext-copy-btn" data-copy-url="${escapeHtml(extensionUrl)}">Copy Ext</button>` : '<span class="ext-copy-btn ext-link-disabled">Copy Ext</span>'}
            </div>
        </div>
    `;
}

const SOURCE_TYPE_LABELS = {
    novel: 'Truyện chữ',
    comic: 'Truyện tranh',
    chinese_novel: 'Truyện Trung',
    translate: 'Dịch',
    tts: 'TTS',
    _unknown: 'Khác'
};

function getSourceTypeLabel(type) {
    return SOURCE_TYPE_LABELS[type] || type || 'Khác';
}

function getSourceHost(url) {
    try {
        const parsed = new URL(url);
        return parsed.hostname || 'Unknown host';
    } catch (_error) {
        return 'Unknown host';
    }
}

function summarizeSourceTypes(extItems) {
    const counts = new Map();
    (extItems || []).forEach((ext) => {
        const type = ext && ext.type ? ext.type : '_unknown';
        counts.set(type, (counts.get(type) || 0) + 1);
    });

    return Array.from(counts.entries())
        .sort((a, b) => {
            if (b[1] !== a[1]) {
                return b[1] - a[1];
            }
            return a[0].localeCompare(b[0], 'vi');
        })
        .map(([type, total]) => ({ type, total }));
}

function renderSourceExtBadge(ext) {
    const type = ext.type || '_unknown';
    return `
        <li class="source-ext-pill source-ext-pill-${escapeHtml(type)}">
            <span class="source-ext-name">${escapeHtml(ext.name || 'Unknown')}</span>
        </li>
    `;
}

function renderSourceExtDetail(ext) {
    const type = ext.type || '_unknown';
    return `
        <li class="source-ext-detail">
            <div class="source-ext-detail-head">
                <span class="source-ext-detail-name">${escapeHtml(ext.name || 'Unknown')}</span>
                <span class="source-ext-detail-meta">${escapeHtml(getSourceTypeLabel(type))}</span>
            </div>
            <div class="source-ext-detail-inline">
                <span>Tác giả: <strong>${escapeHtml(ext.author || 'Không rõ')}</strong></span>
                <span>Phiên bản: <strong>v${escapeHtml(ext.version || '0')}</strong></span>
            </div>
        </li>
    `;
}

function getSourceKey(source) {
    return source && (source.id || source.url || source.displayName) ? (source.id || source.url || source.displayName) : '';
}

function isSourceExpanded(source) {
    const key = getSourceKey(source);
    return Boolean(key && window.catalogSourceExpandedState && window.catalogSourceExpandedState[key]);
}

function renderSourceCard(source) {
    const extItems = Array.isArray(source.extItems) ? source.extItems : [];
    const status = (source.status || '').trim().toLowerCase();
    const statusLabel = status && status !== 'unchanged' ? status : '';
    const expanded = isSourceExpanded(source);
    const sourceTotal = source.itemCount || extItems.length;
    const previewItems = extItems.slice(0, expanded ? 4 : 3);
    const detailHtml = expanded && extItems.length
        ? `<ul class="source-ext-detail-list">${extItems.map(renderSourceExtDetail).join('')}</ul>`
        : (expanded ? '<p class="source-ext-empty">Không có ext trong nguồn này</p>' : '');
    const toggleAria = expanded ? 'Thu gọn thông tin nguồn' : 'Mở thông tin nguồn';
    const key = getSourceKey(source);

    return `
        <article class="source-card ${expanded ? 'is-expanded' : 'is-collapsed'}" data-source-key="${escapeHtml(key)}">
            <button class="source-toggle-btn" type="button" data-source-toggle="${escapeHtml(key)}" aria-expanded="${expanded ? 'true' : 'false'}" aria-label="${escapeHtml(toggleAria)}">
                <h3 class="source-name" title="${escapeHtml(source.displayName)}">${escapeHtml(source.displayName)}</h3>
                <div class="source-toggle-meta">
                    <span class="source-total-pill">${sourceTotal} ext</span>
                    ${statusLabel ? `<span class="source-status ${escapeHtml(statusLabel)}">${escapeHtml(statusLabel)}</span>` : ''}
                    <span class="source-toggle-icon">${expanded ? '−' : '+'}</span>
                </div>
            </button>
            <ul class="source-ext-preview-list">
                ${previewItems.map(renderSourceExtBadge).join('')}
            </ul>
            ${extItems.length > previewItems.length ? `<p class="source-preview-note">+${extItems.length - previewItems.length} extension khác</p>` : ''}
            ${detailHtml}
            <div class="source-actions">
                <button class="source-copy-btn" data-source-url="${escapeHtml(source.url)}">Copy Source</button>
            </div>
        </article>
    `;
}

function renderGrid() {
    const grid = document.getElementById('extensions-grid');
    const extensions = filterExtensions();

    if (extensions.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; padding: 40px; text-align: center; color: #666;">
                <p style="font-size: 18px;">Không tìm thấy extension</p>
                <p style="font-size: 14px;">Hãy thử đổi từ khóa</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = extensions.map(renderCard).join('');
}

function renderSourceView() {
    const grid = document.getElementById('extensions-grid');
    const sources = filterSources();

    if (!sources.length) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; padding: 40px; text-align: center; color: #666;">
                <p style="font-size: 18px;">Không tìm thấy source</p>
                <p style="font-size: 14px;">Hãy thử đổi từ khóa</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = sources.map(renderSourceCard).join('');
}

function renderActiveView() {
    if (currentViewMode === 'source') {
        renderSourceView();
        return;
    }

    renderGrid();
}

function setupViewModeToggle() {
    const modeSelect = document.getElementById('view-mode-select');
    if (!modeSelect) {
        return;
    }

    const hasSources = Array.isArray(window.catalogSources) && window.catalogSources.length > 0;
    const sourceOption = modeSelect.querySelector('option[value="source"]');
    const extensionOption = modeSelect.querySelector('option[value="extension"]');
    const isCompact = window.matchMedia('(max-width: 768px)').matches;

    if (sourceOption) {
        sourceOption.disabled = !hasSources;
        sourceOption.textContent = hasSources
            ? (isCompact ? 'By Source' : 'Hiển thị: By Source')
            : (isCompact ? 'No Source' : 'Hiển thị: By Source (chưa có dữ liệu)');
    }

    if (extensionOption) {
        extensionOption.textContent = isCompact ? 'By Ext' : 'Hiển thị: By Ext';
    }

    modeSelect.value = currentViewMode;

    if (viewModeBound) {
        return;
    }

    modeSelect.addEventListener('change', () => {
        const requestedMode = modeSelect.value;
        if (requestedMode === 'source' && !hasSources) {
            modeSelect.value = 'extension';
            currentViewMode = 'extension';
            return;
        }

        currentViewMode = requestedMode;
        renderActiveView();
    });

    viewModeBound = true;
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput || searchInput.dataset.bound === 'true') {
        return;
    }

    searchInput.addEventListener('input', (event) => {
        currentSearch = event.target.value || '';
        renderActiveView();
    });

    searchInput.dataset.bound = 'true';
}

function setupCopyActions() {
    document.addEventListener('click', async (event) => {
        const extButton = event.target.closest('.ext-copy-btn[data-copy-url]');
        if (extButton) {
            const copyUrl = extButton.getAttribute('data-copy-url');
            try {
                await copyToClipboard(copyUrl);
                showToast('Đã copy link ext');
            } catch (_error) {
                showToast('Không thể copy ext');
            }
            return;
        }

        const sourceButton = event.target.closest('.source-copy-btn[data-source-url]');
        if (sourceButton) {
            const sourceUrl = sourceButton.getAttribute('data-source-url');
            try {
                await copyToClipboard(sourceUrl);
                showToast('Đã copy link source');
            } catch (_error) {
                showToast('Không thể copy source');
            }
            return;
        }

        const sourceToggle = event.target.closest('[data-source-toggle]');
        if (sourceToggle) {
            const key = sourceToggle.getAttribute('data-source-toggle');
            if (!key) {
                return;
            }

            if (!window.catalogSourceExpandedState) {
                window.catalogSourceExpandedState = {};
            }

            window.catalogSourceExpandedState[key] = !window.catalogSourceExpandedState[key];
            renderActiveView();
            return;
        }

        const sourceCard = event.target.closest('.source-card[data-source-key]');
        if (sourceCard) {
            if (event.target.closest('.source-copy-btn, .source-toggle-btn, a, button')) {
                return;
            }

            const key = sourceCard.getAttribute('data-source-key');
            if (!key) {
                return;
            }

            if (!window.catalogSourceExpandedState) {
                window.catalogSourceExpandedState = {};
            }

            window.catalogSourceExpandedState[key] = !window.catalogSourceExpandedState[key];
            renderActiveView();
            return;
        }

        const aggregateButton = event.target.closest('#copy-aggregate-btn[data-copy-url]');
        if (aggregateButton) {
            const aggregateUrl = aggregateButton.getAttribute('data-copy-url');
            try {
                await copyToClipboard(aggregateUrl);
                showToast('Đã copy link tổng');
            } catch (_error) {
                showToast('Không thể copy link tổng');
            }
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

function renderDashboard() {
    renderStats();
    renderCatalogUpdatedTime();
    renderSourceRepoCount();
    renderAggregateButton();
    renderContributeSection();
    renderAuthorAcknowledgement();
    setupViewModeToggle();
    renderActiveView();
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

document.addEventListener('DOMContentLoaded', () => {
    setupSearch();
    setupCopyActions();
    setupBackToTopButton();
    setupAuthorsMobileToggle();
});
