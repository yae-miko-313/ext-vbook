load('config.js');

function execute(url, page) {
    if (!page) page = 1;
    
    var fetchUrl = url;
    if (page > 1) {
        fetchUrl += (fetchUrl.indexOf('?') === -1 ? '?' : '&') + 'page=' + page;
    }

    var response = fetchPage(fetchUrl);
    if (!response.ok) return Response.success([]);

    var body = response.text();
    var nextData = extractNextData(body);
    
    var list = parseMovies(nextData);

    // 2. Fallback: Parse from DOM only if JSON returns nothing
    if (list.length === 0) {
        var doc = response.html();
        var items = doc.select('a[href^="/phim/"]');
        items.forEach(function (a) {
            var name = cleanMovieName(cleanText(a.select('h3, .title, span').first().text()) || cleanText(a.attr('title')));
            var cover = a.select('img').attr('src');
            var link = normalizeUrl(a.attr('href'));
            
            if (name && link && link.indexOf('/phim/') !== -1) {
                var exists = false;
                for (var i = 0; i < list.length; i++) {
                    if (list[i].link === link) {
                        exists = true;
                        break;
                    }
                }
                if (!exists) {
                    var tag = "";
                    var tagEl = a.select('.episode, .status, .badge, span.absolute, div.absolute, [class*="absolute"], [class*="badge"]').first();
                    if (tagEl) {
                        var rawTag = cleanText(tagEl.text());
                        if (rawTag && name && (rawTag === name || rawTag.indexOf(name) !== -1 || name.indexOf(rawTag) !== -1)) {
                            rawTag = "";
                        }
                        tag = cleanTag(rawTag);
                    }
                    list.push({
                        name: name,
                        link: link,
                        cover: normalizeUrl(cover),
                        tag: tag,
                        host: BASE_URL
                    });
                }
            }
        });
    }

    // Determine next page
    var nextPage = "";
    if (list.length > 0) {
        nextPage = (parseInt(page) + 1).toString();
    }

    return Response.success(list, nextPage);
}
