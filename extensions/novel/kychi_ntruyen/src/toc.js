load('config.js');

function execute(url) {
    var apiUrl = buildApiUrl(url, BASE_URL);
    if (!apiUrl) return Response.error('Không lấy được API chương');

    var allChapters = [];
    var page = 1;
    var maxPages = 1000;

    while (page <= maxPages) {
        var pageUrl = apiUrl.replace(/\?page=\d+$/, '') + '?page=' + page;
        var response = fetchPage(pageUrl);

        if (!response.ok) {
            if (allChapters.length > 0) break;
            return Response.error('HTTP Error: ' + response.status);
        }

        var json;
        try {
            json = JSON.parse(response.text());
        } catch (e) {
            if (allChapters.length > 0) break;
            return Response.error('Lỗi parse JSON');
        }

        var chapters = json.chapters || [];

        // Stop when no more chapters
        if (chapters.length === 0) break;

        chapters.forEach(function(e) {
            allChapters.push({
                name: e.name,
                url: '/doc-truyen/' + e.slug + '-' + e.id,
                host: BASE_URL
            });
        });

        // Check if there's a next page from API
        var hasMore = json.hasNextPage || json.next_page || json.next_page_url;
        if (hasMore === false || hasMore === null) break;

        // Also stop if we got fewer chapters than typical page size
        if (chapters.length < 20) break;

        page++;
    }

    return Response.success(allChapters);
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