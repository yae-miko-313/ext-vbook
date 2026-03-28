load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    if (url.charAt(url.length - 1) !== '/') url = url + '/';
    
    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();
    
    // Extract title with multiple selectors
    var nameEl = doc.select("h1, .novel-title, .truyen-title, [class*='title'] h1, .post-title").first();
    var name = nameEl ? nameEl.text().trim() : "";
    if (!name) {
        var titleEl = doc.select("title");
        var titleText = titleEl.text();
        name = titleText.split('|')[0].trim();
    }
    
    // Extract cover image
    var cover = doc.select("img[src*='cover'], img.cover, .cover-image img").attr("src") || 
                doc.select(".post-image img, .story-image img, [class*='cover'] img").attr("src") || 
                doc.select("img").first().attr("src") || "";
    
    // Extract author with multiple fallbacks
    var author = doc.select(".author, .tac-gia, .by-author, [class*='author']").text().trim();
    if (!author) {
        var authorLink = doc.select("a[href*='tac-gia'], a[href*='author']").first();
        if (authorLink) {
            author = authorLink.text().trim();
        }
    }
    
    // Extract description - try multiple locations with concrete stop
    var description = "";
    
    // Try specific containers first
    var descContainer = doc.select(".description, .synopsis, .noi-dung, .post-content, .story-intro, [class*='description']").first();
    if (descContainer) {
        description = descContainer.text().trim();
    }
    
    // If empty, try paragraph extraction
    if (!description) {
        var paragraphs = doc.select("p, article");
        if (paragraphs.size() > 0) {
            description = paragraphs.first().text().trim();
        }
    }
    
    // Limit description length
    if (description && description.length > 500) {
        description = description.substring(0, 500);
    }
    
    // Better status detection - look in specific areas first
    var ongoing = true;
    
    // Check in status field/element
    var statusEl = doc.select(".status, .trang-thai, [class*='status']").text().trim();
    if (statusEl.indexOf("hoàn thành") >= 0 || statusEl.indexOf("Hoàn thành") >= 0 || 
        statusEl.indexOf("full") >= 0 || statusEl.indexOf("Full") >= 0) {
        ongoing = false;
    }
    
    // Check in header/detail area
    if (ongoing) {
        var headerText = doc.select("header, .post-header, .story-header, h1, h2").text();
        if (headerText.indexOf("hoàn thành") >= 0 || headerText.indexOf("Hoàn thành") >= 0 ||
            headerText.indexOf("đã hoàn") >= 0 || headerText.indexOf("Đã hoàn") >= 0) {
            ongoing = false;
        }
    }
    
    // Last resort: search in full text but limit to certain keywords
    if (ongoing) {
        var bodyText = doc.select("body").text();
        var completed = bodyText.match(/Trạng thái:\s*Hoàn thành|Trạng thái:\s*Đã Hoàn thành|Status:\s*Completed|trang-thai:\s*hoan-thanh/i);
        if (completed) {
            ongoing = false;
        }
    }
    
    // Extract genres
    var genres = [];
    var genresText = [];
    doc.select("a[href*='/truyen-'], a[href*='genre'], a[href*='the-loai'], a[class*='tag'], a[class*='genre']").forEach(function(a) {
        var genre = a.text().trim();
        var genreLink = a.attr("href") || "";
        if (genre && genreLink && genre.length > 1 && genre.length < 50 && genreLink.indexOf("/") >= 0 && genreLink.indexOf("tac-gia") < 0) {
            // Avoid duplicates
            if (genresText.indexOf(genre) < 0) {
                genresText.push(genre);
                genres.push({
                    title: genre,
                    input: genreLink,
                    script: "gen.js"
                });
            }
        }
    });
    
    // Build detail string
    var detail = "Tác giả: " + author + "<br>";
    detail += "Trạng thái: " + (ongoing ? "Đang ra" : "Hoàn thành") + "<br>";
    if (genresText.length > 0) {
        detail += "Thể loại: " + genresText.join(", ");
    }
    
    // Suggestions - "Cùng tác giả"
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
        description: description || (genresText.length > 0 ? genresText.join(", ") : ""),
        detail: detail,
        ongoing: ongoing,
        genres: genres.slice(0, 5),
        suggests: suggests
    });
}
