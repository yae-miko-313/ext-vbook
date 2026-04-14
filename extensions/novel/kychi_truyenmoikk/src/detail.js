load('config.js');
function execute(url) {
    var response = fetchPage(url);
    if (response.ok) {
        var doc = response.html();
        var name = doc.select('h3[itemprop="name"]').text();
        if (!name) name = doc.select('h3.truyen-title').text();
        var cover = doc.select('img[itemprop="image"]').attr('src');
        if (!cover) cover = doc.select('.book img').attr('src');
        var author = doc.select('[itemprop="author"]').text();
        if (!author) author = doc.select('.author').text();
        var description = doc.select('[itemprop="description"]').html();
        if (!description) description = doc.select('.desc-text').html();
        var detail = doc.select('.info').html();
        if (!detail) detail = doc.select('.cat-link').html();
        if (!detail) detail = author;
        return Response.success({
            name: name,
            cover: cover,
            author: author,
            description: description,
            detail: detail,
            host: BASE_URL
        });
    }
    return Response.error('HTTP Error: ' + response.status);
}