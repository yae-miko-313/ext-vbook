load("config.js");

function replacePage(url, page) {
    var u = (url || "") + "";
    if (u.indexOf("{{page}}") > -1) return u.replace("{{page}}", page);
    if (u.indexOf("?page=") > -1 || u.indexOf("&page=") > -1) {
        return u.replace(/([?&]page=)\d+/i, "$1" + page);
    }
    return u + (u.indexOf("?") > -1 ? "&" : "?") + "page=" + page;
}

function mapFilmItem(item) {
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

function execute(url, page) {
    page = page || "1";
    var p = parseInt(page, 10);
    if (!(p > 0)) {
        p = 1;
        page = "1";
    }

    var pageUrl = replacePage(url, page);
    var api = getJson(pageUrl);
    if (!api.ok) return Response.error("Cannot load: " + api.status);

    var payload = api.data || {};
    var items = payload.items || [];
    var result = [];

    items.forEach(function(item) {
        result.push(mapFilmItem(item));
    });

    var paginate = payload.paginate || {};
    var currentPage = parseInt(paginate.current_page, 10);
    var totalPage = parseInt(paginate.total_page, 10);

    if (!(currentPage > 0)) currentPage = p;
    if (!(totalPage > 0)) totalPage = currentPage;

    var nextPage = currentPage < totalPage ? String(currentPage + 1) : null;
    return Response.success(result, nextPage);
}
