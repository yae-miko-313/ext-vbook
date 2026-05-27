load('config.js');
function execute(url) {
    url = normalizeUrl(url);
    var response = fetchPage(url);
    if (!response.ok) {
        return Response.error('Không tải được thông tin chi tiết truyện');
    }
    
    var doc = response.html();
    
    var name = '';
    var cover = '';
    var author = 'Đang cập nhật';
    var authorUrl = '';
    var description = '';
    var statusText = 'Đang ra';
    
    // Attempt to extract details from JSON-LD Schema first (Highly stable and clean)
    var scriptEl = doc.select('script[type="application/ld+json"]').first();
    if (scriptEl) {
        try {
            var jsonLd = JSON.parse(scriptEl.html());
            if (jsonLd) {
                if (jsonLd.name) name = cleanText(jsonLd.name);
                if (jsonLd.image) cover = jsonLd.image;
                if (jsonLd.description) description = cleanDescription(jsonLd.description);
                if (jsonLd.author) {
                    if (jsonLd.author.name) author = cleanText(jsonLd.author.name);
                    if (jsonLd.author.url) authorUrl = jsonLd.author.url;
                }
                if (jsonLd.identifier && jsonLd.identifier.value) {
                    statusText = cleanText(jsonLd.identifier.value);
                }
            }
        } catch (err) {
            // Fallback to DOM if JSON parsing fails
        }
    }
    
    // DOM Fallbacks for all fields in case JSON-LD was incomplete
    if (!name) {
        var nameEl = doc.select('h3.title[itemprop="name"]').first();
        if (!nameEl) nameEl = doc.select('h3#comic_name').first();
        if (!nameEl) nameEl = doc.select('h3.title').first();
        if (!nameEl) nameEl = doc.select('h1').first();
        name = nameEl ? cleanText(nameEl.text()) : '';
    }
    
    if (!cover) {
        var coverEl = doc.select('.books .book img').first();
        if (!coverEl) coverEl = doc.select('img[itemprop="image"]').first();
        if (!coverEl) coverEl = doc.select('.book img').first();
        cover = coverEl ? coverEl.attr('src') : '';
    }
    
    if (author === 'Đang cập nhật' || !author) {
        var authorEl = doc.select('.info .author a').first();
        if (!authorEl) authorEl = doc.select('[itemprop="author"]').first();
        if (!authorEl) authorEl = doc.select('.author .item-value').first();
        if (!authorEl) authorEl = doc.select('a[href*="/tac-gia/"]').first();
        author = authorEl ? cleanText(authorEl.text()) : 'Đang cập nhật';
        if (!authorUrl && authorEl) authorUrl = authorEl.attr('href');
    }
    if (!authorUrl) {
        var authorUrlEl = doc.select('.info .author a').first();
        if (!authorUrlEl) authorUrlEl = doc.select('[itemprop="author"]').first();
        if (!authorUrlEl) authorUrlEl = doc.select('.author .item-value').first();
        if (!authorUrlEl) authorUrlEl = doc.select('a[href*="/tac-gia/"]').first();
        if (authorUrlEl) authorUrl = authorUrlEl.attr('href');
    }
    
    if (!description) {
        var descEl = doc.select('section.limit-desc').first();
        if (!descEl) descEl = doc.select('.limit-desc').first();
        if (!descEl) descEl = doc.select('.desc-text').first();
        if (!descEl) descEl = doc.select('[itemprop="description"]').first();
        if (!descEl) descEl = doc.select('.desc-text-full').first();
        if (!descEl) descEl = doc.select('.desc-content').first();
        if (!descEl) descEl = doc.select('.desc').first();
        if (!descEl) descEl = doc.select('#ct-p').first();
        description = descEl ? cleanDescription(descEl.html()) : '';
    }
    
    // Ensure description line-breaks are converted nicely for display
    if (description) {
        description = description.replace(/\r?\n/g, '<br>');
    }
    
    // Genre list extraction (DOM is required for exact genre URLs)
    var genres = [];
    var genreEls = doc.select('.info .genres .item-value');
    if (genreEls.size() === 0) genreEls = doc.select('[itemprop="genre"]');
    if (genreEls.size() === 0) genreEls = doc.select('.genres a');
    
    var firstGenreUrl = '';
    for (var i = 0; i < genreEls.size(); i++) {
        var g = genreEls.get(i);
        if (g) {
            var gText = g.text();
            var gHref = g.attr('href');
            if (gText && gHref) {
                var normalizedHref = normalizeUrl(gHref);
                genres.push({
                    title: cleanText(gText),
                    input: normalizedHref,
                    script: 'gen.js'
                });
                if (!firstGenreUrl) {
                    firstGenreUrl = normalizedHref;
                }
            }
        }
    }
    
    // Status & ongoing calculation
    if (!statusText || statusText === 'Đang ra') {
        var statusEl = doc.select('.info .text-success.item-value, .info .text-info.item-value, .info .item-value').first();
        if (statusEl) {
            statusText = statusEl.text().trim();
        } else {
            var infoBlocks = doc.select('.info div, .info p, .info li');
            for (var idx = 0; idx < infoBlocks.size(); idx++) {
                var block = infoBlocks.get(idx);
                if (block) {
                    var text = block.text();
                    if (text.indexOf('Trạng thái:') >= 0) {
                        statusText = text.replace('Trạng thái:', '').trim();
                        break;
                    }
                }
            }
        }
    }
    
    statusText = cleanText(statusText || 'Đang ra');
    var lowerStatus = statusText.toLowerCase();
    var ongoing = lowerStatus.indexOf('hoàn thành') === -1 &&
                  lowerStatus.indexOf('đã hoàn') === -1 &&
                  lowerStatus.indexOf('full') === -1 &&
                  lowerStatus.indexOf('complete') === -1;
    
    // Suggests calculation
    var suggests = [];
    if (authorUrl) {
        suggests.push({
            title: "Truyện cùng tác giả",
            input: normalizeUrl(authorUrl),
            script: "gen.js"
        });
    }
    if (firstGenreUrl) {
        suggests.push({
            title: "Truyện cùng thể loại",
            input: firstGenreUrl,
            script: "gen.js"
        });
    }
    
    // Build detail parts for rich metadata display
    var detailParts = [];
    detailParts.push('<p><strong>Tác giả:</strong> ' + author + '</p>');
    detailParts.push('<p><strong>Trạng thái:</strong> ' + (ongoing ? 'Đang ra' : 'Hoàn thành') + '</p>');
    if (genres.length > 0) {
        var genreTitles = [];
        for (var j = 0; j < genres.length; j++) {
            genreTitles.push(genres[j].title);
        }
        detailParts.push('<p><strong>Thể loại:</strong> ' + genreTitles.join(', ') + '</p>');
    }
    var detail = detailParts.join('<br>');
    
    var commentConfig = {
        title: 'Bình luận',
        input: url,
        script: 'comment.js'
    };
    
    return Response.success({
        name: name,
        cover: cover,
        author: author,
        description: description,
        genres: genres,
        detail: detail,
        ongoing: ongoing,
        host: BASE_URL,
        suggests: suggests,
        comment: commentConfig,
        comments: commentConfig
    });
}
