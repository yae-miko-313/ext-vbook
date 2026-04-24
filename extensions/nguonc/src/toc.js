load("config.js");

function extractSlugFromUrl(url) {
    var m = (url || "").match(/\/phim\/([a-zA-Z0-9-]+)/);
    if (m && m[1]) return m[1] + "";
    m = (url || "").match(/\/api\/film\/([a-zA-Z0-9-]+)/);
    if (m && m[1]) return m[1] + "";
    return "";
}

function pushChap(chapters, name, data, pay) {
    chapters.push({
        name: name,
        url: data,
        host: BASE_URL,
        pay: pay ? true : undefined
    });
}

function execute(url) {
    var slug = extractSlugFromUrl(url);
    if (!slug) return Response.error("Invalid detail URL");

    var api = getJson(buildFilmApiUrl(slug));
    if (!api.ok) return Response.error("Cannot load: " + api.status);

    var movie = (api.data || {}).movie || {};
    var servers = movie.episodes || [];
    var chapters = [];

    servers.forEach(function(server) {
        var serverName = cleanText(server.server_name || "Server");
        var items = server.items || [];

        items.forEach(function(item) {
            var epName = cleanText(item.name || item.slug || "Episode");
            var m3u8 = normalizeLink(item.m3u8 || "");
            var embed = normalizeLink(item.embed || "");
            var data = m3u8 || embed;
            if (!data) return;

            var encoded = encodeURIComponent(JSON.stringify({
                m3u8: m3u8,
                embed: embed,
                slug: cleanText(item.slug || "")
            }));

            pushChap(chapters, serverName + " - Tập " + epName, "nguonc://track?data=" + encoded, false);
        });
    });

    if (chapters.length === 0) return Response.error("No episodes found");
    return Response.success(chapters);
}
