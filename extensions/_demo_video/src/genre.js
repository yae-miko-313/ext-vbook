function execute() {
    // Return list of genres as objects with links
    let response = fetch(BASE_URL + "/the-loai");
    if (!response.ok) return Response.error("Cannot load genres");
    
    let doc = response.html();
    const genres = [];
    
    doc.select(".genre-list a, .list-genres a").forEach(function(el) {
        let title = el.text() + "";
        let href = el.attr("href") + "";
        if (title && href) {
            genres.push({
                title: title,
                input: BASE_URL + href,
                script: "gen.js"
            });
        }
    });
    
    return Response.success(genres);
}