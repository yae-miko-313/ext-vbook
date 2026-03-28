load('config.js');

function execute(url) {
    // Normalize URL
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    if (url.charAt(url.length - 1) !== '/') url = url + '/';

    let response = fetch(url);
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    let doc = response.html();

    // Basic info
    let name = doc.select("header[itemtype='https://schema.org/Book'] h1[itemprop='name']").text();
    let cover = doc.select("header[itemtype='https://schema.org/Book'] img.object-cover").attr("src");
    let author = doc.select("header[itemtype='https://schema.org/Book'] [itemprop='author'] [itemprop='name']").text();
    let description = doc.select("article[itemprop='description'] [itemprop='description']").text();

    // Status
    let statusText = doc.select("header[itemtype='https://schema.org/Book']").text();
    let ongoing = true;
    if (statusText.indexOf("hoàn thành") >= 0 || statusText.indexOf("Hoàn thành") >= 0 ||
        statusText.indexOf("Đã hoàn thành") >= 0) {
        ongoing = false;
    }

    // Genres
    let genres = [];
    let genresText = [];
    doc.select("header[itemtype='https://schema.org/Book'] a[itemprop='genre']").forEach(function(e) {
        let title = e.text();
        genresText.push(title);
        genres.push({
            title: title,
            input: e.attr("href"),
            script: "gen.js"
        });
    });

    // Suggests — "Cùng tác giả"
    let suggests = [];
    if (author) {
        suggests.push({
            title: "Tìm truyện cùng tác giả: " + author,
            input: author,
            script: "search.js"
        });
    }

    // Detail info
    let detail = "Tác giả: " + author + "<br>";
    detail += "Trạng thái: " + (ongoing ? "Đang ra" : "Hoàn thành") + "<br>";
    detail += "Thể loại: " + genresText.join(", ");

    return Response.success({
        name: name,
        cover: cover,
        host: BASE_URL,
        author: author,
        description: genresText.join(", ") + (description ? "<br>" + description : ""),
        detail: detail,
        ongoing: ongoing,
        genres: genres,
        suggests: suggests
    });
}
