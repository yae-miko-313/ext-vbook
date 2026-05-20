load('config.js');

function execute(url, page) {
    page = page || '1';
    url = buildPageUrl(url, page);

    var response = fetchPage(url);
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