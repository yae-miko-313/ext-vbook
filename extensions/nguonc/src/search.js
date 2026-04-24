load("config.js");

function mapSearchItem(item) {
    var slug = cleanText(item.slug);
    var thumb = normalizeLink(item.thumb_url || "");
    var poster = normalizeLink(item.poster_url || "");
    return {
        name: cleanText(item.name || item.original_name || slug),
        link: buildFilmWebUrl(slug),
        cover: thumb || poster,
        description: cleanText(item.current_episode || item.quality || ""),
        host: BASE_URL
    };
}

function execute(key, page) {
    page = page || "1";
    var apiUrl = BASE_URL + "/api/films/search?keyword=" + encodeURIComponent((key || "") + "");

    var api = getJson(apiUrl);
    if (!api.ok) return Response.error("Search failed: " + api.status);

    var payload = api.data || {};
    var items = payload.items || [];
    var result = [];

    items.forEach(function(item) {
        result.push(mapSearchItem(item));
    });

    return Response.success(result, null);
}
