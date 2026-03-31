load("config.js");

function execute(url) {
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html();
        let chapters = [];

        // Get all chapter lists from both sections
        let chapterSections = doc.select("#newlist");
        
        chapterSections.forEach(section => {
            let chapterLinks = section.select("ul li a");
            
            chapterLinks.forEach(link => {
                let chapterTitle = link.text();
                let chapterUrl = link.attr("href");
                
                // Make sure URL is absolute
                if (chapterUrl && !chapterUrl.startsWith("http")) {
                    chapterUrl = BASE_URL + chapterUrl;
                }
                
                // Avoid duplicates by checking if chapter already exists
                let isDuplicate = chapters.some(chapter => 
                    chapter.url === chapterUrl || chapter.name === chapterTitle
                );
                
                if (!isDuplicate && chapterTitle && chapterUrl) {
                    chapters.push({
                        name: chapterTitle,
                        url: chapterUrl,
                        host: BASE_URL,
                    });
                }
            });
        });

        // Sort chapters by chapter number if possible
        chapters.sort((a, b) => {
            // Extract chapter numbers from titles
            let aMatch = a.name.match(/第(\d+)章/);
            let bMatch = b.name.match(/第(\d+)章/);
            
            if (aMatch && bMatch) {
                return parseInt(aMatch[1]) - parseInt(bMatch[1]);
            }
            
            // If can't extract numbers, keep original order
            return 0;
        });

        return Response.success(chapters);
    }
    
    return Response.error("Không thể tải trang chapter list");
}