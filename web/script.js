let currentSearch = '';
let sourceViewEnabled = false;
let hideNsfwEnabled = true;
let selectedAuthorKeys = new Set();
let selectedLocales = new Set();
let selectedTypes = new Set();
let filterModalBound = false;
let draftSourceViewEnabled = false;
let draftHideNsfwEnabled = true;
let draftAuthorKeys = new Set();
let draftLocales = new Set();
let draftTypes = new Set();
let lockedBodyScrollY = 0;

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

function normalizeLocaleKey(locale) {
    const raw = String(locale || '_unknown').trim();
    if (!raw) {
        return '_unknown';
    }

    const normalized = raw.replace(/-/g, '_').toLowerCase();

    if (normalized.startsWith('vi') || normalized.startsWith('vn')) {
        return 'vi';
    }

    if (normalized.startsWith('zh')) {
        return 'zh';
    }

    if (normalized.startsWith('en')) {
        return 'en';
    }

    if (normalized === 'global') {
        return 'global';
    }

    return normalized;
}

function getLocaleDisplayLabel(localeKey) {
    if (localeKey === 'vi') {
        return 'Tiếng Việt';
    }

    if (localeKey === 'zh') {
        return '中文';
    }

    if (localeKey === 'en') {
        return 'English';
    }

    if (localeKey === 'global') {
        return 'global';
    }

    if (localeKey === '_unknown') {
        return 'Không rõ';
    }

    return localeKey;
}

function isNsfwExtension(ext) {
    if (!ext || typeof ext !== 'object') {
        return false;
    }

    const tagValue = typeof ext.tag === 'string' ? ext.tag.trim().toLowerCase() : '';
    return tagValue === 'nsfw';
}

function extensionMatchesStructuredFilters(ext) {
    if (!ext || typeof ext !== 'object') {
        return false;
    }

    const authorKey = normalizeAuthorKey(ext.author || '');
    const localeValue = normalizeLocaleKey(ext.locale || '_unknown');
    const typeValue = String(ext.type || '_unknown').trim() || '_unknown';

    if (hideNsfwEnabled && isNsfwExtension(ext)) {
        return false;
    }

    if (selectedAuthorKeys.size > 0 && !selectedAuthorKeys.has(authorKey)) {
        return false;
    }

    if (selectedLocales.size > 0 && !selectedLocales.has(localeValue)) {
        return false;
    }

    if (selectedTypes.size > 0 && !selectedTypes.has(typeValue)) {
        return false;
    }

    return true;
}

function filterExtensions() {
    let all = getAllExtensions().filter(extensionMatchesStructuredFilters);

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

    if (!sourceViewEnabled) {
        return [];
    }

    const hasSearch = Boolean(currentSearch);
    const search = currentSearch.toLowerCase();

    return sources
        .map((source) => {
            const extItems = Array.isArray(source.extItems) ? source.extItems : [];
            const structuredItems = extItems.filter(extensionMatchesStructuredFilters);

            if (!hasSearch) {
                return {
                    ...source,
                    extItems: structuredItems,
                    itemCount: structuredItems.length
                };
            }

            const sourceMatch =
                (source.displayName || '').toLowerCase().includes(search) ||
                (source.url || '').toLowerCase().includes(search);

            const searchedItems = structuredItems.filter((ext) =>
                (ext.name || '').toLowerCase().includes(search) ||
                (ext.author || '').toLowerCase().includes(search) ||
                (ext.source || '').toLowerCase().includes(search) ||
                getDescription(ext).toLowerCase().includes(search)
            );

            const visibleItems = searchedItems.length > 0 ? searchedItems : (sourceMatch ? structuredItems : []);

            return {
                ...source,
                extItems: visibleItems,
                itemCount: visibleItems.length
            };
        })
        .filter((source) => Array.isArray(source.extItems) && source.extItems.length > 0);
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
    element.style.display = 'none';
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

function getRepoDisplayPath(rawUrl) {
    try {
        const parsed = new URL(rawUrl);
        const parts = parsed.pathname.split('/').filter(Boolean);

        if (parsed.hostname.includes('raw.githubusercontent.com') && parts.length >= 2) {
            const owner = parts[0];
            const repo = parts[1];
            return `${owner}/${repo}`;
        }

        if (parsed.hostname.includes('gitlab.com') && parts.length >= 2) {
            const group = parts[0];
            const project = parts[1];
            return `${group}/${project}`;
        }
    } catch (_error) {
        return null;
    }

    return null;
}

function toRepoBrowseUrl(rawUrl) {
    try {
        const parsed = new URL(rawUrl);
        const parts = parsed.pathname.split('/').filter(Boolean);

        if (parsed.hostname.includes('raw.githubusercontent.com') && parts.length >= 4) {
            const owner = parts[0];
            const repo = parts[1];
            let branch = 'main';
            let path = '';

            if (parts[2] === 'refs' && parts[3] === 'heads' && parts.length >= 6) {
                branch = parts[4];
                path = parts.slice(5).join('/');
            } else {
                branch = parts[2];
                path = parts.slice(3).join('/');
            }

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

function extensionIconFallback(extName) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(extName || 'ext')}&background=f1f1f1&color=333333`;
}

function getSourceAvatarUrl(source) {
    if (source && source.avatar) {
        return source.avatar;
    }

    return avatarFromRawUrl(source && source.url ? source.url : '');
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
            const repoPath = getRepoDisplayPath(source.url || '');
            const displayLabel = repoPath || source.displayName || source.id || 'unknown-source';
            const fullLabel = source.displayName || source.id || source.url || 'unknown-source';
            const avatarUrl = getSourceAvatarUrl(source);
            const fallbackUrl = avatarFallback(fullLabel);
            return `<a class="repo-chip" href="${escapeHtml(browseUrl)}" target="_blank" rel="noopener noreferrer"><img class="repo-avatar" src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(fullLabel)} avatar" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${escapeHtml(fallbackUrl)}';"><span class="repo-chip-label" title="${escapeHtml(fullLabel)}">${escapeHtml(displayLabel)}</span></a>`;
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
    const description = getDescription(ext);
    const iconUrl = ext.icon || extensionIconFallback(ext.name || 'ext');
    const iconFallback = extensionIconFallback(ext.name || 'ext');
    const sourceLabel = ext.source || '';
    const sourceHost = sourceLabel ? getSourceHost(sourceLabel) : '';
    const siteHealthBadge = renderExtensionSiteHealthBadge(sourceLabel);
    const siteCopyButton = sourceLabel
        ? `<button class="ext-site-copy-btn" data-site-url="${escapeHtml(sourceLabel)}" aria-label="Copy URL site" title="Copy URL site">🔗</button>`
        : '<span class="ext-site-copy-btn ext-site-copy-btn-disabled" aria-hidden="true">🔗</span>';

    return `
        <div class="ext-card">
            <div class="ext-top-row">
                <div class="ext-type-badge">${escapeHtml(typeLabel)}</div>
                ${siteCopyButton}
            </div>
            <div class="ext-header">
                <div class="ext-icon-wrap">
                    <img class="ext-icon" src="${escapeHtml(iconUrl)}" alt="${escapeHtml(ext.name || 'Extension')} icon" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${escapeHtml(iconFallback)}';">
                </div>
                <div class="ext-title-wrap">
                    <h3 class="ext-name">${escapeHtml(ext.name || 'Chưa đặt tên')}</h3>
                    <p class="ext-site-url" title="${escapeHtml(sourceLabel || 'Không rõ nguồn')}">${escapeHtml(sourceHost || sourceLabel || 'Không rõ nguồn')}</p>
                    ${siteHealthBadge ? `<div class="ext-health-row">${siteHealthBadge}</div>` : ''}
                </div>
                <span class="ext-version">v${escapeHtml(ext.version || '0')}</span>
            </div>
            <p class="ext-author">Tác giả: ${escapeHtml(ext.author || 'Không rõ')}</p>
            <p class="ext-description">${escapeHtml(description || 'Chưa có mô tả')}</p>
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

function getExtensionSiteHealth(sourceUrl) {
    if (!sourceUrl) {
        return null;
    }

    const map = window.siteHealthByUrl || {};
    const key = typeof window.normalizeSiteUrlKey === 'function'
        ? window.normalizeSiteUrlKey(sourceUrl)
        : '';

    if (!key || !map[key]) {
        return null;
    }

    return map[key];
}

function getHealthBadgeClass(info) {
    const state = getUiHealthState(info);
    const confidence = String(info && info.confidence ? info.confidence : 'high').toLowerCase();

    const stateClassMap = {
        dead: 'ext-health-dead',
        cloudflare: 'ext-health-cloudflare',
        redirected: 'ext-health-redirected',
        uncertain: 'ext-health-uncertain'
    };

    const confidenceClassMap = {
        high: 'ext-health-confidence-high',
        medium: 'ext-health-confidence-medium',
        low: 'ext-health-confidence-low'
    };

    const stateClass = stateClassMap[state] || 'ext-health-unknown';
    const confidenceClass = confidenceClassMap[confidence] || 'ext-health-confidence-medium';
    return `${stateClass} ${confidenceClass}`;
}

function getHealthLabel(info) {
    const state = getUiHealthState(info);

    if (state === 'dead') {
        return 'Die';
    }

    if (state === 'cloudflare') {
        return 'Cloudflare/Bot';
    }

    if (state === 'redirected') {
        const label = info && info.finalHost ? escapeHtml(info.finalHost) : 'miền mới';
        return `Direct: ${label}`;
    }

    return '';
}

function getUiHealthState(info) {
    const rawState = String(info && info.state ? info.state : '').toLowerCase();

    if (rawState === 'dead' || rawState === 'cloudflare' || rawState === 'redirected') {
        return rawState;
    }

    if (rawState !== 'uncertain') {
        return rawState;
    }

    const evidence = Array.isArray(info && info.evidence) ? info.evidence : [];
    const hasRedirectEvidence = evidence.some((item) => {
        const type = String(item && item.type ? item.type : '').toLowerCase();
        return type === 'http_301_302_host_changed'
            || type === 'meta_refresh_cross_domain'
            || type === 'canonical_link_cross_domain'
            || type === 'migration_text_with_url';
    });

    if (hasRedirectEvidence) {
        return 'redirected';
    }

    return 'cloudflare';
}

function buildHealthTooltip(info) {
    const confidence = String(info && info.confidence ? info.confidence : 'unknown');
    const evidence = Array.isArray(info && info.evidence) ? info.evidence : [];
    const evidenceLabels = evidence
        .map((item) => `${item.type || 'unknown'} (${item.strength || 'unknown'})`)
        .slice(0, 4);

    const base = `Confidence: ${confidence}`;
    if (!evidenceLabels.length) {
        return base;
    }

    return `${base}\nEvidence: ${evidenceLabels.join(', ')}`;
}

function renderExtensionSiteHealthBadge(sourceUrl) {
    const info = getExtensionSiteHealth(sourceUrl);
    if (!info || !info.state) {
        return '';
    }
    const label = getHealthLabel(info);
    if (!label) {
        return '';
    }

    const badgeClass = getHealthBadgeClass(info);
    const tooltip = buildHealthTooltip(info);
    return `<span class="ext-health-badge ${badgeClass}" title="${escapeHtml(tooltip)}">${label}</span>`;
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
    const statusKind = status === 'error' ? 'error' : 'active';
    const statusLabel = statusKind === 'error' ? 'error' : 'active';
    const expanded = isSourceExpanded(source);
    const sourceTotal = source.itemCount || extItems.length;
    const previewItems = extItems.slice(0, expanded ? 4 : 3);
    const detailHtml = expanded && extItems.length
        ? `<ul class="source-ext-detail-list">${extItems.map(renderSourceExtDetail).join('')}</ul>`
        : (expanded ? '<p class="source-ext-empty">Không có ext trong nguồn này</p>' : '');
    const toggleAria = expanded ? 'Thu gọn thông tin nguồn' : 'Mở thông tin nguồn';
    const key = getSourceKey(source);
    const avatarUrl = getSourceAvatarUrl(source);
    const repoPath = getRepoDisplayPath(source.url || '');
    const displayLabel = repoPath || source.displayName || source.id || 'unknown-source';
    const fullLabel = source.displayName || source.id || source.url || 'unknown-source';
    const fallbackUrl = avatarFallback(fullLabel);

    return `
        <article class="source-card ${expanded ? 'is-expanded' : 'is-collapsed'}" data-source-key="${escapeHtml(key)}">
            <button class="source-toggle-btn" type="button" data-source-toggle="${escapeHtml(key)}" aria-expanded="${expanded ? 'true' : 'false'}" aria-label="${escapeHtml(toggleAria)}">
                <img class="source-card-avatar" src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(fullLabel)} avatar" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${escapeHtml(fallbackUrl)}'">
                <h3 class="source-name" title="${escapeHtml(fullLabel)}">${escapeHtml(displayLabel)}</h3>
                <div class="source-toggle-meta">
                    <span class="source-total-pill">${sourceTotal} ext</span>
                    <span class="source-status-indicator ${escapeHtml(statusKind)}"><span class="source-status-dot" aria-hidden="true"></span><span class="source-status-text">${escapeHtml(statusLabel)}</span></span>
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
    if (sourceViewEnabled) {
        renderSourceView();
        return;
    }

    renderGrid();
}

function getAuthorFilterOptions() {
    const authorGroups = new Map();
    getAllExtensions().forEach((ext) => {
        const author = normalizeAuthorName(ext.author || '');
        const authorKey = normalizeAuthorKey(author);
        if (!authorKey) {
            return;
        }

        if (!authorGroups.has(authorKey)) {
            authorGroups.set(authorKey, { label: author, total: 0 });
        }
        authorGroups.get(authorKey).total += 1;
    });

    return Array.from(authorGroups.entries())
        .map(([value, info]) => ({ value, label: info.label, total: info.total }))
        .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
}

function getLocaleFilterOptions() {
    const localeMap = new Map();
    getAllExtensions().forEach((ext) => {
        const localeKey = normalizeLocaleKey(ext.locale || '_unknown');
        localeMap.set(localeKey, (localeMap.get(localeKey) || 0) + 1);
    });

    return Array.from(localeMap.entries())
        .map(([value, total]) => ({ value, label: `${getLocaleDisplayLabel(value)} (${total})` }))
        .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
}

function getTypeFilterOptions() {
    const typeSet = new Set();
    getAllExtensions().forEach((ext) => {
        typeSet.add(String(ext.type || '_unknown').trim() || '_unknown');
    });

    return Array.from(typeSet)
        .map((value) => ({ value, label: getSourceTypeLabel(value) }))
        .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
}

function renderFilterChipList(containerId, groupName, options, selectedSet) {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }

    const allChip = `<button type="button" class="filter-chip ${selectedSet.size === 0 ? 'active' : ''}" data-filter-group="${groupName}" data-filter-value="__all">Tất cả</button>`;
    const optionChips = options
        .map((item) => `<button type="button" class="filter-chip ${selectedSet.has(item.value) ? 'active' : ''}" data-filter-group="${groupName}" data-filter-value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</button>`)
        .join('');

    container.innerHTML = allChip + optionChips;
}

function updateFilterButtonLabel() {
    const button = document.getElementById('open-filter-btn');
    if (!button) {
        return;
    }

    const totalSelected = selectedAuthorKeys.size + selectedLocales.size + selectedTypes.size;
    button.textContent = totalSelected > 0 ? `Lọc (${totalSelected})` : 'Lọc';
}

function openFilterModal() {
    const modal = document.getElementById('filter-modal');
    const sourceSwitch = document.getElementById('filter-source-switch');
    const nsfwSwitch = document.getElementById('filter-nsfw-switch');
    if (!modal || !sourceSwitch || !nsfwSwitch) {
        return;
    }

    draftAuthorKeys = new Set(selectedAuthorKeys);
    draftLocales = new Set(selectedLocales);
    draftTypes = new Set(selectedTypes);
    draftSourceViewEnabled = sourceViewEnabled;
    draftHideNsfwEnabled = hideNsfwEnabled;

    renderFilterChipList('filter-authors', 'author', getAuthorFilterOptions(), draftAuthorKeys);
    renderFilterChipList('filter-locales', 'locale', getLocaleFilterOptions(), draftLocales);
    renderFilterChipList('filter-types', 'type', getTypeFilterOptions(), draftTypes);
    sourceSwitch.checked = draftSourceViewEnabled;
    nsfwSwitch.checked = draftHideNsfwEnabled;

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    lockedBodyScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.classList.add('filter-open');
    document.body.style.top = `-${lockedBodyScrollY}px`;
}

function closeFilterModal() {
    const modal = document.getElementById('filter-modal');
    if (!modal) {
        return;
    }

    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('filter-open');
    document.body.style.top = '';
    window.scrollTo(0, lockedBodyScrollY);
}

function applyFilterModal() {
    selectedAuthorKeys = new Set(draftAuthorKeys);
    selectedLocales = new Set(draftLocales);
    selectedTypes = new Set(draftTypes);
    sourceViewEnabled = draftSourceViewEnabled;
    hideNsfwEnabled = draftHideNsfwEnabled;

    updateFilterButtonLabel();
    closeFilterModal();
    renderActiveView();
}

function toggleDraftFilter(groupName, value) {
    const targetSet = groupName === 'author'
        ? draftAuthorKeys
        : (groupName === 'locale' ? draftLocales : draftTypes);

    if (value === '__all') {
        targetSet.clear();
    } else if (targetSet.has(value)) {
        targetSet.delete(value);
    } else {
        targetSet.add(value);
    }

    if (groupName === 'author') {
        renderFilterChipList('filter-authors', 'author', getAuthorFilterOptions(), draftAuthorKeys);
    } else if (groupName === 'locale') {
        renderFilterChipList('filter-locales', 'locale', getLocaleFilterOptions(), draftLocales);
    } else {
        renderFilterChipList('filter-types', 'type', getTypeFilterOptions(), draftTypes);
    }
}

function setupFilterModal() {
    const openButton = document.getElementById('open-filter-btn');
    const modal = document.getElementById('filter-modal');
    const applyButton = document.getElementById('filter-apply-btn');
    const cancelButton = document.getElementById('filter-cancel-btn');
    const sourceSwitch = document.getElementById('filter-source-switch');
    const nsfwSwitch = document.getElementById('filter-nsfw-switch');
    if (!openButton || !modal || !applyButton || !cancelButton || !sourceSwitch || !nsfwSwitch) {
        return;
    }

    updateFilterButtonLabel();

    if (filterModalBound) {
        return;
    }

    openButton.addEventListener('click', openFilterModal);
    applyButton.addEventListener('click', applyFilterModal);
    cancelButton.addEventListener('click', closeFilterModal);

    sourceSwitch.addEventListener('change', () => {
        draftSourceViewEnabled = sourceSwitch.checked;
    });

    nsfwSwitch.addEventListener('change', () => {
        draftHideNsfwEnabled = nsfwSwitch.checked;
    });

    modal.addEventListener('click', (event) => {
        const closeTarget = event.target.closest('[data-filter-close="true"]');
        if (closeTarget) {
            closeFilterModal();
            return;
        }

        const chip = event.target.closest('.filter-chip[data-filter-group][data-filter-value]');
        if (!chip) {
            return;
        }

        const groupName = chip.getAttribute('data-filter-group');
        const value = chip.getAttribute('data-filter-value');
        if (!groupName || !value) {
            return;
        }

        toggleDraftFilter(groupName, value);
    });

    filterModalBound = true;
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
        const siteCopyButton = event.target.closest('.ext-site-copy-btn[data-site-url]');
        if (siteCopyButton) {
            const siteUrl = siteCopyButton.getAttribute('data-site-url');
            try {
                await copyToClipboard(siteUrl);
                showToast('Đã copy URL site');
            } catch (_error) {
                showToast('Không thể copy URL site');
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
    setupFilterModal();
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
