load('config.js');

function execute(url) {
    // Normalize URL
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    if (url.charAt(url.length - 1) !== '/') url = url + '/';

    let response = fetch(url);
    if (!response.ok) return Response.error("Không thể tải trang");
    let html = response.text();

    let storyId = extractStoryId(html);
    if (!storyId) return Response.error("Không tìm thấy ID truyện");

    // Get total pages from API
    let apiBase = API_URL + "/novels/" + storyId + "/chapters?page=";
    let apiResponse = fetch(apiBase + "1");
    if (!apiResponse.ok) return Response.error("API lỗi");
    let json = JSON.parse(apiResponse.text());
    let totalPages = json.totalPages || 1;

    // Build page list
    let data = [];
    for (let i = 1; i <= totalPages; i++) {
        data.push(apiBase + i);
    }
    return Response.success(data);
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
