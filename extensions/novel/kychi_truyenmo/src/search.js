load('config.js');

function execute(keyword, page) {
    page = page || '1';
    keyword = String(keyword || '').trim();
    if (!keyword) return Response.success([], '');

    var searchUrl = BASE_URL + '/tim-kiem?search=' + encodeURIComponent(keyword).replace(/%20/g, '+');
    searchUrl = buildPageUrl(searchUrl, page);

    var response = fetchPage(searchUrl);
    if (!response.ok) return Response.error('HTTP Error: ' + response.status);

    var doc = response.html();
    var data = [];
    var seen = {};

    collectStoryCards(doc.select('.single-story-block'), data, seen);
    collectStoryCards(doc.select('.row.product-grid > div'), data, seen);

    if (!data.length) {
        collectStoryCards(doc.select('[class*="story"]'), data, seen);
    }

    var next = detectNextPage(doc);

    return Response.success(data, next);
}