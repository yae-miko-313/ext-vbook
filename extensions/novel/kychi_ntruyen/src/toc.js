load('config.js');
function execute(url) {
    var apiUrl = buildApiUrl(url, BASE_URL);
    if (!apiUrl) return Response.error('Không lấy được API chương');
    var listchapter = [];
    var response = fetchPage(apiUrl);
    if (!response.ok) return Response.error('HTTP Error: ' + response.status);
    var json = JSON.parse(response.text());
    var chapters = json.chapters || [];
    chapters.forEach(function(e) {
        listchapter.push({
            name: e.name,
            url: '/doc-truyen/' + e.slug + '-' + e.id,
            host: BASE_URL
        });
    });
    return Response.success(listchapter);
}

function buildApiUrl(url, baseUrl) {
    if (!url) return null;
    if (url.indexOf('api.ntruyen.biz/novels/') >= 0) return url;
    var normalized = url;
    if (normalized.indexOf('http') !== 0) {
        normalized = baseUrl + normalized;
    }
    normalized = normalized.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    var response = fetchPage(normalized);
    if (!response.ok) return null;
    var html = response.text();
    var storyId = extractStoryId(html);
    if (!storyId) return null;
    return 'https://api.ntruyen.biz/novels/' + storyId + '/chapters?page=1';
}

function extractStoryId(html) {
    var normalized = html.replace(/\\"/g, '"');
    var patterns = [
        /"data"\s*:\s*\{"id"\s*:\s*(\d+)/,
        /"novelId"\s*:\s*(\d+)/
    ];
    for (var i = 0; i < patterns.length; i++) {
        var match = normalized.match(patterns[i]);
        if (match) return match[1];
    }
    return null;
}