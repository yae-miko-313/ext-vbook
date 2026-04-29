load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    var response = fetchPage(url);
    if (!response.ok) return Response.error('HTTP Error: ' + response.status);

    var doc = response.html();
    var name = doc.select('h1.story-title').text().trim();
    if (!name) name = doc.select('meta[property="og:title"]').attr('content');
    
    var cover = doc.select('meta[property="og:image"]').attr('content');
    if (!cover) cover = doc.select('.book img').attr('src');

    var authorEl = doc.select('.info a[href*="/tac-gia/"]').first();
    var author = authorEl ? authorEl.text().trim() : 'Đang cập nhật';
    var authorUrl = authorEl ? authorEl.attr('href') : '';
    if (authorUrl) authorUrl = normalizeUrl(authorUrl);

    var description = doc.select('.desc-text').html();
    
    var statusText = 'Đang ra';
    var statusEl = doc.select('.info .label-success, .info .label-info, .info .label-warning').first();
    if (statusEl) {
        statusText = statusEl.text().trim();
    }
    
    var ongoing = true;
    var lowerStatus = statusText.toLowerCase();
    if (lowerStatus.indexOf('hoàn thành') >= 0 || lowerStatus.indexOf('đã hoàn') >= 0 || lowerStatus.indexOf('full') >= 0) {
        ongoing = false;
        statusText = 'Hoàn thành';
    } else if (lowerStatus.indexOf('đang ra') >= 0 || lowerStatus.indexOf('đang tiến hành') >= 0) {
        statusText = 'Đang ra';
    }

    var genreTexts = [];
    var genres = [];
    var firstGenreUrl = '';
    doc.select('.info a[itemprop="genre"]').forEach(function(e) {
        var title = e.text().trim();
        var href = e.attr('href');
        if (href) {
            href = normalizeUrl(href);
            genres.push({
                title: title,
                input: href,
                script: 'gen.js'
            });
            genreTexts.push(title);
            if (!firstGenreUrl) firstGenreUrl = href;
        }
    });

    var detail = '';
    detail += '<p><strong>Tác giả:</strong> ' + author + '</p>';
    detail += '<p><strong>Trạng thái:</strong> ' + statusText + '</p>';
    
    var chapterCountEl = doc.select('#totalChapter');
    if (chapterCountEl.size() > 0) {
        detail += '<p><strong>Số chương:</strong> ' + chapterCountEl.text().trim() + ' chương</p>';
    }
    if (genreTexts.length > 0) {
        detail += '<p><strong>Thể loại:</strong> ' + genreTexts.join(', ') + '</p>';
    }

    var suggests = [];
    if (authorUrl) {
        suggests.push({
            title: 'Truyện cùng tác giả',
            input: authorUrl,
            script: 'gen.js'
        });
    }
    
    // Stable suggest extracted from the page or default
    var relatedEl = doc.select('#truyen-slide .title-list h2 a').first();
    var suggestUrl = relatedEl ? relatedEl.attr('href') : '/danh-sach/truyen-full';
    suggests.push({
        title: 'Đề xuất',
        input: normalizeUrl(suggestUrl),
        script: 'gen.js'
    });

    return Response.success({
        name: name,
        cover: cover,
        author: author,
        description: description,
        detail: detail,
        ongoing: ongoing,
        genres: genres,
        suggests: suggests,
        host: BASE_URL
    });
}

function normalizeUrl(u) {
    if (!u) return '';
    if (u.indexOf('http') === 0 || u.indexOf('//') === 0) {
        u = String(u).replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
        if (u.indexOf('//') === 0) u = 'https:' + u;
    } else {
        if (u.indexOf('/') !== 0) u = '/' + u;
        u = BASE_URL + u;
    }
    return u;
}

