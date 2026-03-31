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
        let data = [];
        
        // Extract chapters from the chapter list
        let el = doc.select(".list-chapter .row");
        
        for (let i = 0; i < el.size(); i++) {
            let e = el.get(i);
            
            // Get chapter link and title
            let chapterLink = e.select(".chapter a").first();
            
            if (chapterLink) {
                let chapterName = chapterLink.text().trim();
                let chapterUrl = chapterLink.attr("href");
                
                // Get update time if available
                let timeElement = e.select(".col-xs-4").first();
                let updateTime = timeElement ? timeElement.text().trim() : "";
                
                if (updateTime) {
                    chapterName += " - " + updateTime;
                }
                
                data.push({
                    name: chapterName,
                    url: chapterUrl,
                    host: BASE_URL
                });
            }
        }
        
        // Reverse the array to have chapters in ascending order
        data.reverse();
        
        return Response.success(data);
    }

    return null;
}