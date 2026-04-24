load("config.js");

function extractSlugFromUrl(url) {
    var m = (url || "").match(/\/phim\/([a-zA-Z0-9-]+)/);
    if (m && m[1]) return m[1] + "";
    m = (url || "").match(/\/api\/film\/([a-zA-Z0-9-]+)/);
    if (m && m[1]) return m[1] + "";
    return "";
}

function toSlug(text) {
    var s = cleanText(text).toLowerCase();
    if (!s) return "";

    var from = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ";
    var to =   "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd";

    for (var i = 0; i < from.length; i++) {
        s = s.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
    }

    s = s.replace(/[^a-z0-9\s-]/g, "");
    s = s.replace(/\s+/g, "-");
    s = s.replace(/-+/g, "-");
    s = s.replace(/^-|-$/g, "");
    return s;
}

function categoryLinkByGroup(groupName, itemName) {
    var groupSlug = toSlug(groupName);
    var itemSlug = toSlug(itemName);
    if (!groupSlug || !itemSlug) return "";

    if (groupSlug === "the-loai") {
        return BASE_URL + "/api/films/the-loai/" + encodeURIComponent(itemSlug) + "?page=1";
    }
    if (groupSlug === "quoc-gia") {
        return BASE_URL + "/api/films/quoc-gia/" + encodeURIComponent(itemSlug) + "?page=1";
    }
    if (groupSlug === "nam") {
        return BASE_URL + "/api/films/nam-phat-hanh/" + encodeURIComponent(itemSlug) + "?page=1";
    }
    if (groupSlug === "dinh-dang") {
        return BASE_URL + "/api/films/danh-sach/" + encodeURIComponent(itemSlug) + "?page=1";
    }

    return "";
}

function extractGenresFromCategory(category) {
    var genres = [];
    var seen = {};

    for (var key in category) {
        if (!category.hasOwnProperty(key)) continue;
        var node = category[key] || {};
        var groupName = cleanText((node.group || {}).name);
        var list = node.list || [];

        list.forEach(function(item) {
            var name = cleanText(item.name);
            var input = categoryLinkByGroup(groupName, name);
            if (!name || !input || seen[input]) return;
            seen[input] = true;
            genres.push({
                title: groupName ? (groupName + ": " + name) : name,
                input: input,
                script: "gen.js"
            });
        });
    }

    return genres;
}

function execute(url) {
    var slug = extractSlugFromUrl(url);
    if (!slug) return Response.error("Invalid detail URL");

    var api = getJson(buildFilmApiUrl(slug));
    if (!api.ok) return Response.error("Cannot load: " + api.status);

    var movie = (api.data || {}).movie || {};
    var name = cleanText(movie.name || movie.original_name || slug);

    var thumb = normalizeLink(movie.thumb_url || "");
    var poster = normalizeLink(movie.poster_url || "");
    var cover = thumb || poster;

    var detailParts = [];
    if (movie.current_episode) detailParts.push("Tập hiện tại: " + cleanText(movie.current_episode));
    if (movie.total_episodes) detailParts.push("Tổng tập: " + cleanText(movie.total_episodes));
    if (movie.quality) detailParts.push("Chất lượng: " + cleanText(movie.quality));
    if (movie.language) detailParts.push("Ngôn ngữ: " + cleanText(movie.language));
    if (movie.time) detailParts.push("Thời lượng: " + cleanText(movie.time));
    if (movie.director) detailParts.push("Đạo diễn: " + cleanText(movie.director));

    var description = cleanText(movie.description || "");
    var currentEpisode = cleanText(movie.current_episode).toLowerCase();
    var ongoing = currentEpisode.indexOf("hoàn tất") === -1 && currentEpisode.indexOf("full") === -1;
    var genres = extractGenresFromCategory(movie.category || {});

    return Response.success({
        name: name,
        cover: cover,
        host: BASE_URL,
        author: cleanText(movie.director || "NguonC"),
        detail: detailParts.join("\n"),
        description: description,
        ongoing: ongoing,
        genres: genres.length > 0 ? genres : undefined,
        suggests: [{ title: "Tìm: " + name, input: name, script: "search.js" }]
    });
}
