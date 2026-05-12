load('config.js');

function execute(url) {
    var watchUrl = url.replace('/phim/', '/xem-phim/');
    
    var response = fetch(watchUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    });

    if (response.ok) {
        var doc = response.html();
        var data = [];
        
        // Find the "Danh sách tập" section
        var episodes = [];
        var sections = doc.select("section.SeasonBx");
        sections.forEach(function(section) {
            var title = section.select(".Title").text().trim();
            if (title.toLowerCase().indexOf("tập") !== -1) {
                section.select(".halim-list-eps li a").forEach(function(el) {
                    episodes.push({
                        name: el.text().trim(),
                        url: normalizeUrl(el.attr("href"))
                    });
                });
            }
        });

        if (episodes.length === 0) {
            // If it's a single movie, look for the "Full" link or just use the current page
            var fullLink = doc.select(".halim-list-eps li a").first();
            if (fullLink.length > 0) {
                episodes.push({
                    name: fullLink.text().trim(),
                    url: normalizeUrl(fullLink.attr("href"))
                });
            } else {
                episodes.push({
                    name: "Full",
                    url: watchUrl
                });
            }
        }

        return Response.success(episodes);
    }

    return null;
}
