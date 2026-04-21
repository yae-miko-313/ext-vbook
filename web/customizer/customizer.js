let lockedBodyScrollY = 0;
/**
 * CONFIGURATION: Decouple Frontend from Backend
 * Set this to your Vercel API URL if hosting frontend separately (e.g., GitHub Pages)
 */
const API_BASE_URL = window.location.origin; // Dynamically use the same domain for API calls

let currentSearch = '';
let hideNsfwEnabled = true; // Default: 18+ is hidden
let selectedAuthorKeys = new Set();
let selectedLocales = new Set();
let selectedTypes = new Set();
let filterModalBound = false;
let draftHideNsfwEnabled = true;
let draftAuthorKeys = new Set();
let draftLocales = new Set();
let draftTypes = new Set();

// BETA CUSTOMIZER STATE
let currentTab = 'extensions'; // extensions, sources, market
let selectedExtIds = new Set();
let marketplaceData = [];
let marketSearch = '';
let marketSort = 'usage';

let extensionCatalog = {
    novel: [],
    comic: [],
    chinese_novel: [],
    translate: [],
    tts: [],
    _unknown: []
};

// Performance Memoization
let memoizedFilterOptions = {
    authors: null,
    locales: null,
    types: null
};

let memoizedStats = null;
let gridRenderVersion = 0;

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

function getActiveCatalogSources() {
    const sources = Array.isArray(window.catalogSources) ? window.catalogSources : [];
    return sources.filter((source) => String(source && source.status ? source.status : '').toLowerCase() !== 'error');
}

/**
 * NEW: Dynamic API Fetching
 */
/**
 * NEW: Dynamic API Fetching with SWR (Silence While Refreshing)
 */
async function fetchAppData(isRefresh = false) {
    if (!isRefresh) renderLoadingState();
    console.log(`[API] ${isRefresh ? 'Background Refreshing' : 'Initializing dynamic fetch'}...`);

    try {
        const catalogUrl = `${API_BASE_URL}/api/catalog.json?v=beta`;
        const healthUrl = `${API_BASE_URL}/api/health?v=beta`;

        // Parallel fetch
        const [catalogRes, healthRes] = await Promise.all([
            fetch(catalogUrl).then(async r => {
                if (!r.ok) throw new Error(`Catalog API failed: ${r.status}`);
                return r.json();
            }),
            fetch(healthUrl).then(async r => {
                if (!r.ok) return { sources: [] };
                return r.json();
            }).catch(() => ({ sources: [] }))
        ]);

        if (catalogRes.error) {
            if (!isRefresh) throw new Error(catalogRes.error);
            console.warn('[API] Background refresh failed:', catalogRes.error);
            return;
        }

        // Process Health
        const newHealth = {};
        const embeddedHealth = catalogRes.catalog?.siteHealth;
        if (embeddedHealth) {
            Object.entries(embeddedHealth).forEach(([url, s]) => {
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
        if (healthRes.sites) {
            Object.entries(healthRes.sites).forEach(([url, s]) => {
                const key = normalizeSiteUrlKey(url);
                if (key && !newHealth[key]) newHealth[key] = s;
            });
        }

        // Atomic Update: If this is a refresh, only update tags to avoid jumping UI
        if (isRefresh) {
            console.log('[API] Background refresh complete. Patching UI...');
            window.catalogExtensions = catalogRes.plugin?.data || [];
            window.catalogSources = catalogRes.catalog?.sources || [];
            window.siteHealthByUrl = newHealth;

            patchHealthBadges();
            return;
        }

        // Store globally
        window.catalogExtensions = catalogRes.plugin?.data || [];
        window.catalogSources = catalogRes.catalog?.sources || [];
        window.siteHealthByUrl = newHealth;

        // First Load with data
        categorizeExtensions();
        memoizedFilterOptions = { authors: null, locales: null, types: null };
        memoizedStats = null;

        clearLoadingState();
        renderDashboard();

        // Trigger silent background refresh to get fresh health data from backend background scan
        setTimeout(() => fetchAppData(true), 5000);

    } catch (e) {
        console.error('[API] Fetch Error:', e);

        if (!isRefresh) {
            const grid = document.getElementById('extensions-grid');
            if (grid) {
                grid.innerHTML = `
                    <div class="error-state" style="grid-column: 1/-1; padding: 60px 20px; text-align: center;">
                        <div style="font-size: 40px; margin-bottom: 20px;">📡</div>
                        <h3 style="color: var(--color-text); margin-bottom: 10px;">Không thể kết nối máy chủ</h3>
                        <p style="color: var(--color-text-tertiary); margin-bottom: 24px; font-size: 14px;">${e.message}</p>
                        <button onclick="fetchAppData()" class="btn-primary" style="padding: 10px 24px;">Thử lại</button>
                    </div>
                `;
            }
        }
    }
}

/**
 * NEW: Patch only health badges for silent updates
 */
function patchHealthBadges() {
    const cards = document.querySelectorAll('.ext-card');
    cards.forEach(card => {
        const sourceUrl = card.getAttribute('data-source-url');
        if (!sourceUrl) return;

        const badgeContainer = card.querySelector('.ext-health-badge-container');
        if (badgeContainer) {
            const newHtml = renderExtensionSiteHealthBadge(sourceUrl);
            if (badgeContainer.innerHTML.trim() !== newHtml.trim()) {
                badgeContainer.innerHTML = newHtml;
            }
        }
    });
}

function categorizeExtensions() {
    const all = getAllExtensions();
    // Reset
    Object.keys(extensionCatalog).forEach(k => extensionCatalog[k] = []);

    all.forEach(ext => {
        let type = ext.type || '_unknown';
        if (type === 'chinese_novel' || type === 'chinese') {
            type = 'novel';
        }

        if (extensionCatalog[type]) {
            extensionCatalog[type].push(ext);
        } else {
            extensionCatalog._unknown.push(ext);
        }
    });
}

function normalizeSiteUrlKey(rawUrl) {
    try {
        const parsed = new URL(String(rawUrl || '').trim());
        const protocol = parsed.protocol.toLowerCase();
        const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
        const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
        return `${protocol}//${hostname}${pathname}`;
    } catch {
        return '';
    }
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

    return 'global'; // Map everything else to global as requested
}

function getLocaleDisplayLabel(localeKey) {
    if (localeKey === 'vi') {
        return 'Tiếng Việt';
    }

    if (localeKey === 'zh') {
        return 'Tiếng Trung';
    }

    if (localeKey === 'en') {
        return 'Tiếng Anh';
    }

    if (localeKey === 'global') {
        return 'Global';
    }

    return 'Global';
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
    let typeValues = String(ext.type || '_unknown').trim().split(',').map(t => t.trim().toLowerCase());
    typeValues = typeValues.map(t => (t === 'chinese_novel' || t === 'chinese') ? 'novel' : t);

    if (hideNsfwEnabled && isNsfwExtension(ext)) {
        return false;
    }

    if (selectedAuthorKeys.size > 0 && !selectedAuthorKeys.has(authorKey)) {
        return false;
    }

    if (selectedLocales.size > 0 && !selectedLocales.has(localeValue)) {
        return false;
    }

    if (selectedTypes.size > 0) {
        const hasMatchingType = typeValues.some(tv => selectedTypes.has(tv));
        if (!hasMatchingType) return false;
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

function renderLoadingState() {
    const grid = document.getElementById('extensions-grid');
    if (grid) {
        grid.innerHTML = `
            <div class="skeleton-grid">
                ${Array.from({ length: 8 }).map(() => `
                    <article class="skeleton-card">
                        <div class="skeleton-line skeleton-line-sm"></div>
                        <div class="skeleton-row">
                            <div class="skeleton-avatar"></div>
                            <div class="skeleton-blocks">
                                <div class="skeleton-line skeleton-line-md"></div>
                                <div class="skeleton-line skeleton-line-sm"></div>
                            </div>
                        </div>
                        <div class="skeleton-line skeleton-line-lg"></div>
                        <div class="skeleton-line skeleton-line-lg"></div>
                    </article>
                `).join('')}
            </div>
        `;
    }

    ['total-extensions', 'novel-count', 'comic-count', 'translate-count', 'tts-count'].forEach((id) => {
        const element = document.getElementById(id);
        if (!element) {
            return;
        }

        element.textContent = '—';
        element.classList.add('is-loading');
    });

    const sourceRepoCount = document.getElementById('source-repo-count');
    if (sourceRepoCount) {
        sourceRepoCount.textContent = 'Đang tải...';
        sourceRepoCount.classList.add('is-loading');
    }

    const contributeCount = document.getElementById('contribute-source-count');
    if (contributeCount) {
        contributeCount.textContent = 'đang tải';
    }
}

function clearLoadingState() {
    ['total-extensions', 'novel-count', 'comic-count', 'translate-count', 'tts-count'].forEach((id) => {
        const element = document.getElementById(id);
        if (!element) {
            return;
        }

        element.classList.remove('is-loading');
    });

    const sourceRepoCount = document.getElementById('source-repo-count');
    if (sourceRepoCount) {
        sourceRepoCount.classList.remove('is-loading');
    }
}

/**
 * NEW: Animated Counter for Stats
 */
function animateCounter(id, end) {
    const el = document.getElementById(id);
    if (!el) return;

    const start = parseInt(el.textContent) || 0;
    if (start === end) return;

    const duration = 1200; // 1.2s animation
    const startTime = performance.now();

    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out quint animation
        const ease = 1 - Math.pow(1 - progress, 5);
        const current = Math.floor(start + (end - start) * ease);

        el.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function renderStats(extensions = null) {
    const all = extensions || filterExtensions();

    const novelCount = all.filter(e => {
        const type = e.type || '';
        return type === 'novel' || type === 'chinese_novel' || type === 'chinese';
    }).length;
    const comicCount = all.filter(e => e.type === 'comic').length;
    const toolsCount = all.filter(e => e.type === 'tts' || e.type === 'translate').length;

    animateCounter('total-extensions', all.length);
    animateCounter('novel-count', novelCount);
    animateCounter('comic-count', comicCount);
    animateCounter('tools-count', toolsCount);
}

function renderSourceRepoCount() {
    const info = document.getElementById('source-repo-count');
    if (!info) {
        return;
    }

    const activeSources = getActiveCatalogSources();
    const repoTotal = activeSources.length;
    const totalSources = Array.isArray(window.catalogSources) ? window.catalogSources.length : repoTotal;
    const modeValue = String(window.catalogStatus && window.catalogStatus.mode ? window.catalogStatus.mode : '').toLowerCase();
    const modeIcon = modeValue === 'realtime' ? '⚡' : (modeValue === 'snapshot' ? '☁' : '•');
    const modeLabel = modeValue === 'realtime'
        ? 'live'
        : (modeValue === 'snapshot' ? 'fallback' : 'unknown');

    let loadedFromLabel = 'unknown';
    try {
        const loadedUrl = String(window.catalogMeta && window.catalogMeta.loadedCatalogUrl ? window.catalogMeta.loadedCatalogUrl : '').trim();
        if (loadedUrl) {
            const parsed = new URL(loadedUrl, window.location.href);
            const pathParts = String(parsed.pathname || '/').split('/').filter(Boolean);
            const tail = pathParts.slice(-2).join('/');
            loadedFromLabel = tail ? `${parsed.hostname}/${tail}` : parsed.hostname;
        }
    } catch (_error) {
    }

    const fullUrl = String(window.catalogMeta && window.catalogMeta.loadedCatalogUrl ? window.catalogMeta.loadedCatalogUrl : '').trim();
    const tooltip = fullUrl
        ? `Repo nguồn: ${repoTotal}/${totalSources} active\nMode: ${modeLabel}\nData: ${fullUrl}`
        : `Repo nguồn: ${repoTotal}/${totalSources} active\nMode: ${modeLabel}`;

    info.innerHTML = `<span class="source-repo-count-pill" title="Số repo nguồn">${repoTotal}</span> <span class="source-repo-count-sep">•</span> <span class="source-repo-count-pill" title="Chế độ tải">${modeIcon} ${modeLabel}</span>`;
    info.setAttribute('title', tooltip);
    info.setAttribute('aria-label', `${repoTotal} nguồn active trên ${totalSources}, mode ${modeLabel}, data ${loadedFromLabel}`);
}

function renderAggregateButton() {
    const button = document.getElementById('copy-aggregate-btn');
    if (!button) return;

    // IMPORTANT: For VBook app compatibility, use the plugin.json manifest, not the detailed catalog.json
    const aggregateUrl = `${API_BASE_URL}/api/plugin.json`;
    button.dataset.copyUrl = aggregateUrl;
    button.disabled = !aggregateUrl;
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
    const activeSources = sources.filter((source) => String(source && source.status ? source.status : '').toLowerCase() !== 'error');
    countEl.textContent = `${activeSources.length} nguồn`;

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
        chinese_novel: 'TRUYỆN CHỮ',
        chinese: 'TRUYỆN CHỮ',
        comic: 'TRUYỆN TRANH',
        translate: 'DỊCH',
        tts: 'TTS',
        _unknown: 'KHÁC'
    };

    const typeLabel = typeLabels[ext.type] || typeLabels._unknown;
    const description = getDescription(ext);
    let iconUrl = ext.icon || extensionIconFallback(ext.name || 'ext');
    if (typeof iconUrl === 'string') {
        iconUrl = iconUrl.replace(/^http:\/\//i, 'https://');
    }
    const iconFallback = extensionIconFallback(ext.name || 'ext');
    const sourceLabel = ext.source || '';
    const sourceHost = sourceLabel ? getSourceHost(sourceLabel) : '';
    const siteHealthBadge = renderExtensionSiteHealthBadge(sourceLabel);
    const siteCopyButton = sourceLabel
        ? `<button class="ext-site-copy-btn" data-site-url="${escapeHtml(sourceLabel)}" aria-label="Copy URL site" title="Copy URL site">🔗</button>`
        : '<span class="ext-site-copy-btn ext-site-copy-btn-disabled" aria-hidden="true">🔗</span>';

    // Selection State
    const extId = ext.id || ext.source || ext.name;
    const isSelected = selectedExtIds.has(extId);

    // Build source info with health icon
    const sourceDisplay = sourceHost || sourceLabel || 'Không rõ nguồn';
    const health = renderHealthIcon(sourceLabel);

    // Build source line HTML (dòng 2) - include redirect if exists
    let sourceLineHtml = '';
    if (health.newUrl) {
        // Has redirect: show both URLs on same line
        sourceLineHtml = `
            <span class="ext-health-icon" title="${escapeHtml(health.title)}">${health.icon}</span>
            <span class="ext-source-link old-url" data-copy-url="${escapeHtml(sourceLabel)}" title="Click để copy: ${escapeHtml(sourceLabel)}">${escapeHtml(sourceDisplay)}</span>
            <span class="ext-source-arrow">→</span>
            <span class="ext-source-link new-url" data-copy-url="${escapeHtml(health.newUrl)}" title="Click để copy: ${escapeHtml(health.newUrl)}">${escapeHtml(health.newUrl)}</span>
        `;
    } else {
        // Normal: just source URL
        sourceLineHtml = `
            <span class="ext-health-icon" title="${escapeHtml(health.title)}">${health.icon}</span>
            <span class="ext-source-link" data-copy-url="${escapeHtml(sourceLabel)}" title="Click để copy: ${escapeHtml(sourceLabel)}">${escapeHtml(sourceDisplay)}</span>
        `;
    }

    return `
        <div class="ext-card reveal-in ${isSelected ? 'is-selected' : ''}" data-source-url="${escapeHtml(sourceLabel)}" data-ext-id="${escapeHtml(extId)}">
            <div class="ext-icon-wrap">
                <img class="ext-icon" src="${escapeHtml(iconUrl)}" alt="${escapeHtml(ext.name || 'Extension')}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${escapeHtml(iconFallback)}';">
            </div>
            <div class="ext-body">
                <div class="ext-top-row">
                    <h3 class="ext-name" title="${escapeHtml(ext.name)}">${escapeHtml(ext.name || 'Chưa đặt tên')}</h3>
                    <button class="ext-select-btn ${isSelected ? 'active' : ''}" data-ext-action="select" aria-label="Chọn extension">${isSelected ? '✓' : '+'}</button>
                </div>
                <div class="ext-source-line ${health.status !== 'live' ? 'has-issue' : ''}">
                    ${sourceLineHtml}
                </div>
                <div class="ext-tags">
                    <span class="ext-tag type-tag" title="Loại extension">${escapeHtml(typeLabel)}</span>
                    <span class="ext-tag author-tag" title="Tác giả">${escapeHtml(ext.author || '??')}</span>
                    ${ext.version ? `<span class="ext-tag version-tag" title="Phiên bản">v${escapeHtml(ext.version)}</span>` : ''}
                </div>
                ${description ? `<div class="ext-description" title="${escapeHtml(description)}">${escapeHtml(description)}</div>` : ''}
            </div>
        </div>
    `;
}

function renderSourceCard(source) {
    const extItems = Array.isArray(source.extItems) ? source.extItems : [];
    const status = (source.status || '').trim().toLowerCase();
    const statusKind = status === 'error' ? 'error' : 'active';
    const statusLabel = statusKind === 'error' ? 'error' : 'active';
    const expanded = isSourceExpanded(source);
    const sourceTotal = source.itemCount || extItems.length;
    const previewItems = extItems.slice(0, expanded ? 4 : 3);
    const toggleAria = expanded ? 'Thu gọn thông tin nguồn' : 'Mở thông tin nguồn';
    const key = getSourceKey(source);
    const avatarUrl = getSourceAvatarUrl(source);
    const repoPath = getRepoDisplayPath(source.url || '');
    const displayLabel = repoPath || source.displayName || source.id || 'unknown-source';
    const fullLabel = source.displayName || source.id || source.url || 'unknown-source';
    const fallbackUrl = avatarFallback(fullLabel);

    return `
        <article class="source-card ${expanded ? 'is-expanded' : 'is-collapsed'} reveal-in" data-source-key="${escapeHtml(key)}">
            <div class="ext-card" style="border:0; padding:0; background:transparent; box-shadow:none; cursor:pointer;" data-source-toggle="${escapeHtml(key)}">
                <div class="ext-avatar-col">
                    <div class="ext-icon-wrap" style="width: 52px; height: 52px; border-radius: 4px;">
                        <img class="ext-icon" src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(fullLabel)} avatar" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${escapeHtml(fallbackUrl)}'">
                    </div>
                    <div class="ext-type-badge" style="background: var(--color-accent);">${sourceTotal} EXT</div>
                </div>
                <div class="ext-details-col">
                    <h3 class="ext-name">${escapeHtml(displayLabel)}</h3>
                    <p class="ext-site-url">${escapeHtml(source.url)}</p>
                    <div class="source-status-indicator ${escapeHtml(statusKind)}" style="margin-top: 4px;">
                        <span class="source-status-dot" aria-hidden="true"></span>
                        <span class="source-status-text">${escapeHtml(statusLabel)}</span>
                    </div>
                </div>
                <div class="ext-actions-col">
                    <span class="source-toggle-icon" style="font-size: 20px; font-weight: 800; color: var(--color-accent);">${expanded ? '−' : '+'}</span>
                    <button class="source-copy-btn" data-source-url="${escapeHtml(source.url)}" style="font-size: 9px; padding: 4px 6px;">URL</button>
                </div>
            </div>

            ${expanded ? `
                <div class="source-expanded-content" style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--color-border); width: 100%;">
                    <ul class="source-ext-preview-list" style="display: flex; flex-wrap: wrap; gap: 4px;">
                        ${previewItems.map(ext => `
                            <li class="source-ext-pill" style="font-size: 10px; padding: 2px 6px; border-radius: 2px; border: 1px solid var(--color-border); background: var(--color-bg-secondary);">
                                <strong>${escapeHtml(ext.name || 'Unknown')}</strong>
                            </li>
                        `).join('')}
                    </ul>
                    ${extItems.length > previewItems.length ? `<p style="font-size: 10px; color: var(--color-text-tertiary); margin-top: 6px;">+${extItems.length - previewItems.length} extension khác</p>` : ''}
                </div>
            ` : ''}
        </article>
    `;
}

const SOURCE_TYPE_LABELS = {
    novel: 'Truyện chữ',
    chinese_novel: 'Truyện chữ',
    chinese: 'Truyện chữ',
    comic: 'Truyện tranh',
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

function renderHealthIcon(sourceUrl) {
    const health = getExtensionSiteHealth(sourceUrl);

    // No health data or LIVE = green check
    if (!health || !health.p || health.p === 'LIVE') {
        return { icon: '🟢', title: 'Site hoạt động bình thường', status: 'live', newUrl: null };
    }

    const prefix = health.p;
    const suffix = health.s || '';

    // Icon mapping by status
    const iconMap = {
        'DIE': '🔴',      // Dead site
        'FAIL': '🟠',     // Blocked/WAF
        'MOVE': '🔵',     // Redirected (DIRECT)
        'DIRECT': '🔵',   // Redirected
        'HIJACK': '🟡'    // Hijacked
    };

    // Title/Tooltip description
    let description = '';
    if (prefix === 'DIE') description = `Site lỗi hoặc ngừng hoạt động (${suffix})`;
    if (prefix === 'FAIL') description = `Site bị chặn bởi tường lửa/WAF (${suffix})`;
    if (prefix === 'MOVE' || prefix === 'DIRECT') description = `Site đã chuyển sang: ${suffix}`;
    if (prefix === 'HIJACK') description = `Site bị chiếm quyền/Ads Redirect (${suffix})`;

    return {
        icon: iconMap[prefix] || '⚪',
        title: description,
        status: prefix.toLowerCase(),
        newUrl: (prefix === 'MOVE' || prefix === 'DIRECT') ? suffix : null
    };
}

function renderExtensionSiteHealthBadge(sourceUrl) {
    // Kept for backward compatibility, returns empty (we use icon now)
    return '';
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
        <article class="source-card ${expanded ? 'is-expanded' : 'is-collapsed'} reveal-in" data-source-key="${escapeHtml(key)}">
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
            <div class="source-actions">
                <button class="source-copy-btn" data-source-url="${escapeHtml(source.url)}">Copy Source</button>
            </div>
        </article>
    `;
}

function renderGrid() {
    const grid = document.getElementById('extensions-grid');
    if (!grid) return;

    const extensions = filterExtensions();
    const version = ++gridRenderVersion;

    if (extensions.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--color-text-tertiary);">
                <p style="font-size: 18px; font-weight: 600;">Kh\u00f4ng t\u00ecm th\u1ea5y extension</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = '';

    // Waterfall Effect: Render cards one by one
    let i = 0;
    const staggerDelay = 25; // 25ms between each card

    function renderNext() {
        if (version !== gridRenderVersion) return;
        if (i >= extensions.length) return;

        const ext = extensions[i];
        const cardHtml = renderCard(ext);

        // Create actual element to apply 'is-appearing' class after insertion
        const temp = document.createElement('div');
        temp.innerHTML = cardHtml;
        const cardEl = temp.firstElementChild;

        grid.appendChild(cardEl);

        // Trigger animation in next frame
        requestAnimationFrame(() => {
            cardEl.classList.add('is-appearing');
        });

        i++;

        // Schedule next card
        if (i < extensions.length) {
            // Speed up if too many items (e.g. > 48)
            const delay = i > 48 ? 10 : staggerDelay;
            setTimeout(renderNext, delay);
        }
    }

    renderNext();
}

function renderSourceView() {
    const grid = document.getElementById('extensions-grid');
    const sources = filterSources();

    // Increment grid render version to immediately cease any ongoing renderGrid loops
    gridRenderVersion++;

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

// Original renderActiveView removed to avoid duplication with the new dynamic stats version.

function getAuthorFilterOptions() {
    if (memoizedFilterOptions.authors) return memoizedFilterOptions.authors;

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

    memoizedFilterOptions.authors = Array.from(authorGroups.entries())
        .map(([value, info]) => ({ value, label: info.label, total: info.total }))
        .sort((a, b) => a.label.localeCompare(b.label, 'vi'));

    return memoizedFilterOptions.authors;
}

function getLocaleFilterOptions() {
    if (memoizedFilterOptions.locales) return memoizedFilterOptions.locales;

    const localeMap = new Map();
    getAllExtensions().forEach((ext) => {
        const localeKey = normalizeLocaleKey(ext.locale || '_unknown');
        localeMap.set(localeKey, (localeMap.get(localeKey) || 0) + 1);
    });

    memoizedFilterOptions.locales = Array.from(localeMap.entries())
        .map(([value, total]) => ({ value, label: `${getLocaleDisplayLabel(value)} (${total})` }))
        .sort((a, b) => a.label.localeCompare(b.label, 'vi'));

    return memoizedFilterOptions.locales;
}

function getTypeFilterOptions() {
    if (memoizedFilterOptions.types) return memoizedFilterOptions.types;

    const typeSet = new Set();
    getAllExtensions().forEach((ext) => {
        let types = String(ext.type || '_unknown').trim().split(',').map(t => t.trim().toLowerCase());
        types.forEach(type => {
            if (type === 'chinese_novel' || type === 'chinese') {
                type = 'novel';
            }
            typeSet.add(type);
        });
    });

    memoizedFilterOptions.types = Array.from(typeSet)
        .map((value) => ({ value, label: getSourceTypeLabel(value) }))
        .filter(opt => opt.value !== '_unknown') // Hide unknown if empty or not needed
        .sort((a, b) => a.label.localeCompare(b.label, 'vi'));

    return memoizedFilterOptions.types;
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
    const nsfwSwitch = document.getElementById('filter-nsfw-switch');
    if (!modal || !nsfwSwitch) {
        return;
    }

    draftAuthorKeys = new Set(selectedAuthorKeys);
    draftLocales = new Set(selectedLocales);
    draftTypes = new Set(selectedTypes);
    draftHideNsfwEnabled = hideNsfwEnabled;

    renderFilterChipList('filter-authors', 'author', getAuthorFilterOptions(), draftAuthorKeys);
    renderFilterChipList('filter-locales', 'locale', getLocaleFilterOptions(), draftLocales);
    renderFilterChipList('filter-types', 'type', getTypeFilterOptions(), draftTypes);
    nsfwSwitch.checked = !draftHideNsfwEnabled; // Checked means "Hiện" (Show), so not hidden

    const panel = modal.querySelector('.filter-modal-panel');
    if (panel) {
        panel.style.transform = ''; // Fix bug: Reset any stale swipe transforms

        // Explicitly set 70vh on mobile to avoid auto-scaling issues
        if (window.innerWidth <= 768) {
            panel.style.height = '70vh';
        } else {
            panel.style.height = '';
        }
    }

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
    hideNsfwEnabled = draftHideNsfwEnabled;

    updateFilterButtonLabel();
    // Do not close modal here, just refresh view
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
    const nsfwSwitch = document.getElementById('filter-nsfw-switch');
    if (!openButton || !modal || !applyButton || !cancelButton || !nsfwSwitch) {
        return;
    }

    updateFilterButtonLabel();

    if (filterModalBound) {
        return;
    }

    openButton.addEventListener('click', openFilterModal);
    applyButton.addEventListener('click', applyFilterModal);
    cancelButton.addEventListener('click', closeFilterModal);

    nsfwSwitch.addEventListener('change', () => {
        draftHideNsfwEnabled = !nsfwSwitch.checked; // Checked means SHOW (so not hidden)
        applyFilterModal(); // Instant apply
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
        applyFilterModal(); // Instant apply
    });

    setupModalDrag('filter-modal', closeFilterModal);
    setupModalDrag('guide-modal', () => {
        const gm = document.getElementById('guide-modal');
        gm.classList.remove('show');
        gm.setAttribute('aria-hidden', 'true');
    });

    filterModalBound = true;
}

function setupModalDrag(modalId, closeFn) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    const panel = modal.querySelector('.filter-modal-panel');
    if (!panel) return;

    let touchStartY = 0;
    let initialHeight = 0;
    let isDragging = false;
    let isBottomSheet = false;
    let rafId = null;

    panel.addEventListener('touchstart', (e) => {
        isBottomSheet = window.innerWidth <= 768 && !panel.classList.contains('guide-panel');

        if (panel.scrollTop <= 0 || e.target.closest('.filter-modal-drag-handle')) {
            touchStartY = e.touches[0].clientY;
            initialHeight = panel.offsetHeight;
            isDragging = true;
            panel.style.transition = 'none';
        }
    }, { passive: true });

    panel.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStartY;

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            if (isBottomSheet) {
                if (deltaY > 0) {
                    panel.style.transform = `translateY(${deltaY}px)`;
                } else if (deltaY < 0 && panel.style.height !== '100vh') {
                    const newHeight = Math.min(window.innerHeight, initialHeight - deltaY);
                    panel.style.height = `${newHeight}px`;
                    panel.style.transform = 'translateY(0)';
                }
            } else if (deltaY > 0) {
                panel.style.transform = `translateY(${deltaY}px)`;
            }
        });
    }, { passive: false });

    panel.addEventListener('touchend', (e) => {
        if (rafId) cancelAnimationFrame(rafId);
        if (!isDragging) return;

        const currentY = e.changedTouches[0].clientY;
        const deltaY = currentY - touchStartY;
        isDragging = false;
        panel.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.3s ease';

        if (isBottomSheet) {
            if (deltaY < -60) {
                panel.style.height = '100vh';
                panel.style.transform = '';
            } else if (deltaY > 100) {
                panel.style.transform = 'translateY(100%)';
                setTimeout(closeFn, 200);
            } else {
                panel.style.transform = '';
                panel.style.height = panel.offsetHeight < window.innerHeight * 0.85 ? '70vh' : '100vh';
            }
        } else {
            if (deltaY > 100) {
                panel.style.transform = 'translateY(100vh)';
                setTimeout(closeFn, 200);
            } else {
                panel.style.transform = '';
            }
        }
    });
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

function handleTabSwitch(tab, updateUrl = true) {
    currentTab = tab;

    // Update active tab UI - Beta tabs
    document.querySelectorAll('.beta-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Toggle view visibility
    document.querySelectorAll('.tab-view').forEach(view => {
        view.classList.toggle('active', view.id === `view-${tab}`);
    });

    // Toggle special stats visibility
    const isSourceTab = (tab === 'sources');
    document.querySelectorAll('.source-only-stat').forEach(el => {
        el.style.display = isSourceTab ? 'block' : 'none';
    });

    if (tab === 'market' && marketplaceData.length === 0) {
        fetchMarketplace();
    }

    // Update URL hash for routing (extensions is default/home, no hash needed)
    if (updateUrl) {
        if (tab === 'extensions') {
            history.pushState(null, '', window.location.pathname);
        } else {
            history.pushState(null, '', `#${tab}`);
        }
    }

    // Update page title based on tab
    const titles = {
        extensions: 'VBook Customizer - Phần Mở Rộng',
        sources: 'VBook Customizer - Nguồn Mở Rộng',
        market: 'VBook Customizer - Kệ Mở Rộng'
    };
    document.title = titles[tab] || titles.extensions;

    renderStats(); // Recalculate and potentially animate new counters
    renderActiveView();
}

// Handle browser back/forward and initial load
function initRouter() {
    const route = window.location.hash.slice(1); // Remove #
    const validRoutes = ['sources', 'market'];

    if (validRoutes.includes(route)) {
        handleTabSwitch(route, false);
    } else {
        // Default to extensions (home)
        handleTabSwitch('extensions', false);
    }
}

// Listen for hash changes (back/forward button)
window.addEventListener('popstate', () => {
    initRouter();
});

function renderDashboard() {
    renderStats();
    renderCatalogUpdatedTime();
    renderSourceRepoCount();
    renderAggregateButton();
    renderContributeSection();

    // Defer expensive but non-critical UI components
    if (window.requestIdleCallback) {
        requestIdleCallback(() => {
            renderAuthorAcknowledgement();
        });
    } else {
        setTimeout(renderAuthorAcknowledgement, 200);
    }

    setupFilterModal();
    setupTabListeners();
    initRouter(); // Initialize routing based on URL hash
}

function setupTabListeners() {
    // Beta tab navigation
    document.querySelectorAll('.beta-tab').forEach(btn => {
        if (btn.dataset.tabListener) return;
        btn.addEventListener('click', () => handleTabSwitch(btn.dataset.tab));
        btn.dataset.tabListener = 'true';
    });

    // Market Search
    const mkSearch = document.getElementById('market-search-input');
    if (mkSearch && !mkSearch.dataset.bound) {
        mkSearch.addEventListener('input', (e) => {
            marketSearch = e.target.value;
            renderMarket();
        });
        mkSearch.dataset.bound = 'true';
    }

    // Market Sort Select
    const mkSort = document.getElementById('market-sort-select');
    if (mkSort && !mkSort.dataset.bound) {
        mkSort.addEventListener('change', (e) => {
            marketSort = e.target.value;
            renderMarket();
        });
        mkSort.dataset.bound = 'true';
    }
}

function renderActiveView() {
    // Sync view visibility based on currentTab
    document.querySelectorAll('.tab-view').forEach(view => {
        view.classList.toggle('active', view.id === `view-${currentTab}`);
    });

    // Footer area (authors + contribute) now shows on all tabs

    if (currentTab === 'sources') {
        renderSourceView();
    } else if (currentTab === 'market') {
        renderMarket();
    } else {
        renderGrid();
    }
}

// MARKETPLACE LOGIC
async function fetchMarketplace() {
    const grid = document.getElementById('market-grid');
    if (grid) grid.innerHTML = '<div class="market-loading">Đang tải kệ sách cộng đồng...</div>';

    try {
        const res = await fetch(`${API_BASE_URL}/api/registry/market`);
        const data = await res.json();
        marketplaceData = data.data || data.items || [];
        renderMarket();
    } catch (e) {
        console.error('[Market] Fetch Error:', e);

        // DEV MODE: Load mock market data
        const isLocal = !window.location.hostname ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.protocol === 'file:';

        if (isLocal) {
            console.log('[DEV] Loading mock marketplace data');
            marketplaceData = [
                { slug: 'novel-vn', title: 'Truyện Chữ VN', author: 'kychi', description: 'Bộ sưu tập truyện chữ phổ biến nhất Việt Nam', ext_count: 12, usage_count: 847, tags: ['novel', 'vietnamese'], created_at: '2026-04-15' },
                { slug: 'comic-all', title: 'Truyện Tranh Đầy Đủ', author: 'TeamVBook', description: 'Tổng hợp các nguồn truyện tranh hàng đầu', ext_count: 8, usage_count: 523, tags: ['comic', 'manga'], created_at: '2026-04-10' },
                { slug: 'tts-plus', title: 'TTS Plus Pack', author: 'kychi', description: 'Gói TTS mở rộng với nhiều giọng đọc', ext_count: 5, usage_count: 312, tags: ['tts', 'audio'], created_at: '2026-04-08' },
                { slug: 'translate-hub', title: 'Dịch Truyện', author: 'vbookfan', description: 'Các extension dịch tự động đa ngôn ngữ', ext_count: 6, usage_count: 198, tags: ['translate', 'multi-lang'], created_at: '2026-04-05' },
                { slug: 'all-in-one', title: 'All-in-One Mega Pack', author: 'TeamVBook', description: 'Tất cả extension cần thiết trong một kệ', ext_count: 25, usage_count: 1204, tags: ['novel', 'comic', 'tts', 'translate'], created_at: '2026-03-20' },
                { slug: 'light-novel-jp', title: 'Light Novel Nhật', author: 'sakura_dev', description: 'Nguồn light novel Nhật Bản với dịch tự động', ext_count: 9, usage_count: 156, tags: ['novel', 'japanese', 'translate'], created_at: '2026-04-18' }
            ];
            renderMarket();
            return;
        }

        if (grid) grid.innerHTML = `<div class="error">Không thể tải marketplace: ${e.message}</div>`;
    }
}

function renderMarket() {
    const grid = document.getElementById('market-grid');
    if (!grid) return;

    let filtered = marketplaceData.filter(m =>
        (m.title || '').toLowerCase().includes(marketSearch.toLowerCase()) ||
        (m.author || '').toLowerCase().includes(marketSearch.toLowerCase())
    );

    // Sorting
    if (marketSort === 'newest') {
        filtered.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
    } else if (marketSort === 'title') {
        filtered.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    } else {
        filtered.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
    }

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state">Chưa có kệ sách nào phù hợp.</div>';
        return;
    }

    grid.innerHTML = filtered.map(m => {
        const usageCount = m.usage_count || 0;
        const extCount = m.ext_count || 0;

        return `
        <article class="market-card" onclick="handleImportShelf('${m.slug}')" role="button" tabindex="0">
            <div class="market-count-badge" title="${extCount} extension">
                <span class="market-count-number">${extCount}</span>
                <span class="market-count-label">ext</span>
            </div>
            <div class="market-body">
                <div class="market-top-row">
                    <h3 class="market-title" title="${escapeHtml(m.title)}">${escapeHtml(m.title)}</h3>
                    <span class="market-usage" title="${usageCount} lượt sử dụng">${usageCount} 🔥</span>
                </div>
                <div class="market-tags">
                    <span class="market-tag author-tag" title="Tác giả">${escapeHtml(m.author || 'Ẩn danh')}</span>
                </div>
                ${m.description ? `<div class="market-description" title="${escapeHtml(m.description)}">${escapeHtml(m.description)}</div>` : ''}
            </div>
        </article>
        `;
    }).join('');
}

// SOURCE TAB: AUTHOR GROUPING
function renderSourceView() {
    const grid = document.getElementById('sources-grid');
    if (!grid) return;

    const extensions = filterExtensions();
    const sSearch = (document.getElementById('source-search-input')?.value || '').toLowerCase();
    const sources = getActiveCatalogSources();

    // Map authors to repos
    const repoGroups = [];
    sources.forEach(src => {
        // Find extensions in this source
        const extItems = (src.extItems || []).filter(e => extensions.some(fe => fe.source === e.source));
        if (extItems.length === 0 && !sSearch) return;

        // Try to find author from extensions
        const author = src.author || (extItems.length > 0 ? extItems[0].author : 'Không rõ');
        const searchStr = `${author} ${src.displayName} ${src.url}`.toLowerCase();

        if (sSearch && !searchStr.includes(sSearch)) return;

        repoGroups.push({
            author: author,
            displayName: src.displayName,
            url: src.url,
            avatar: getSourceAvatarUrl(src),
            description: src.description || 'Nguồn mở rộng cộng đồng',
            extensions: extItems
        });
    });

    // Stats for Sources tab
    const authStat = document.getElementById('author-count');
    const repoStat = document.getElementById('source-count');
    if (authStat) {
        const uniqueAuthors = new Set(repoGroups.map(g => normalizeAuthorKey(g.author)));
        authStat.textContent = uniqueAuthors.size;
    }
    if (repoStat) repoStat.textContent = repoGroups.length;

    if (repoGroups.length === 0) {
        grid.innerHTML = '<div class="empty-state">Không tìm thấy nguồn nào.</div>';
        return;
    }

    grid.innerHTML = repoGroups.map(g => {
        const rawUrl = getRawJsonUrl(g.url);
        const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(g.author || 'U')}&background=f1f1f1&color=333333`;
        return `
        <article class="source-card is-collapsed" data-source-url="${escapeHtml(rawUrl)}">
            <div class="source-header-wrap" onclick="this.parentElement.classList.toggle('is-collapsed');this.parentElement.classList.toggle('is-expanded')">
                <img class="source-avatar-img" src="${escapeHtml(g.avatar || fallbackAvatar)}" alt="${escapeHtml(g.author)}" loading="lazy" onerror="this.src='${escapeHtml(fallbackAvatar)}'">
                <div class="source-info">
                    <div class="source-name">${escapeHtml(g.author)}</div>
                    <div class="source-raw-url" onclick="event.stopPropagation(); copySourceUrl('${escapeHtml(rawUrl)}')" title="Click để copy link raw JSON">
                        ${escapeHtml(rawUrl)}
                    </div>
                </div>
                <div class="source-right-group">
                    <span class="source-stat-badge">${g.extensions.length} ext</span>
                    <span class="source-toggle-icon">▼</span>
                </div>
            </div>
            <div class="source-details">
                <div class="extensions-grid" style="padding: 10px 0;">
                    ${g.extensions.map(renderCard).join('')}
                </div>
            </div>
        </article>
    `}).join('');
}

// Convert repo URL to raw JSON URL
function getRawJsonUrl(repoUrl) {
    if (!repoUrl) return '';

    // GitHub URL conversion
    const githubMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (githubMatch) {
        const [, user, repo] = githubMatch;
        return `https://raw.githubusercontent.com/${user}/${repo}/main/catalog.json`;
    }

    // GitLab URL conversion
    const gitlabMatch = repoUrl.match(/gitlab\.com\/([^\/]+)\/([^\/]+)/);
    if (gitlabMatch) {
        const [, user, repo] = gitlabMatch;
        return `${repoUrl}/-/raw/main/catalog.json`;
    }

    // If already a raw URL or other, return as-is with catalog.json
    if (repoUrl.endsWith('.json')) {
        return repoUrl;
    }

    return `${repoUrl.replace(/\/?$/, '/')}/catalog.json`;
}

// Copy source URL to clipboard
async function copySourceUrl(url) {
    try {
        await copyToClipboard(url);
        showToast('Đã copy link raw JSON!');
    } catch (e) {
        showToast('Lỗi khi copy link');
    }
}

// SELECTION & SHELF LOGIC
function handleSelectExt(id) {
    if (selectedExtIds.has(id)) {
        selectedExtIds.delete(id);
    } else {
        selectedExtIds.add(id);
    }
    updateSelectionUI();
}

function updateSelectionUI() {
    const bar = document.getElementById('cart-bar');
    const count = document.getElementById('cart-count');

    if (selectedExtIds.size > 0) {
        if (bar) bar.style.display = 'block';
        if (count) count.textContent = selectedExtIds.size;

        // Sync Modal Preview List
        const previewList = document.getElementById('selected-preview-list');
        if (previewList) {
            const extensions = getAllExtensions();
            const selectedData = extensions.filter(e => {
                const id = e.id || e.source || e.name;
                return selectedExtIds.has(id);
            });
            previewList.innerHTML = selectedData.map(e => `
                <div class="preview-chip">
                    <img class="preview-chip-icon" src="${escapeHtml(e.icon || 'assets/logo.png')}" alt="" onerror="this.src='assets/logo.png'">
                    <span>${escapeHtml(e.name)}</span>
                </div>
            `).join('');
        }
    } else {
        if (bar) bar.style.display = 'none';
    }

    // Highlighting cards
    document.querySelectorAll('.ext-card').forEach(card => {
        const id = card.dataset.extId;
        const btn = card.querySelector('.ext-select-btn');
        if (selectedExtIds.has(id)) {
            card.classList.add('is-selected');
            if (btn) {
                btn.classList.add('active');
                btn.textContent = '✓';
            }
        } else {
            card.classList.remove('is-selected');
            if (btn) {
                btn.classList.remove('active');
                btn.textContent = '+';
            }
        }
    });
}

// GLOBAL CLICK HANDLER OVERRIDE for selection and marketplace
document.addEventListener('click', async (e) => {
    // Select Button
    const selBtn = e.target.closest('[data-ext-action="select"]');
    if (selBtn) {
        const card = selBtn.closest('.ext-card');
        if (card) handleSelectExt(card.dataset.extId);
        return;
    }

    // Clickable Source Link (auto copy)
    const sourceLink = e.target.closest('.ext-source-link');
    if (sourceLink && sourceLink.dataset.copyUrl) {
        e.stopPropagation();
        copyToClipboard(sourceLink.dataset.copyUrl).then(() => showToast(`Đã copy: ${sourceLink.dataset.copyUrl}`));
        return;
    }

    // Cart Actions
    if (e.target.closest('#cart-clear-btn')) {
        selectedExtIds.clear();
        updateSelectionUI();
        return;
    }
    if (e.target.closest('#cart-save-btn') || e.target.closest('#open-save-btn')) {
        openSaveModal();
        return;
    }

    // Modal Closing
    if (e.target.closest('[data-save-close]')) closeSaveModal();
    if (e.target.closest('[data-success-close]')) closeSuccessModal();
    if (e.target.closest('[data-market-close]')) closeMarketPreviewModal();
    if (e.target.closest('#market-preview-cancel')) closeMarketPreviewModal();
    if (e.target.closest('#market-preview-import')) useCurrentPreviewShelf();
});

function openSaveModal() {
    const modal = document.getElementById('save-modal');
    if (modal) {
        const panel = modal.querySelector('.filter-modal-panel');
        if (panel) {
            panel.style.transform = '';
            panel.style.height = window.innerWidth <= 768 ? '70vh' : '';
        }
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        setupModalDrag('save-modal', closeSaveModal);
    }
}

function closeSaveModal() {
    const modal = document.getElementById('save-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
    }
}

function closeSuccessModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
    }
}

// SAVE ACTIONS
const saveConfirmBtn = document.getElementById('save-confirm-btn');
if (saveConfirmBtn) {
    saveConfirmBtn.addEventListener('click', async () => {
        // Validate có extension được chọn
        if (selectedExtIds.size === 0) {
            showToast('Chưa chọn extension nào! Hãy chọn ít nhất 1 extension.');
            return;
        }

        const titleInput = document.getElementById('shelf-title-input');
        const authorInput = document.getElementById('shelf-author-input');
        const descInput = document.getElementById('shelf-desc-input');

        const title = titleInput?.value.trim();
        const author = authorInput?.value.trim();
        const description = descInput?.value.trim() || '';

        if (!title || !author) {
            showToast('Chưa nhập đủ Tên và Tác giả!');
            return;
        }

        // Validate minimum length
        if (title.length < 3) {
            showToast('Tên kệ sách quá ngắn (tối thiểu 3 ký tự)!');
            return;
        }
        if (author.length < 2) {
            showToast('Tên tác giả quá ngắn (tối thiểu 2 ký tự)!');
            return;
        }

        saveConfirmBtn.disabled = true;
        saveConfirmBtn.textContent = 'Đang lưu...';

        try {
            const extensions = getAllExtensions();
            const extension_ids = Array.from(selectedExtIds).map(id => {
                const ext = extensions.find(e => (e.id || e.source || e.name) === id);
                return ext ? (ext.path || ext.id || ext.name) : null;
            }).filter(Boolean);

            // Check if extension_ids is empty after filtering
            if (extension_ids.length === 0) {
                showToast('Không tìm thấy extension hợp lệ để lưu!');
                return;
            }

            const res = await fetch(`${API_BASE_URL}/api/registry/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, author, description, extension_ids })
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Server error ${res.status}: ${errorText}`);
            }

            const result = await res.json();
            if (result.success && result.data) {
                const shelfUrl = `${API_BASE_URL}/api/registry/${result.data.slug}.json`;
                closeSaveModal();
                showSuccessModal(shelfUrl);
                selectedExtIds.clear();
                updateSelectionUI();
                // Clear inputs
                if (titleInput) titleInput.value = '';
                if (authorInput) authorInput.value = '';
                if (descInput) descInput.value = '';
            } else {
                showToast('Lỗi: ' + (result.error || 'Không nhận được link kệ mở rộng'));
            }
        } catch (e) {
            console.error('[Save Shelf Error]', e);
            showToast('Lỗi: ' + e.message);
        } finally {
            saveConfirmBtn.disabled = false;
            saveConfirmBtn.textContent = 'Xác nhận';
        }
    });
}

function showSuccessModal(url) {
    const modal = document.getElementById('success-modal');
    const linkEl = document.getElementById('shelf-result-link');
    if (modal && linkEl) {
        linkEl.textContent = url;
        linkEl.onclick = () => {
            copyToClipboard(url);
            showToast('Đã copy link!');
        };
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
    }
}

let currentPreviewShelf = null;

async function handleImportShelf(slug) {
    // Show loading in modal
    const modal = document.getElementById('market-preview-modal');
    const content = document.getElementById('market-preview-content');
    const importBtn = document.getElementById('market-preview-import');

    if (!modal || !content) {
        // Fallback: open direct link
        window.open(`${API_BASE_URL}/api/registry/${slug}.json`, '_blank');
        return;
    }

    // Show modal with loading
    content.innerHTML = '<div class="market-loading">Đang tải thông tin kệ sách...</div>';
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    if (importBtn) importBtn.disabled = true;

    try {
        // Fetch shelf data
        const res = await fetch(`${API_BASE_URL}/api/registry/${slug}.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const shelf = await res.json();
        currentPreviewShelf = shelf;

        // API returns { metadata: { name, author, description, ... }, data: [...] }
        const meta = shelf.metadata || {};
        const items = shelf.data || [];
        const itemCount = meta.totalItems || items.length;

        let html = `
            <div style="margin-bottom: 15px; padding: 12px; background: var(--color-bg-secondary); border-radius: 10px;">
                <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 6px;">${escapeHtml(meta.name || 'Kệ mở rộng')}</h3>
                <p style="font-size: 13px; color: var(--color-text-secondary); margin-bottom: 4px;">
                    👤 ${escapeHtml(meta.author || 'Ẩn danh')} • 📦 ${itemCount} extension
                </p>
                ${meta.description ? `<p style="font-size: 12px; color: var(--color-text-tertiary); margin-top: 8px;">${escapeHtml(meta.description)}</p>` : ''}
            </div>
            <p style="font-size: 13px; font-weight: 600; margin-bottom: 10px; color: var(--color-text-primary);">Danh sách extension:</p>
            <div style="display: flex; flex-direction: column; gap: 8px;">
        `;

        if (items.length === 0) {
            html += '<p style="font-size: 13px; color: var(--color-text-tertiary);">Kệ sách trống.</p>';
        } else {
            // Show first 10 items
            const displayItems = items.slice(0, 10);
            displayItems.forEach(item => {
                html += `
                    <div style="display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: var(--color-bg-primary); border-radius: 8px; border: 1px solid var(--color-border);">
                        <span style="font-size: 14px;">📦</span>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-size: 13px; font-weight: 600; color: var(--color-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(item.name || 'Unknown')}</div>
                            ${item.source ? `<div style="font-size: 11px; color: var(--color-text-tertiary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(item.source)}</div>` : ''}
                        </div>
                    </div>
                `;
            });

            if (items.length > 10) {
                html += `<p style="font-size: 12px; color: var(--color-text-tertiary); text-align: center; margin-top: 8px;">... và ${items.length - 10} extension khác</p>`;
            }
        }

        html += '</div>';
        content.innerHTML = html;
        if (importBtn) importBtn.disabled = false;

    } catch (e) {
        console.error('[Market Preview Error]', e);
        content.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p style="font-size: 14px; color: var(--color-text-secondary); margin-bottom: 15px;">
                    ❌ Không thể tải thông tin kệ sách.
                </p>
                <p style="font-size: 12px; color: var(--color-text-tertiary);">${escapeHtml(e.message)}</p>
                <button onclick="window.open('${API_BASE_URL}/api/registry/${slug}.json', '_blank')" class="filter-modal-btn filter-modal-btn-apply" style="margin-top: 15px;">
                    Mở link trực tiếp
                </button>
            </div>
        `;
    }
}

function closeMarketPreviewModal() {
    const modal = document.getElementById('market-preview-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
    }
    currentPreviewShelf = null;
}

function useCurrentPreviewShelf() {
    if (!currentPreviewShelf) {
        showToast('Không có dữ liệu kệ mở rộng để sử dụng!');
        return;
    }

    // API returns { metadata, data: [...] }
    const items = currentPreviewShelf.data || currentPreviewShelf.items || [];
    let addedCount = 0;

    items.forEach(item => {
        const id = item.path || item.id || item.source || item.name;
        if (id) {
            selectedExtIds.add(id);
            addedCount++;
        }
    });

    if (addedCount === 0) {
        showToast('Không có extension nào để thêm!');
        return;
    }

    updateSelectionUI();
    closeMarketPreviewModal();
    const meta = currentPreviewShelf.metadata || {};
    showToast(`Đã thêm ${addedCount} extension từ kệ "${meta.name || 'Unknown'}" vào lựa chọn!`);

    // Switch to extensions tab to show selection
    handleTabSwitch('extensions', true);
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

function setupGuideModal() {
    const openBtn = document.getElementById('open-guide-btn');
    const closeBtn = document.getElementById('guide-close-btn');
    const modal = document.getElementById('guide-modal');

    if (!openBtn || !closeBtn || !modal) return;

    openBtn.addEventListener('click', () => {
        const panel = modal.querySelector('.filter-modal-panel');
        if (panel) panel.style.transform = ''; // Fix reappear bug
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
    });

    const close = () => {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
    };

    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
        if (e.target.dataset.guideClose) close();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupSearch();
    setupCopyActions();
    setupBackToTopButton();
    setupAuthorsMobileToggle();
    setupGuideModal();

    // Start dynamic fetch
    fetchAppData();
});
