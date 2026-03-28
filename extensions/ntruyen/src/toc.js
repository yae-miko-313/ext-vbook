load('config.js');

function execute(url) {
    let apiUrl = buildApiUrl(url);
    if (!apiUrl) return Response.error("Không thể tạo API URL");

    let response = fetch(apiUrl);
    if (!response.ok) return Response.error("API lỗi: " + response.status);

    let json = JSON.parse(response.text());
    let chapters = json.chapters || [];
    let listchapter = [];

    chapters.forEach(function(e) {
        listchapter.push({
            name: e.name,
            // Pass API URL directly to chap.js — bypasses Shopee redirect completely
            url: API_URL + "/chapters/" + e.id
        });
    });

    return Response.success(listchapter);
}

function buildApiUrl(url) {
    if (!url) return null;
    // If already an API URL (from page.js), use directly
    if (url.indexOf("api.ntruyen.biz/novels/") >= 0) return url;

    // Otherwise, fetch the detail page to extract storyId
    let normalized = url;
    if (normalized.indexOf("http") !== 0) {
        normalized = BASE_URL + normalized;
    }
    normalized = normalized.replace(
        /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img,
        BASE_URL
    );

    let response = fetch(normalized);
    if (!response.ok) return null;
    let html = response.text();

    let storyId = extractStoryId(html);
    if (!storyId) return null;

    return API_URL + "/novels/" + storyId + "/chapters?page=1";
}

function extractStoryId(html) {
    let normalized = html.replace(/\\"/g, '"');
    let patterns = [
        /"data"\s*:\s*\{"id"\s*:\s*(\d+)/,
        /"novelId"\s*:\s*(\d+)/
    ];
    for (let i = 0; i < patterns.length; i++) {
        let match = normalized.match(patterns[i]);
        if (match) return match[1];
    }
    return null;
}
