load('config.js');

function execute(key, page) {
    if (!page) page = '1';
    let response = fetch(BASE_URL + "/novel/list?keyword=" + encodeURIComponent(key) + "&searchType=1&page=" + page);
    if (!response.ok) return Response.error(CF_MESSAGE);

    let doc = response.html();
    if (isCloudflare(doc)) return Response.error(CF_MESSAGE);
    // Guests get the unfiltered list back: the server drops the keyword and flags the wall.
    if (doc.select("#wall").attr("data-search-guest") === "1") {
        return Response.error("UAA yêu cầu đăng nhập để tìm kiếm. Mở browser đăng nhập uaa.com rồi thử lại");
    }
    return Response.success(parseCards(doc), nextPage(doc, page));
}
