load('config.js');

load('suggest.js');

function execute(url) {
    url = normalizeUrl(url);
    var response = fetchPage(url);
    if (!response.ok) {
        if (typeof Response !== 'undefined' && Response.error) return Response.error('HTTP Error: ' + response.status);
        return null;
    }

    var rawHtml = response.text();
    var map = extractBeforeContentMap(rawHtml);
    var doc = response.html();

    var nameEl = doc.select('h2.card-title[itemprop="name"], h1.story-title').first();
    var name = nameEl ? cleanText(nameEl.text()) : '';
    if (!name) {
        name = cleanText(doc.select('meta[property="og:title"]').attr('content') || '');
    }

    var cover = doc.select('meta[property="og:image"]').attr('content') || '';
    if (!cover) {
        var coverEl = doc.select('.col-md-3 img.img-fluid, .card img, .book img').first();
        cover = coverEl ? (coverEl.attr('data-src') || coverEl.attr('src') || '') : '';
    }
    cover = normalizeUrl(cover);

    var descriptionEl = doc.select('.story-description .inner, .story-description [itemprop="description"]').first();
    var description = descriptionEl ? descriptionEl.html() : '';
    if (!description) {
        var fallbackDesc = doc.select('.story-description').first();
        description = fallbackDesc ? fallbackDesc.html() : '';
    }
    description = decodeObfuscatedSpan(description, map);

    var author = 'Đang cập nhật';
    var authorUrl = '';
    var authorEl = doc.select('a[href*="/tac-gia/"], a[href*="/nhom-dich/"]').first();
    if (authorEl) {
        author = cleanText(authorEl.text()) || author;
        authorUrl = normalizeUrl(authorEl.attr('href'));
    }

    var status = 'Đang ra';
    var statusEl = doc.select('dt:contains(Trạng thái) + dd, .label-success, .label-info, .label-warning, .label-primary').first();
    if (statusEl) {
        status = cleanText(statusEl.text());
    }

    var ongoing = true;
    var statusText = String(status || '').toLowerCase();
    if (statusText.indexOf('hoàn') >= 0 || statusText.indexOf('full') >= 0 || statusText.indexOf('đủ bộ') >= 0) {
        ongoing = false;
        status = 'Hoàn thành';
    }

    var genres = [];
    var genreTexts = [];
    var firstGenreUrl = '';
    doc.select('a.cate-item[itemprop="genre"], a[itemprop="genre"]').forEach(function(a) {
        var title = cleanText(a.text());
        var href = normalizeUrl(a.attr('href'));
        if (!title || !href) return;
        genres.push({
            title: title,
            input: href,
            script: 'gen.js'
        });
        genreTexts.push(title);
        if (!firstGenreUrl) firstGenreUrl = href;
    });

    var storyId = '';
    var storyIdEl = doc.select('#story_id, #report_story_id').first();
    if (storyIdEl) {
        storyId = cleanText(String(storyIdEl.attr('value') || storyIdEl.text() || ''));
    }
    if (!storyId) {
        var commentBtn = doc.select('#loadCommentBtn[onclick*="loadComments("], a[onclick*="loadComments("]').first();
        if (commentBtn) {
            var onclick = commentBtn.attr('onclick') || '';
            var match = onclick.match(/loadComments\((\d+)\)/);
            if (match) storyId = match[1];
        }
    }

    var detail = '';
    detail += '<p><strong>Tác giả:</strong> ' + author + '</p>';
    detail += '<p><strong>Trạng thái:</strong> ' + status + '</p>';

    var chapterCount = doc.select('#listChapters .list-chapters .item').size();
    if (!chapterCount) {
        var totalChapterEl = doc.select('#totalChapter, .total-chapter, .story-info .chapters').first();
        if (totalChapterEl) chapterCount = parseInt(cleanText(totalChapterEl.text()).replace(/\D+/g, ''), 10) || 0;
    }
    if (chapterCount) {
        detail += '<p><strong>Số chương:</strong> ' + chapterCount + '</p>';
    }

    if (genreTexts.length) {
        detail += '<p><strong>Thể loại:</strong> ' + genreTexts.join(', ') + '</p>';
    }

    var suggests = buildSuggests(authorUrl, firstGenreUrl, url);
    var comments = [];
    if (storyId) {
        var countEl = doc.select('#loadCommentBtn .count-items, .count-items').first();
        var commentCountText = countEl ? cleanText(countEl.text()) : '';
        var commentTitle = 'Bình luận';
        if (commentCountText) commentTitle += ' (' + commentCountText + ')';
        comments.push({
            title: commentTitle,
            input: JSON.stringify({ storyId: storyId, page: 1 }),
            script: 'comment.js'
        });
    }

    return Response.success({
        name: name,
        cover: cover,
        author: author,
        description: description,
        detail: detail,
        ongoing: ongoing,
        genres: genres,
        suggests: suggests,
        comments: comments,
        host: BASE_URL
    });
}