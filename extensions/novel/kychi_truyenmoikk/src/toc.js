load('config.js');
function execute(url) {
    url = normalizeTocUrl(url);
    var pageInfo = getPageInfo(url);
    var response = fetchPage(url);
    if (!response.ok) return Response.error('HTTP Error: ' + response.status);
    var doc = response.html();
    var chapters = [];
    var items = doc.select('#list-chapter ul.list-chapter li a, .list-chapter li a');
    for (var i = 0; i < items.size(); i++) {
        var e = items.get(i);
        var chapterUrl = e.attr('href');
        var chapterName = e.text().trim();
        if (!isChapterInPageRange(chapterUrl, chapterName, pageInfo)) continue;
        chapters.push({
            name: chapterName,
            url: chapterUrl,
            host: BASE_URL
        });
    }

    return Response.success(chapters);
}

function getPageInfo(url) {
    var pageNum = 1;
    var match = String(url || '').match(/\/trang-(\d+)\/?$/i);
    if (match) {
        pageNum = parseInt(match[1], 10);
        if (!pageNum || pageNum < 1) pageNum = 1;
    }
    var perPage = 50;
    return {
        page: pageNum,
        min: (pageNum - 1) * perPage + 1,
        max: pageNum * perPage
    };
}

function extractChapterNumber(chapterUrl, chapterName) {
    var mUrl = String(chapterUrl || '').match(/\/chuong-(\d+)\/?$/i);
    if (mUrl) return parseInt(mUrl[1], 10);
    var mName = String(chapterName || '').match(/chương\s*(\d+)/i);
    if (mName) return parseInt(mName[1], 10);
    return 0;
}

function isChapterInPageRange(chapterUrl, chapterName, pageInfo) {
    var num = extractChapterNumber(chapterUrl, chapterName);
    if (!num) return true;
    return num >= pageInfo.min && num <= pageInfo.max;
}

function normalizeTocUrl(u) {
    u = String(u || '').replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    if (u.indexOf('//') === 0) u = 'https:' + u;
    u = u.replace(/#.*$/, '');
    if (!/\/chuong-/.test(u) && u.charAt(u.length - 1) !== '/') u = u + '/';
    return u;
}