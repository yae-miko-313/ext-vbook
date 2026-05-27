load('config.js');
function execute(input) {
    var key = input[0];
    var page = input[1] || '1';
    var fetchUrl = BASE_URL + '/tim-kiem?tukhoa=' + encodeURIComponent(key) + '&page=' + page;
    var response = fetchPage(fetchUrl);
    if (response.ok) {
        var doc = response.html();
        var data = [];
        
        var items = doc.select('.category-list-container .info-mobile-card');
        if (items.size() === 0) items = doc.select('.info-mobile-card');
        if (items.size() === 0) items = doc.select('.list-truyen .row'); // Fallback 1
        if (items.size() === 0) items = doc.select('.book-item'); // Fallback 2
        
        for (var i = 0; i < items.size(); i++) {
            var e = items.get(i);
            if (e) {
                var nameEl = e.select('.info-title .name a').first();
                if (!nameEl) nameEl = e.select('.truyen-title a').first();
                if (!nameEl) nameEl = e.select('a.name').first();
                if (!nameEl) {
                    var anchors = e.select('a');
                    for (var k = 0; k < anchors.size(); k++) {
                        var anchor = anchors.get(k);
                        if (anchor && cleanText(anchor.text())) {
                            nameEl = anchor;
                            break;
                        }
                    }
                }
                if (!nameEl) nameEl = e.select('a').first();
                
                var name = nameEl ? cleanText(nameEl.text()) : '';
                if (!name && nameEl) name = cleanText(nameEl.attr('title'));
                var link = nameEl ? nameEl.attr('href') : '';
                
                var coverEl = e.select('.info-image img').first();
                if (!coverEl) coverEl = e.select('[data-image]').first();
                if (!coverEl) coverEl = e.select('img').first();
                
                var cover = "";
                if (coverEl) {
                    cover = coverEl.attr('src') || coverEl.attr('data-image') || coverEl.attr('data-src') || "";
                }
                
                var authorEl = e.select('.info-title .author').first();
                if (!authorEl) authorEl = e.select('.author').first();
                var author = authorEl ? cleanText(authorEl.text()) : '';
                
                if (name && link) {
                    data.push({
                        name: name,
                        title: name, // Return both for maximum UI compatibility
                        link: normalizeUrl(link),
                        cover: cover,
                        description: author,
                        host: BASE_URL
                    });
                }
            }
        }
        
        var next = "";
        if (data.length > 0) {
            var nextEl = doc.select('.custom-pagination-list .nav-next a').first();
            if (!nextEl) nextEl = doc.select('.pagination .nav-next a').first();
            if (!nextEl) nextEl = doc.select('.pagination li.active + li a').first();
            if (!nextEl) nextEl = doc.select('.pagination a:contains(Tiếp)').first();
            if (!nextEl) nextEl = doc.select('.pagination a:contains(Next)').first();
            
            if (nextEl) {
                var href = nextEl.attr('href');
                if (href) {
                    var match = href.match(/page=(\d+)/);
                    if (match) {
                        next = match[1];
                    } else {
                        next = String(parseInt(page, 10) + 1);
                    }
                } else {
                    next = String(parseInt(page, 10) + 1);
                }
            }
        }
        
        return Response.success(data, next);
    }
    return Response.success([]);
}
