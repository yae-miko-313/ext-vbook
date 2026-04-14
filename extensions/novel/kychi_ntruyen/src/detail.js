load('config.js');
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    var response = fetchPage(url);
    if (!response.ok) return Response.error('HTTP Error: ' + response.status);
    var doc = response.html();
    var genres = [];
    var genresText = [];
    doc.select("header[itemtype='https://schema.org/Book'] a[itemprop='genre']").forEach(function(e) {
        var title = e.text();
        genresText.push(title);
        genres.push({
            title: title,
            input: e.attr('href'),
            script: 'gen.js'
        });
    });
    var description = doc.select("article[itemprop='description'] [itemprop='description']").text();
    return Response.success({
        name: doc.select("header[itemtype='https://schema.org/Book'] h1[itemprop='name']").text(),
        cover: doc.select("header[itemtype='https://schema.org/Book'] img.object-cover.rounded-xl").attr('src'),
        host: BASE_URL,
        author: doc.select("header[itemtype='https://schema.org/Book'] [itemprop='author'] [itemprop='name']").text(),
        description: genresText.join(', ') + (description ? '<br>' + description : ''),
        genres: genres
    });
}