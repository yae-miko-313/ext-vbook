load('config.js');

function execute(input, page) {
    var parsed = parseCommentInput(input, page);
    var storyId = parsed.storyId;
    var currentPage = String(parsed.page || '1');

    if (!storyId) return Response.success([], '');

    var apiUrl = BASE_URL + '/ajax/showComment?story_id=' + encodeURIComponent(storyId) + '&btnComment=1&num=1&page=' + encodeURIComponent(currentPage) + '&type=comment';
    var response = fetchPage(apiUrl, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
    });

    if (!response.ok) return Response.error('HTTP Error: ' + response.status);

    var html = response.text();
    var doc = response.html();
    var comments = [];
    var seen = {};

    doc.select('ul > li').forEach(function(item) {
        var contentEl = item.select('p').first();
        var metaEl = item.select('p').last();
        if (!contentEl || !metaEl) return;

        var content = cleanText(contentEl.text());
        if (!content) return;

        var authorEl = metaEl.select('a').first();
        var author = authorEl ? cleanText(authorEl.text()) : '';
        if (!author) author = 'Ẩn danh';

        var timeText = cleanText(metaEl.text().replace(author, '').replace('Trả lời', '').replace('·', ''));
        var key = author + '|' + content + '|' + timeText;
        if (seen[key]) return;
        seen[key] = true;

        comments.push({
            name: author,
            content: content,
            avatar: '',
            description: timeText
        });
    });

    var next = '';
    var totalComments = parseTotalComments(doc);
    var currentNum = parseInt(currentPage, 10) || 1;
    if (totalComments > currentNum && comments.length > 0) {
        next = JSON.stringify({ storyId: storyId, page: currentNum + 1 });
    } else {
        var nextLink = doc.select('button[onclick*="more_comments"], a[onclick*="more_comments"], .paging a[href*="more-comments"], .paging button[onclick*="more_comments"]').first();
        if (nextLink) {
            next = JSON.stringify({ storyId: storyId, page: currentNum + 1 });
        }
    }

    return Response.success(comments, next);
}

function parseCommentInput(input, page) {
    var out = { storyId: '', page: 1 };

    function readValue(value) {
        if (!value) return null;
        var str = String(value);
        if (str.charAt(0) === '{') {
            try {
                return JSON.parse(str);
            } catch (error) {
                return null;
            }
        }
        return str;
    }

    var a = readValue(input);
    var b = readValue(page);

    if (typeof a === 'string') {
        out.storyId = a.replace(/\D+/g, '');
    } else if (a) {
        out.storyId = String(a.storyId || a.story_id || a.id || '').replace(/\D+/g, '');
        out.page = parseInt(String(a.page || a.currentPage || a.current_page || '1'), 10) || 1;
    }

    if (typeof b === 'string') {
        out.page = parseInt(b, 10) || out.page;
    } else if (b) {
        var sid = String(b.storyId || b.story_id || b.id || '').replace(/\D+/g, '');
        if (sid) out.storyId = sid;
        out.page = parseInt(String(b.page || b.currentPage || b.current_page || out.page), 10) || out.page;
    }

    if (out.page < 1) out.page = 1;
    return out;
}

function parseTotalComments(doc) {
    var text = cleanText(doc.select('p').first().text());
    var match = text.match(/(\d+)\s*bình luận/i);
    if (!match) return 0;
    return parseInt(match[1], 10) || 0;
}