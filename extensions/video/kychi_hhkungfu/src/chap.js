load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    var response = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    });
    
    if (!response.ok) return Response.success([]);
    var doc = response.html();
    
    var servers = [];
    var serverBlocks = doc.select(".halim-server");
    
    // Find current episode name to match across servers
    var currentEp = "";
    var activeItem = doc.select(".halim-episode li a.active").first();
    if (activeItem) {
        currentEp = activeItem.attr("data-ep");
    }
    
    serverBlocks.forEach(function(block) {
        var serverName = cleanText(block.select(".halim-server-name").text()).replace(/[:#]/g, "").trim();
        var episodeLink = currentEp ? block.select("a[data-ep='" + currentEp + "']").first() : block.select(".halim-episode a").first();
        
        if (episodeLink) {
            var postId = episodeLink.attr("data-post-id");
            var ep = episodeLink.attr("data-ep");
            var sv = episodeLink.attr("data-sv");
            
            // Perform AJAX immediately to get the RAW EMBED URL
            try {
                var ajaxResp = fetch(BASE_URL + "/wp-admin/admin-ajax.php", {
                    method: "POST",
                    headers: {
                        "Referer": url,
                        "X-Requested-With": "XMLHttpRequest",
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: "action=dox_ajax_player&post_id=" + postId + "&chapter_st=" + encodeURIComponent(ep) + "&sv=" + sv + "&type=pro"
                });

                if (ajaxResp.ok) {
                    var html = ajaxResp.text();
                    var embedMatch = html.match(/src="([^"]+)"/i);
                    if (embedMatch) {
                        var embedUrl = embedMatch[1].replace(/&amp;/g, "&");
                        
                        // Ensure absolute URL
                        if (embedUrl.indexOf("/") === 0 && embedUrl.indexOf("//") !== 0) {
                            embedUrl = BASE_URL + embedUrl;
                        } else if (embedUrl.indexOf("//") === 0) {
                            embedUrl = "https:" + embedUrl;
                        }

                        servers.push({
                            title: serverName,
                            data: JSON.stringify({
                                embedUrl: embedUrl,
                                url: url
                            })
                        });
                    }
                }
            } catch (e) {}
        }
    });
    
    return Response.success(servers);
}

