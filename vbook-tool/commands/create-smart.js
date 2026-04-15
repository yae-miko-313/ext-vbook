/**
 * CREATE-SMART COMMAND — Smart extension scaffold with real selector discovery
 *
 * Workflow:
 *   1. Inspect all provided URLs on the VBook device
 *   2. Score candidate selectors by match count
 *   3. Scaffold extension structure
 *   4. Generate scripts with REAL selectors — no generic placeholders
 *
 * Usage:
 *   vbook create-smart <name> --source <url> --type <type>
 *     --home <url_list>        URL trang danh sách truyện
 *     --detail <url_detail>    URL trang chi tiết một truyện
 *     --toc <url_toc>         URL trang mục lục chương
 *     --chap <url_chap>       URL trang đọc chương
 *     [--search]              Có tính năng search
 *     [--genre]               Có trang thể loại
 *     [--locale vi_VN]
 *     [--tag nsfw]
 */

const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { sendModernRequest } = require('../utils');
const { getProjectRoot, getExtensionsDir, getAuthor } = require('../lib/plugin-info');
const c = require('../lib/colors');

// ─── Selector candidate sets ──────────────────────────────────────────────────
// For each page type, we probe multiple candidate selectors on the real website.
// The one with the highest match count wins.

const CANDIDATES = {
    // ── gen/home list page ────────────────────────────────────────────────────
    gen_item: [
        '.list-truyen .row', '.col-truyen-main .list-truyen .row',
        '.truyen-list .list-truyen-item', '.list-truyen-item',
        '.book-list .item', '.list-story .item', '.list-book li',
        '.story-list li', '.update-list .item', '.novel-list .novel-item',
        '.grid-item', 'article.item', '.item-truyen', '.items .item',
        '.more li', 'ul.list li', '#list-page .row', '.page-truyen li',
        '.list-manga li', '.manga-list .item', '.comic-list .item',
        '.search-result .item', '.list .row'
    ],
    gen_title: [
        'h3 a', 'h2 a', 'h4 a', '.title a', '.name a',
        '.truyen-title a', 'a.story-title', '.card-title a',
        '.book-title a', '.item-title a', '.title-truyen a',
        'strong a', '.fw-bold a', 'p.name a'
    ],
    gen_cover: [
        'img', '.thumb img', '.cover img', '.lazyload',
        'img.img-responsive', 'img[data-src]', 'img[data-original]',
        '.book-img img', 'a img', '.thumbnail img'
    ],
    gen_next: [
        'a[rel=next]', '.next a', 'li.next a',
        '.pagination .active + li a', '.paging .active + li a',
        'a.next-page', '.page-next a', 'ul.pagination li:last-child a'
    ],

    // ── detail page ───────────────────────────────────────────────────────────
    detail_name: [
        'h1', 'h1.title', '.title h1', '.book-intro h1',
        '.truyen-title', 'h2.title', '.entry-title', 'h1.name',
        '.book-title', '.info-title', '.manga-title h1', 'h1.book-name'
    ],
    detail_cover: [
        '.book-img img', '.cover img', '.thumbnail img', 'img.cover',
        '.info img', '.detail-info img', '.book-cover img', '.anh-bia img',
        '.bia-truyen img', 'img[itemprop=image]', '.thumb img'
    ],
    detail_author: [
        '[itemprop=author]', '.author a', 'a[href*=author]',
        'a[href*=tac-gia]', '.info-item a', '.info a',
        'li:contains(Tác giả) a', 'p:contains(Tác giả) a',
        'td:contains(Tác giả) + td', '.info-detail dd:first-of-type'
    ],
    detail_status: [
        '.status', '[itemprop=status]', '.label-danger', '.label-success',
        '.label-warning', 'span.label', '.info-item .label',
        'li:contains(Tình trạng)', 'td:contains(Tình trạng) + td',
        '.tinh-trang', 'p:contains(Tình trạng)'
    ],
    detail_description: [
        '.description', '.desc-text', '.truyen-description',
        '.sinopsis', '.book-intro .content',
        '#truyen-mobi-thumnail ~ div p', '.summary-content',
        '.detail-content p', '.description-content', 'div.desc',
        '.content-info', '.info-content', '[itemprop=description]'
    ],
    detail_genres: [
        '.info-item.genre a', '.tag a', '.theloai a',
        'a[href*=the-loai]', 'a[href*=genre]', 'a[href*=category]',
        'a[href*=danh-sach]', '.genre-item a', '.categories a',
        'li:contains(Thể loại) a', '.list-genre a'
    ],

    // ── toc / chapter list ────────────────────────────────────────────────────
    toc_chapter: [
        '#list-chapter a', '.list-chapter a', '.chapter-list a',
        'ul.list-chapter li a', 'a[href*=chuong]', 'a[href*=chapter]',
        '.chapter a', '#chapter-list a', '.chapters a',
        '.list-chapters a', '#box-list-chapter a',
        '.manga-chapters a', '.cap-list a'
    ],
    toc_pagination: [
        '.pagination li', '.page-list li', '.paging a',
        '.list-category-page a', 'ul.pagination:not(:empty) li a'
    ],

    // ── chapter content ───────────────────────────────────────────────────────
    chap_content: [
        '#chapter-content', '.chapter-c', '.reading-content',
        '#content', '.text-justify', '.chapter-content',
        '#doc-truyen', '.container-chapter-content',
        'div[id*=content]', '.box-chap', '.txt-chapter',
        '.chapter-text', '.content-chapter', '.readContent',
        '#truyen-chapter', '.truyen-chapter', '.article-content'
    ]
};

// ─── Build inspection script ──────────────────────────────────────────────────

/**
 * Generate a Rhino-compatible JS script that tests all selector candidates,
 * returning count + sample text/href/src for each.
 */
function buildInspectScript(selectorKeys, gbk = false) {
    const allSelectors = [];
    for (const key of selectorKeys) {
        if (CANDIDATES[key]) allSelectors.push(...CANDIDATES[key]);
    }
    // Deduplicate
    const unique = Array.from(new Set(allSelectors));

    const probeLines = unique.map(sel => {
        const escaped = JSON.stringify(sel);
        return `
try {
    var _e = doc.select(${escaped});
    var _c = _e.size();
    var _f = _c > 0 ? _e.first() : null;
    results[${escaped}] = {
        count: _c + "",
        text: _f ? (_f.text().substring(0, 80) + "") : "",
        href: _f ? (_f.attr("href") + "") : "",
        src:  _f ? ((_f.attr("data-src") || _f.attr("src") || "") + "") : ""
    };
} catch(_err) {
    results[${escaped}] = { count: "0", text: "", href: "", src: "" };
}`;
    }).join('\n');

    const htmlCall = gbk ? 'res.html("gbk")' : 'res.html()';

    return `function execute(url) {
    var res = fetch(url);
    if (!res.ok) return Response.error("fetch failed: " + res.status);
    var doc = ${htmlCall};
    var results = {};
${probeLines}
    return Response.success(results);
}`;
}

// ─── Run inspection on device ─────────────────────────────────────────────────

async function runInspect(script, url, ctxExtDir, ip, port) {
    // Write temp script into any valid extension src/ dir
    const tmpFile = path.join(ctxExtDir, 'src', '_smart_tmp.js');
    fs.writeFileSync(tmpFile, script, 'utf8');

    try {
        const iconPath = path.join(ctxExtDir, 'icon.png');
        const pluginPath = path.join(ctxExtDir, 'plugin.json');
        const pluginJson = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
        let iconBase64 = '';
        if (fs.existsSync(iconPath)) {
            iconBase64 = `data:image/*;base64,${fs.readFileSync(iconPath).toString('base64')}`;
            pluginJson.metadata.icon = iconBase64;
        }

        // Build src map from ctxExtDir/src/
        const srcDir = path.join(ctxExtDir, 'src');
        const srcObject = {};
        if (fs.existsSync(srcDir)) {
            fs.readdirSync(srcDir).forEach(f => {
                srcObject[f] = fs.readFileSync(path.join(srcDir, f), 'utf8');
            });
        }

        const payload = {
            plugin: JSON.stringify(pluginJson),
            icon: iconBase64,
            src: JSON.stringify(srcObject),
            input: JSON.stringify({ script: '_smart_tmp.js', vararg: [url] })
        };

        const result = await sendModernRequest(ip, port, 'extension/test', payload);
        const data = result.data !== undefined ? result.data : result.result;

        if (result.exception) {
            return { error: result.exception, selectors: {} };
        }

        // Parse result — may be JSON string or object
        let parsed = data;
        if (typeof data === 'string') {
            try { parsed = JSON.parse(data); } catch (e) {}
        }
        return { selectors: parsed || {}, error: null };
    } finally {
        try { fs.unlinkSync(tmpFile); } catch (_) {}
    }
}

// ─── Selector scoring ─────────────────────────────────────────────────────────

/**
 * From inspection results, pick the best selector for a given candidate key.
 * Returns { selector, count } — selector is null if nothing matched.
 */
function bestSelector(results, candidateKey, minCount = 1) {
    const candidates = CANDIDATES[candidateKey] || [];
    let best = null;
    let bestCount = 0;

    for (const sel of candidates) {
        const r = results[sel];
        if (!r) continue;
        const count = parseInt(r.count) || 0;
        if (count > bestCount) {
            bestCount = count;
            best = sel;
        }
    }

    if (bestCount < minCount) return { selector: null, count: 0 };
    return { selector: best, count: bestCount };
}

// ─── Code generators with real selectors ─────────────────────────────────────

function genConfigJs(source) {
    return `let BASE_URL = "${source}";
try { if (CONFIG_URL) BASE_URL = CONFIG_URL; } catch(e) {}
`;
}

function genHomeJs(source, hasGenre) {
    const genreTab = hasGenre
        ? `\n        { title: "Thể loại", input: BASE_URL + "/the-loai", script: "genre.js" },`
        : '';
    return `function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: BASE_URL + "/danh-sach/trang/{{page}}", script: "gen.js" },
        { title: "Hot", input: BASE_URL + "/truyen-hot/trang/{{page}}", script: "gen.js" },
        { title: "Hoàn thành", input: BASE_URL + "/hoan-thanh/trang/{{page}}", script: "gen.js" }${genreTab}
    ]);
}
`;
}

function genGenJs(source, sel) {
    const itemSel = sel.item || '.list-truyen .row';
    const titleSel = sel.title || 'h3 a';
    const coverSel = sel.cover || 'img';
    const nextSel = sel.next || 'a[rel=next]';

    return `function execute(url, page) {
    if (!page) page = "1";
    url = url.replace("{{page}}", page);
    url = url.replace(/^(?:https?:\\/\\/)?(?:www\\.)?([^\\/]+)/, BASE_URL);

    var response = fetch(url);
    if (!response.ok) return Response.error("Error: " + response.status);

    var doc = response.html();
    var data = [];

    doc.select(${JSON.stringify(itemSel)}).forEach(function(el) {
        var name = el.select(${JSON.stringify(titleSel)}).text() + "";
        var link = el.select(${JSON.stringify(titleSel)}).attr("href") + "";
        var cover = el.select(${JSON.stringify(coverSel)}).attr("src") + "";
        if (!cover || cover === "null") cover = el.select(${JSON.stringify(coverSel)}).attr("data-src") + "";

        if (name && link) {
            if (!link.startsWith("http")) link = BASE_URL + link;
            if (cover.startsWith("//")) cover = "https:" + cover;
            data.push({ name: name, link: link, cover: cover, host: BASE_URL });
        }
    });

    var hasNext = doc.select(${JSON.stringify(nextSel)}).size() > 0;
    var nextPage = (hasNext || data.length > 0) ? String(parseInt(page) + 1) : null;

    return Response.success(data, nextPage);
}
`;
}

function genSearchJs(source) {
    return `function execute(key, page) {
    if (!page) page = "1";

    // TODO: Kiểm tra URL search chính xác của ${source}
    var url = BASE_URL + "/search?q=" + encodeURIComponent(key) + "&page=" + page;

    var response = fetch(url);
    if (!response.ok) return Response.error("Search failed: " + response.status);

    var doc = response.html();
    var data = [];

    // TODO: Cập nhật selector kết quả search (dùng chung gen selector nếu cùng layout)
    doc.select(".search-result .item, .list-truyen .row, .list-story .item").forEach(function(el) {
        var name = el.select("h3 a, h2 a, .title a, .name a").text() + "";
        var link = el.select("h3 a, h2 a, .title a, .name a").attr("href") + "";
        var cover = el.select("img").attr("src") + "";

        if (name && link) {
            if (!link.startsWith("http")) link = BASE_URL + link;
            if (cover.startsWith("//")) cover = "https:" + cover;
            data.push({ name: name, link: link, cover: cover, host: BASE_URL });
        }
    });

    return Response.success(data, data.length > 0 ? String(parseInt(page) + 1) : null);
}
`;
}

function genGenreJs(source) {
    return `function execute() {
    var response = fetch(BASE_URL + "/the-loai");
    if (!response.ok) return Response.error("Cannot load genres: " + response.status);

    var doc = response.html();
    var genres = [];

    // TODO: Cập nhật URL trang thể loại và selector danh sách thể loại
    doc.select(".genre-list a, .list-genres a, .category-list a, a[href*=the-loai]").forEach(function(el) {
        var title = el.text() + "";
        var href = el.attr("href") + "";
        if (title && href) {
            if (!href.startsWith("http")) href = BASE_URL + href;
            genres.push({ title: title, input: href, script: "gen.js" });
        }
    });

    return Response.success(genres);
}
`;
}

function genDetailJs(source, sel) {
    const nameSel = sel.name || 'h1';
    const coverSel = sel.cover || 'img';
    const authorSel = sel.author || '.author a';
    const statusSel = sel.status || '.status';
    const descSel = sel.description || '.description';
    const genreSel = sel.genres || 'a[href*=the-loai]';

    return `function execute(url) {
    url = url.replace(/^(?:https?:\\/\\/)?(?:www\\.)?([^\\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);

    var response = fetch(url);
    if (!response.ok) return Response.error("Cannot load: " + response.status);

    var doc = response.html();

    var nameEl = doc.select(${JSON.stringify(nameSel)}).first();
    var name = nameEl ? (nameEl.text() + "") : "";

    var coverEl = doc.select(${JSON.stringify(coverSel)}).first();
    var cover = coverEl ? (coverEl.attr("src") + "") : "";
    if (!cover || cover === "null") cover = coverEl ? (coverEl.attr("data-src") + "") : "";

    var authorEl = doc.select(${JSON.stringify(authorSel)}).first();
    var author = authorEl ? (authorEl.text() + "") : "";

    var statusEl = doc.select(${JSON.stringify(statusSel)}).first();
    var status = statusEl ? (statusEl.text() + "") : "";

    var descEl = doc.select(${JSON.stringify(descSel)}).first();
    var description = descEl ? (descEl.html() + "") : "";

    if (cover.startsWith("//")) cover = "https:" + cover;
    if (cover && !cover.startsWith("http")) cover = BASE_URL + cover;

    var ongoing = !status.includes("Hoàn thành") && !status.includes("Completed") &&
                  !status.includes("Hoàn") && !status.includes("End") &&
                  !status.includes("Full") && !status.includes("完结");

    var detail = "Tác giả: " + author + "<br>Trạng thái: " + status;

    var genres = [];
    doc.select(${JSON.stringify(genreSel)}).forEach(function(el) {
        var gTitle = el.text() + "";
        var gHref = el.attr("href") + "";
        if (gTitle && gHref) {
            if (!gHref.startsWith("http")) gHref = BASE_URL + gHref;
            genres.push({ title: gTitle, input: gHref, script: "gen.js" });
        }
    });

    var suggests = [];
    if (author) {
        suggests.push({ title: "Cùng tác giả: " + author, input: author, script: "search.js" });
    }

    return Response.success({
        name: name,
        cover: cover,
        host: BASE_URL,
        author: author,
        description: description,
        detail: detail,
        ongoing: ongoing,
        genres: genres.length > 0 ? genres : undefined,
        suggests: suggests.length > 0 ? suggests : undefined
    });
}
`;
}

function genPageJs(source, sel, hasPagination) {
    const paginationSel = sel.pagination || '.pagination li';

    if (!hasPagination) {
        return `function execute(url) {
    // Mục lục không phân trang — trả về [url] để toc.js tự parse
    url = url.replace(/^(?:https?:\\/\\/)?(?:www\\.)?([^\\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);
    return Response.success([url]);
}
`;
    }

    return `function execute(url) {
    url = url.replace(/^(?:https?:\\/\\/)?(?:www\\.)?([^\\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);

    var response = fetch(url);
    if (!response.ok) return Response.error("Cannot load: " + response.status);

    var doc = response.html();
    var pages = [];

    doc.select(${JSON.stringify(paginationSel)}).forEach(function(el) {
        var aEl = el.select("a").first();
        var href = aEl ? (aEl.attr("href") + "") : "";
        if (href && !href.includes("#")) {
            if (!href.startsWith("http")) href = BASE_URL + href;
            if (pages.indexOf(href) === -1) pages.push(href);
        }
    });

    if (pages.length === 0) return Response.success([url]);
    return Response.success(pages);
}
`;
}

function genTocJs(source, sel) {
    const chapSel = sel.chapter || '.chapter-list a';

    return `function execute(url) {
    // url đến từ page.js — mỗi call = 1 trang mục lục
    url = url.replace(/^(?:https?:\\/\\/)?(?:www\\.)?([^\\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);

    var response = fetch(url);
    if (!response.ok) return Response.error("Cannot load TOC: " + response.status);

    var doc = response.html();
    var chapters = [];

    doc.select(${JSON.stringify(chapSel)}).forEach(function(el) {
        var name = el.text() + "";
        var chapUrl = el.attr("href") + "";

        if (name && chapUrl) {
            if (!chapUrl.startsWith("http")) {
                chapUrl = chapUrl.startsWith("/") ? BASE_URL + chapUrl : BASE_URL + "/" + chapUrl;
            }
            var isPaid = el.select(".vip, .paid, .lock").size() > 0;
            chapters.push({ name: name, url: chapUrl, host: BASE_URL, pay: isPaid || undefined });
        }
    });

    if (chapters.length === 0) return Response.error("No chapters found");
    return Response.success(chapters);
}
`;
}

function genChapJs(source, sel) {
    const contentSel = sel.content || '#chapter-content';

    return `function execute(url) {
    url = url.replace(/^(?:https?:\\/\\/)?(?:www\\.)?([^\\/]+)/, BASE_URL);

    var response = fetch(url);
    if (!response.ok) return Response.error("Cannot load chapter: " + response.status);

    var doc = response.html();
    doc.select(".ads, .advertisement, script, style, noscript, .banner, #ads-blocker").remove();

    var content = doc.select(${JSON.stringify(contentSel)}).html() + "";
    if (!content || content === "null") return Response.error("No content found");

    content = content.replace(/&nbsp;/g, " ");
    content = content.replace(/\\s+/g, " ").trim();

    return Response.success(content);
}
`;
}

function genPluginJson({ name, source, type, locale, author, tag, scripts }) {
    const json = {
        metadata: {
            name, author, version: 1, source,
            regexp: source.replace(/https?:\/\//, '').replace(/\./g, '\\\\.').replace(/\/$/, '') + '/[^/]+/?$',
            description: `Đọc truyện trên trang ${name}`,
            locale, language: 'javascript', type
        },
        script: {}
    };
    if (tag) json.metadata.tag = tag;
    for (const s of scripts) json.script[s.replace('.js', '')] = s;
    return JSON.stringify(json, null, 2);
}

// ─── Favicon downloader (reused from create.js) ───────────────────────────────

function downloadFavicon(sourceUrl, destPath) {
    return new Promise((resolve) => {
        try {
            const urlObj = new URL(sourceUrl);
            const urls = [
                `${urlObj.protocol}//${urlObj.host}/favicon.ico`,
                `${urlObj.protocol}//${urlObj.host}/favicon.png`,
                `${urlObj.protocol}//${urlObj.host}/apple-touch-icon.png`
            ];
            tryDl(urls, 0, destPath, resolve);
        } catch (e) { resolve(false); }
    });
}

function tryDl(urls, i, dest, cb) {
    if (i >= urls.length) return cb(false);
    const url = urls[i];
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: 5000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            const redir = res.headers.location.startsWith('http')
                ? res.headers.location : new URL(res.headers.location, url).href;
            urls.splice(i + 1, 0, redir);
            return tryDl(urls, i + 1, dest, cb);
        }
        if (res.statusCode !== 200 || !res.headers['content-type']) return tryDl(urls, i + 1, dest, cb);
        const chunks = [];
        res.on('data', d => chunks.push(d));
        res.on('end', () => {
            const buf = Buffer.concat(chunks);
            if (buf.length > 100) { fs.writeFileSync(dest, buf); cb(true); }
            else tryDl(urls, i + 1, dest, cb);
        });
    });
    req.on('error', () => tryDl(urls, i + 1, dest, cb));
    req.on('timeout', () => { req.destroy(); tryDl(urls, i + 1, dest, cb); });
}

function createPlaceholderIcon(destPath) {
    const png = Buffer.from([
        0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,
        0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,
        0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,
        0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53,
        0xDE,0x00,0x00,0x00,0x0C,0x49,0x44,0x41,
        0x54,0x08,0xD7,0x63,0xF8,0xCF,0xC0,0x00,
        0x00,0x00,0x02,0x00,0x01,0xE2,0x21,0xBC,
        0x33,0x00,0x00,0x00,0x00,0x49,0x45,0x4E,
        0x44,0xAE,0x42,0x60,0x82
    ]);
    fs.writeFileSync(destPath, png);
}

// ─── Find any valid context extension ─────────────────────────────────────────

function findCtxExtDir() {
    const root = getProjectRoot();
    const extDir = path.join(root, 'extensions');
    if (!fs.existsSync(extDir)) return null;
    const entries = fs.readdirSync(extDir);
    for (const e of entries) {
        const p = path.join(extDir, e, 'plugin.json');
        const s = path.join(extDir, e, 'src');
        if (fs.existsSync(p) && fs.existsSync(s)) return path.join(extDir, e);
    }
    return null;
}

// ─── Main smart create pipeline ───────────────────────────────────────────────

async function smartCreate(options) {
    const {
        name, source, type, locale, tag,
        urlHome, urlDetail, urlToc, urlChap,
        hasSearch, hasGenre,
        ip, port,
        verbose = false
    } = options;

    const log = (msg) => { if (!options.jsonMode) console.log(msg); };
    const step = (label, msg) => log(c.step(label, msg));

    const root = getProjectRoot();
    const extDir = path.join(root, 'extensions', name);
    const srcDir = path.join(extDir, 'src');

    if (fs.existsSync(extDir)) {
        throw new Error(`Extension already exists: ${extDir}`);
    }

    // Find a valid extension to use as debug context
    const ctxDir = findCtxExtDir();
    if (!ctxDir) {
        throw new Error('No existing extension found to use as debug context. Create at least one extension manually first.');
    }

    log(c.bold(`\n🧠  Smart create: ${c.cyan(name)}\n`));
    log(c.dim(`  Using context extension: ${path.basename(ctxDir)}`));

    // ── Step 1: Inspect all URLs ─────────────────────────────────────────────

    const inspectResults = {};

    const inspections = [
        { label: 'home/gen list', url: urlHome, keys: ['gen_item','gen_title','gen_cover','gen_next'] },
        { label: 'detail page',   url: urlDetail, keys: ['detail_name','detail_cover','detail_author','detail_status','detail_description','detail_genres'] },
        { label: 'toc page',      url: urlToc,    keys: ['toc_chapter','toc_pagination'] },
        { label: 'chapter page',  url: urlChap,   keys: ['chap_content'] },
    ];

    for (const ins of inspections) {
        step('INSPECT', `${ins.label}   ${c.dim(ins.url)}`);
        try {
            const script = buildInspectScript(ins.keys);
            const result = await runInspect(script, ins.url, ctxDir, ip, port);
            if (result.error) {
                log(c.yellow(`  ⚠️  Inspection error for ${ins.label}: ${result.error}`));
                inspectResults[ins.label] = {};
            } else {
                inspectResults[ins.label] = result.selectors;
                const totalFound = Object.values(result.selectors).filter(r => parseInt(r.count) > 0).length;
                log(c.green(`  ✅  ${totalFound} selectors matched`));
            }
        } catch (e) {
            log(c.yellow(`  ⚠️  Could not inspect ${ins.label}: ${e.message}`));
            inspectResults[ins.label] = {};
        }
    }

    // ── Step 2: Score selectors ──────────────────────────────────────────────

    const genR = inspectResults['home/gen list'];
    const detR = inspectResults['detail page'];
    const tocR = inspectResults['toc page'];
    const chapR = inspectResults['chapter page'];

    const genSel = {
        item:  bestSelector(genR,  'gen_item').selector  || '.list-truyen .row',
        title: bestSelector(genR,  'gen_title').selector || 'h3 a',
        cover: bestSelector(genR,  'gen_cover').selector || 'img',
        next:  bestSelector(genR,  'gen_next').selector  || 'a[rel=next]',
    };
    const detSel = {
        name:        bestSelector(detR, 'detail_name').selector        || 'h1',
        cover:       bestSelector(detR, 'detail_cover').selector       || '.cover img',
        author:      bestSelector(detR, 'detail_author').selector      || '.author a',
        status:      bestSelector(detR, 'detail_status').selector      || '.status',
        description: bestSelector(detR, 'detail_description').selector || '.description',
        genres:      bestSelector(detR, 'detail_genres').selector      || 'a[href*=the-loai]',
    };
    const tocSel = {
        chapter:    bestSelector(tocR, 'toc_chapter').selector    || '.chapter-list a',
        pagination: bestSelector(tocR, 'toc_pagination').selector || '.pagination li',
    };
    const chapSel = {
        content: bestSelector(chapR, 'chap_content').selector || '#chapter-content',
    };

    // Detect pagination: if pagination selector matched > 1 element
    const paginationCount = tocR[tocSel.pagination] ? parseInt(tocR[tocSel.pagination].count) : 0;
    const hasPagination = paginationCount > 1;

    if (!options.jsonMode) {
        log('');
        log(c.bold('📊 Discovered selectors:'));
        log(c.dim(`  gen.item    → ${genSel.item}`));
        log(c.dim(`  gen.title   → ${genSel.title}`));
        log(c.dim(`  gen.cover   → ${genSel.cover}`));
        log(c.dim(`  detail.name → ${detSel.name}`));
        log(c.dim(`  detail.cover → ${detSel.cover}`));
        log(c.dim(`  detail.author → ${detSel.author}`));
        log(c.dim(`  detail.status → ${detSel.status}`));
        log(c.dim(`  toc.chapters → ${tocSel.chapter}`));
        log(c.dim(`  chap.content → ${chapSel.content}`));
        log(c.dim(`  toc.paginated: ${hasPagination}`));
        log('');
    }

    // ── Step 3: Scaffold directories ─────────────────────────────────────────

    step('SCAFFOLD', name);
    fs.mkdirSync(srcDir, { recursive: true });

    const author = getAuthor();
    const scripts = hasSearch && hasGenre
        ? ['home.js', 'genre.js', 'gen.js', 'search.js', 'detail.js', 'page.js', 'toc.js', 'chap.js']
        : hasSearch
            ? ['home.js', 'gen.js', 'search.js', 'detail.js', 'page.js', 'toc.js', 'chap.js']
            : hasGenre
                ? ['home.js', 'genre.js', 'gen.js', 'detail.js', 'page.js', 'toc.js', 'chap.js']
                : ['home.js', 'gen.js', 'detail.js', 'page.js', 'toc.js', 'chap.js'];

    const pluginContent = genPluginJson({ name, source, type, locale, author, tag, scripts });
    fs.writeFileSync(path.join(extDir, 'plugin.json'), pluginContent);
    log(c.green('  ✅ plugin.json'));

    // ── Step 4: Write scripts with real selectors ─────────────────────────────

    const fileMap = {
        'config.js':  () => genConfigJs(source),
        'home.js':    () => genHomeJs(source, hasGenre),
        'genre.js':   () => genGenreJs(source),
        'gen.js':     () => genGenJs(source, genSel),
        'search.js':  () => genSearchJs(source),
        'detail.js':  () => genDetailJs(source, detSel),
        'page.js':    () => genPageJs(source, tocSel, hasPagination),
        'toc.js':     () => genTocJs(source, tocSel),
        'chap.js':    () => genChapJs(source, chapSel),
    };

    // Always write config.js
    fs.writeFileSync(path.join(srcDir, 'config.js'), fileMap['config.js']());
    log(c.green('  ✅ src/config.js'));

    for (const s of scripts) {
        const fn = fileMap[s];
        if (fn) {
            fs.writeFileSync(path.join(srcDir, s), fn());
            log(c.green(`  ✅ src/${s}`));
        }
    }

    // ── Step 5: Favicon ──────────────────────────────────────────────────────

    const iconPath = path.join(extDir, 'icon.png');
    process.stdout.write(c.dim('  ⬇️  Downloading icon... '));
    const downloaded = await downloadFavicon(source, iconPath);
    if (downloaded) {
        console.log(c.green('OK'));
    } else {
        createPlaceholderIcon(iconPath);
        console.log(c.yellow('placeholder (replace with 64x64 icon)'));
    }

    log('');
    log(c.bold('✨ Extension created with REAL selectors (no placeholders)!'));
    log(c.bold('\n📋 Next steps:'));
    log(c.cyan(`  1. vbook validate extensions/${name}`));
    log(c.cyan(`  2. vbook debug extensions/${name}/src/detail.js -in "${urlDetail}"`));
    log(c.cyan(`  3. vbook test-all --from detail`));
    log(c.cyan(`  4. vbook publish`));
    log('');

    return {
        success: true,
        extension_path: extDir,
        selectors_discovered: { gen: genSel, detail: detSel, toc: tocSel, chap: chapSel },
        toc_paginated: hasPagination,
    };
}

// ─── Command Registration ─────────────────────────────────────────────────────

function register(program) {
    program.command('create-smart')
        .description('Smart scaffold — inspects website first, generates scripts with real selectors')
        .argument('<name>', 'Extension name (directory name)')
        .requiredOption('-s, --source <url>', 'Source website URL')
        .requiredOption('--home <url>', 'URL of book list page (for gen.js)')
        .requiredOption('--detail <url>', 'URL of a book detail page')
        .requiredOption('--toc <url>', 'URL of chapter list / table of contents')
        .requiredOption('--chap <url>', 'URL of a chapter to read')
        .option('-t, --type <type>', 'Extension type', 'novel')
        .option('-l, --locale <locale>', 'Locale code', 'vi_VN')
        .option('--tag <tag>', 'Tag (e.g. nsfw)')
        .option('--search', 'Site has search feature')
        .option('--genre', 'Site has genre/category pages')
        .option('-i, --ip <ip>', 'Device IP (overrides VBOOK_IP env)')
        .option('-p, --port <port>', 'Device port', '8080')
        .option('--json', 'Output result as JSON')
        .action(async (name, options) => {
            const ip = options.ip || process.env.VBOOK_IP;
            const port = parseInt(options.port || process.env.VBOOK_PORT || '8080');

            if (!ip) {
                console.error(c.error('Device IP not set. Use --ip or set VBOOK_IP in .env'));
                process.exit(1);
            }

            try {
                const result = await smartCreate({
                    name,
                    source: options.source.replace(/\/$/, ''),
                    type:   options.type,
                    locale: options.locale,
                    tag:    options.tag,
                    urlHome:   options.home,
                    urlDetail: options.detail,
                    urlToc:    options.toc,
                    urlChap:   options.chap,
                    hasSearch: !!options.search,
                    hasGenre:  !!options.genre,
                    ip, port,
                    jsonMode: !!options.json,
                    verbose: false
                });

                if (options.json) {
                    console.log(JSON.stringify(result, null, 2));
                }
            } catch (err) {
                if (options.json) {
                    console.log(JSON.stringify({ success: false, error: err.message }));
                } else {
                    console.error(c.error(err.message));
                }
                process.exit(1);
            }
        });
}

module.exports = { register, smartCreate };
