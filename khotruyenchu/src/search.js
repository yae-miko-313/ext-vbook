load('config.js');
load('utils.js');

function execute(key, page) {
    if (!page) page = '1';
    
    let response = fetch(BASE_URL + "/", {
        method: "GET",
        queries: {
            s: key
        }
    });

    if (response.ok) {
        let doc = response.html();
        
        let entryTitle = doc.select("h1, .entry-title").first();
        let entryContent = doc.select(".entry-content").first();
        if (entryTitle && entryContent) {
            // We are on a detail page
            let name = entryTitle.text().replace("Bộ truyện", "").trim();
            let link = response.url;
            let coverEl = doc.select(".truyen-cover img, .hs-thumb img").first();
            let cover = coverEl ? (coverEl.attr("data-src") || coverEl.attr("src")) : "";
            return Response.success([{
                name: name,
                link: link,
                cover: cover,
                host: BASE_URL
            }]);
        }

        let novelList = parseNovelList(doc);
        
        return Response.success(novelList);
    }
    return null;
}
