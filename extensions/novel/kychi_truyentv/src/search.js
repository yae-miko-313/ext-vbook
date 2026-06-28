load('config.js');

function toSlug(str) {
    if (!str) return '';
    var slug = String(str).toLowerCase();
    
    var from = "\u00e0\u00e1\u1ea1\u1ea3\u00e3\u00e2\u1ea7\u1ea5\u1ead\u1ea9\u1eab\u0103\u1eb1\u1eaf\u1eb7\u1eb3\u1eb5\u00e8\u00e9\u1eb9\u1ebb\u1ebd\u00ea\u1ec1\u1ebf\u1ec7\u1ec3\u1ec5\u00ec\u00ed\u1ecb\u1ec9\u0129\u00f2\u00f3\u1ecd\u1ecf\u00f5\u00f4\u1ed3\u1ed1\u1ed9\u1ed5\u1ed7\u01a1\u1edd\u1edb\u1ee3\u1edf\u1ee1\u00f9\u00fa\u1ee5\u1ee7\u0169\u01b0\u1eeb\u1ee9\u1ef1\u1eed\u1eef\u1ef3\u00fd\u1ef5\u1ef7\u1ef9\u0111";
    var to = "";
    for (var i = 0; i < 17; i++) to += "a";
    for (var i = 0; i < 11; i++) to += "e";
    for (var i = 0; i < 5; i++) to += "i";
    for (var i = 0; i < 17; i++) to += "o";
    for (var i = 0; i < 11; i++) to += "u";
    for (var i = 0; i < 5; i++) to += "y";
    to += "d";
    
    for (var i = 0; i < from.length; i++) {
        slug = slug.split(from.charAt(i)).join(to.charAt(i));
    }
    
    return slug.replace(/[^a-z0-9\- ]/g, '')
               .replace(/\s+/g, '-')
               .replace(/\-+/g, '-')
               .replace(/^\-+|\-+$/g, '');
}

function execute(query, page) {
    var keyword = query;
    if (typeof query === 'object' && query !== null && query.length !== undefined) {
        keyword = query[0];
        page = query[1];
    }
    
    var key = toSlug(keyword);
    page = page !== undefined && page !== null ? String(page) : '1';
    
    var fetchUrl = BASE_URL + '/tim-kiem?tukhoa=' + encodeURIComponent(key) + '&page=' + page;
    var response = fetchPage(fetchUrl);
    
    if (response.ok) {
        var doc = response.html();
        var data = [];
        
        var items = doc.select('.info-mobile-card');
        
        for (var i = 0; i < items.size(); i++) {
            var e = items.get(i);
            var nameEl = e.select('.name a').first();
            if (nameEl) {
                var name = cleanText(nameEl.text());
                var link = nameEl.attr('href');
                var coverEl = e.select('img').first();
                var cover = coverEl ? (coverEl.attr('src') || coverEl.attr('data-src') || coverEl.attr('data-image') || '') : '';
                var authorEl = e.select('.author').first();
                var author = authorEl ? cleanText(authorEl.text()) : '';
                
                data.push({
                    name: name,
                    title: name,
                    link: normalizeUrl(link),
                    cover: cover,
                    description: author,
                    host: BASE_URL
                });
            }
        }
        
        var next = "";
        if (data.length > 0) {
            var nextEl = doc.select('.pagination .nav-next a, .custom-pagination-list .nav-next a').first();
            if (nextEl) {
                var href = nextEl.attr('href');
                var match = href && href.match(/page=(\d+)/);
                next = match ? match[1] : String(parseInt(page, 10) + 1);
            }
        }
        
        return Response.success(data, next);
    }
    return Response.success([]);
}
