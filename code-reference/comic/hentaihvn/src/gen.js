load('config.js');
function execute(url, page) {
    if (!page) page = '1';
    let response = fetch(url + "?page=" + page);

    if (response.ok) {
        let doc = response.html();

        // Check for next page in pagination
        let nextPage = null;
        let nextButton = doc.select(".pagination .page-item .page-link[rel=next]").first();
        if (nextButton) {
            let currentPage = parseInt(page);
            nextPage = (currentPage + 1).toString();
        }

        // Select comic items from the HTML structure
        const el = doc.select(".items .item");

        const data = [];
        for (let i = 0; i < el.size(); i++) {
            let e = el.get(i);
            
            // Get the title and link from figcaption h3 a
            let titleElement = e.select("figcaption h3 a").first();
            let imageElement = e.select("figure .image a img").first();
            
            if (titleElement && imageElement) {
                let title = titleElement.text();
                let link = titleElement.attr("href");
                let cover = imageElement.attr("data-src") || imageElement.attr("src");
                
                // Get description from the title attribute or use title
                let description = imageElement.attr("alt") || title;
                
                data.push({
                    name: title,
                    link: link,
                    cover: cover,
                    description: description,
                    host: BASE_URL
                });
            }
        }

        return Response.success(data, nextPage)
    }
    return null;
}