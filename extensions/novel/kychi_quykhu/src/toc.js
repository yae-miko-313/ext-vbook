load('config.js');

/**
 * Main: Get list of chapters/sections
 * Parses #chapter-list-content div (may be hidden via CSS but contains actual chapters)
 */
function execute(url) {
    url = String(url || '').trim();
    if (!url) return Response.error('URL truyện không hợp lệ.');

    var data = [];
    var doc = loadDocument(url, 15000, '#chapter-list-content');
    if (!doc) return Response.error('Không tải được nội dung trang: ' + url);

    var seen = {};
    var contentDiv = doc.select('#chapter-list-content').first();
    
    if (contentDiv) {
        var allLinks = contentDiv.select('a[href*="/"]');
        var linkCount = getSize(allLinks);
        
        for (var i = 0; i < linkCount; i++) {
            var link = getElement(allLinks, i);
            if (!link) continue;
            
            var href = link.attr('href') || '';
            var title = link.attr('title') || link.text().trim() || '';
            
            // Skip overlay links (empty title and short)
            if (!title || title.length < 2) continue;
            
            var chapterUrl = normalizeUrl(href);
            if (!chapterUrl || seen[chapterUrl]) continue;
            if (chapterUrl.indexOf(BASE_URL) !== 0) continue;
            
            seen[chapterUrl] = true;
            data.push({
                name: title,
                url: chapterUrl,
                host: BASE_URL
            });
        }
    }

    // Fallback: Direct chapter URL pattern search
    if (data.length === 0) {
        var fallbackLinks = doc.select('a[href*="/chuong-"], a[href*="/chapter-"]');
        var fbCount = getSize(fallbackLinks);
        for (var j = 0; j < fbCount; j++) {
            var fbLink = getElement(fallbackLinks, j);
            if (!fbLink) continue;
            var fbHref = fbLink.attr('href') || '';
            var fbUrl = normalizeUrl(fbHref);
            if (!fbUrl || seen[fbUrl]) continue;
            
            seen[fbUrl] = true;
            data.push({
                name: fbLink.attr('title') || fbLink.text().trim() || fbUrl.split('/').pop().replace(/-/g, ' '),
                url: fbUrl,
                host: BASE_URL
            });
        }
    }

    if (data.length === 0) {
        return Response.error('Không tìm được danh sách chương.');
    }

    return Response.success(data);
}

