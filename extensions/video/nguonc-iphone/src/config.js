var BASE_URL = "https://phim.nguonc.com";

function normalizeUrl(url) {
    if (url && typeof url !== "string") {
        if (url.length > 0) {
            url = url[0];
        } else {
            url = BASE_URL;
        }
    }
    url = url || BASE_URL;
    // Xóa trailing slash trước khi xử lý
    url = url.replace(/\/$/, "");
    return url.replace(/^https?:\/\/([^\/]+)(\/.*)?$/, function(match, domain, path) {
        path = path || "";
        return BASE_URL + path;
    });
}

function parseCards(json) {
    var list = [];
    var items = [];
    if (json) {
        if (Array.isArray(json.items)) {
            items = json.items;
        } else if (json.data && Array.isArray(json.data.items)) {
            items = json.data.items;
        }
    }
    
    items.forEach(function(item) {
        var cover = item.poster_url || item.thumb_url;
        
        var description = "";
        if (item.year) description += item.year;
        if (item.current_episode) description += " • " + item.current_episode;
        if (item.quality) description += " • " + item.quality;
        if (item.language) description += " " + item.language;

        list.push({
            name: item.name,
            link: "https://phim.nguonc.com/phim/" + item.slug,
            cover: cover,
            description: description.trim(),
            host: "https://phim.nguonc.com"
        });
    });
    return list;
}
