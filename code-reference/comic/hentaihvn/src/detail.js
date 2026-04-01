load('config.js');
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL)
    let response = fetch(url, {
        headers: {
            "referer": BASE_URL
        }
    });
    
    if (response.ok) {
        let doc = response.html();
        
        // Extract title
        let title = doc.select("h1.title-detail").first().text();
        
        // Extract cover image
        let cover = doc.select(".detail-info .col-image img").first().attr("src");
        
        // Extract author
        let authorElement = doc.select(".list-info .author .col-xs-8").first();
        let author = authorElement ? authorElement.text() : "Đang cập nhật";
        
        // Extract status (ongoing/completed)
        let statusElement = doc.select(".list-info .status .col-xs-8").first();
        let statusText = statusElement ? statusElement.text() : "";
        let ongoing = !statusText.includes("Đã hoàn thành");
        
        // Extract genres
        let genres = [];
        doc.select(".list-info .kind .col-xs-8 a").forEach(e => {
            genres.push({
                title: e.text(),
                input: BASE_URL + e.attr("href"),
                script: "gen.js"
            });
        });
        
        // Extract description/summary - get view count and rating info
        let description = "";
        let viewElement = doc.select(".list-info li:has(.fa-eye) .col-xs-8").first();
        if (viewElement) {
            description += "Lượt xem: " + viewElement.text() + "<br>";
        }
        
        let ratingElement = doc.select(".mrt5.mrb10").first();
        if (ratingElement) {
            description += ratingElement.text() + "<br>";
        }
        
        // Add update time if available
        let updateTimeElement = doc.select("time.small").first();
        if (updateTimeElement) {
            description += updateTimeElement.text();
        }

        return Response.success({
            name: title,
            cover: cover,
            author: author,
            description: description,
            host: BASE_URL,
            genres: genres,
            ongoing: ongoing,
            nsfw: true
        });
    }

    return null;
}