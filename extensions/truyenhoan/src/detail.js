load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    if (url.charAt(url.length - 1) !== '/') url = url + '/';
    
    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();
    
    var nameEl = doc.select("h1, .novel-title, .truyen-title").first();
    var name = nameEl ? nameEl.text().trim() : "";
    if (!name) {
        var titleEl = doc.select("title");
        var titleText = titleEl.text();
        name = titleText.split('|')[0].trim();
    }
    
    var cover = doc.select("img[src*='cover'], img.cover, .cover-image img").attr("src") || 
                doc.select("img").first().attr("src") || "";
    
    var author = doc.select(".author, .tac-gia, .by-author, [class*='author']").text().trim();
    if (!author) {
        var authorLink = doc.select("a[href*='tac-gia']");
        if (authorLink && authorLink.text()) {
            author = authorLink.text().trim();
        }
    }
    
    var description = doc.select(".description, .synopsis, .noi-dung, [class*='description']").text().trim();
    if (!description) {
        var descEl = doc.select("p, article").first();
        if (descEl) description = descEl.text().trim().substring(0, 500);
    }
    
    var statusText = doc.text();
    var ongoing = true;
    if (statusText.indexOf("hoàn thành") >= 0 || statusText.indexOf("Hoàn thành") >= 0 ||
        statusText.indexOf("Đã hoàn thành") >= 0 || statusText.indexOf("Full") >= 0) {
        ongoing = false;
    }
    
    var genres = [];
    var genresText = [];
    doc.select("a[href*='/truyen-'], a[href*='genre'], a[href*='the-loai']").forEach(function(a) {
        var genre = a.text().trim();
        var genreLink = a.attr("href") || "";
        if (genre && genreLink && genre.length > 1 && genre.length < 50 && genreLink.indexOf("/") >= 0) {
            genresText.push(genre);
            genres.push({
                title: genre,
                input: genreLink,
                script: "gen.js"
            });
        }
    });
    
    var detail = "";
    if (author) detail += "Tác giả: " + author + "<br>";
    detail += "Trạng thái: " + (ongoing ? "Đang ra" : "Hoàn thành") + "<br>";
    if (genresText.length > 0) detail += "Thể loại: " + genresText.join(", ");
    
    var suggests = [];
    if (author) {
        suggests.push({
            title: "Tìm truyện cùng tác giả: " + author,
            input: author,
            script: "search.js"
        });
    }
    
    return Response.success({
        name: name,
        cover: cover,
        host: BASE_URL,
        author: author,
        description: (genresText.length > 0 ? genresText.join(", ") + "<br>" : "") + (description ? description : ""),
        detail: detail,
        ongoing: ongoing,
        genres: genres.slice(0, 5),
        suggests: suggests
    });
}
