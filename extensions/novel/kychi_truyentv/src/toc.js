load('config.js');
function execute(url) {
    url = normalizeUrl(url);
    var response = fetchPage(url);
    if (!response.ok) {
        return Response.error('Không tải được danh sách chương');
    }
    
    var doc = response.html();
    var chapters = [];
    var seen = {};
    
    // Extensively resilient selectors strictly targeting the core TOC containers
    var elements = doc.select('#mobile-list-chapter a.chapter-link');
    if (elements.size() === 0) elements = doc.select('#mobile-list-chapter a');
    if (elements.size() === 0) elements = doc.select('#list-chapter .row a');
    if (elements.size() === 0) elements = doc.select('#list-chapter .list-chapter li a');
    if (elements.size() === 0) elements = doc.select('#list-chapter li a');
    if (elements.size() === 0) elements = doc.select('#list-chapter a');
    
    for (var i = 0; i < elements.size(); i++) {
        var e = elements.get(i);
        if (e) {
            var href = e.attr('href');
            if (href) {
                var chapterUrl = normalizeUrl(href);
                if (chapterUrl && !seen[chapterUrl]) {
                    // Filter standard utility/menu links (author, genres, etc.) and pagination links
                    var lowerUrl = chapterUrl.toLowerCase();
                    if (lowerUrl.indexOf('/tac-gia/') >= 0 || 
                        lowerUrl.indexOf('/the-loai/') >= 0 ||
                        lowerUrl.indexOf('/danh-sach/') >= 0 ||
                        lowerUrl.indexOf('/dang-nhap') >= 0 ||
                        lowerUrl.indexOf('/dang-ky') >= 0 ||
                        lowerUrl.indexOf('page=') >= 0) {
                        continue;
                    }
                    
                    seen[chapterUrl] = true;
                    
                    // Clean chapter name extraction from inner wrapper
                    var nameEl = e.select('.comic-info-chapter-name-content').first();
                    if (!nameEl) nameEl = e.select('.comic-info-chapter-name').first();
                    
                    var chapterName = nameEl ? cleanText(nameEl.text()) : '';
                    if (!chapterName) chapterName = e.text() ? cleanText(e.text()) : '';
                    if (!chapterName) {
                        var titleAttr = e.attr('title');
                        if (titleAttr) chapterName = cleanText(titleAttr);
                    }
                    if (!chapterName) {
                        chapterName = "Chương " + (chapters.length + 1);
                    }
                    
                    // Strip the #{number}. prefix from chapter names (e.g. "#1. Giới thiệu" -> "Giới thiệu")
                    chapterName = chapterName.replace(/^#\d+\.\s*/, '');
                    
                    chapters.push({
                        name: chapterName,
                        url: chapterUrl,
                        host: BASE_URL
                    });
                }
            }
        }
    }
    
    if (chapters.length === 0) {
        return Response.error('Không tìm thấy danh sách chương nào');
    }
    
    // Detect if the chapter list is in descending order and reverse it to be ascending
    if (chapters.length > 1) {
        var firstNum = -1;
        var lastNum = -1;
        
        // Find first chapter containing a valid number
        for (var f = 0; f < chapters.length; f++) {
            var fn = extractChapterNumber(chapters[f]);
            if (fn !== -1) {
                firstNum = fn;
                break;
            }
        }
        
        // Find last chapter containing a valid number
        for (var l = chapters.length - 1; l >= 0; l--) {
            var ln = extractChapterNumber(chapters[l]);
            if (ln !== -1) {
                lastNum = ln;
                break;
            }
        }
        
        if (firstNum !== -1 && lastNum !== -1 && firstNum > lastNum) {
            chapters.reverse();
        }
    }
    
    return Response.success(chapters);
}

function extractChapterNumber(item) {
    var text = (item.name || '') + ' ' + (item.url || '');
    var m = text.match(/chuong[-\s]*(\d+)/i);
    if (!m) m = text.match(/chap[-\s]*(\d+)/i);
    if (!m) m = text.match(/\/chuong-(\d+)/i);
    if (!m) m = text.match(/(\d+)/);
    if (!m) return -1;
    return parseInt(m[1], 10);
}
