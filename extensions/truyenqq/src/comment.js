load('config.js');

function execute(input, next) {
    var page = next || '1';
    var url = input.replace('{{page}}', page);
    var endpoint = url.split('?')[0];
    var params = parseParams(url);
    var referer = params.referer || BASE_URL;

    var body = 'book_id=' + encodeURIComponent(params.book_id || '')
        + '&parent_id=' + encodeURIComponent(params.parent_id || '0')
        + '&page=' + encodeURIComponent(params.page || page)
        + '&episode_id=' + encodeURIComponent(params.episode_id || '0')
        + '&team_id=' + encodeURIComponent(params.team_id || '1');

    var res = fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': referer,
            'User-Agent': UserAgent.android()
        },
        body: body
    });

    if (!res || !res.ok) return Response.error('Cannot load comments: ' + (res ? res.status : 'no response'));

    var html = res.text() + '';
    if (!html) return Response.success([], null);

    var doc = Html.parse('<html><body><div class="list-comment">' + html + '</div></body></html>');
    var data = parseComments(doc);
    var nextPage = parseNextPage(doc, page);
    return Response.success(data, nextPage);
}

function parseComments(doc) {
    var data = [];
    var comments = doc.select('article.comment-main-level');
    for (var i = 0; i < comments.size(); i++) {
        var item = comments.get(i);
        if (hasClass(item, 'parent_0')) {
            var comment = buildComment(item);
            if (comment.content) data.push(comment);
        }
    }
    return data;
}

function buildComment(item) {
    var name = cleanText(item.select('.item-comment strong[class*=name_]').first().text() + '');
    if (!name) name = cleanText(item.select('.item-comment strong').first().text() + '');
    if (!name) name = 'Ẩn danh';

    var contentEl = item.select('.outline-content-comment .content-comment').first();
    var content = contentEl ? cleanCommentHtml(contentEl.html() + '') : '';

    var replies = item.select('article.info-comment');
    for (var i = 0; i < replies.size(); i++) {
        var reply = replies.get(i);
        if (hasClass(reply, 'parent_0')) continue;
        var replyName = cleanText(reply.select('.item-comment strong[class*=name_]').first().text() + '');
        if (!replyName) replyName = cleanText(reply.select('.item-comment strong').first().text() + '');
        var replyContentEl = reply.select('.outline-content-comment .content-comment').first();
        var replyContent = replyContentEl ? cleanCommentHtml(replyContentEl.html() + '') : '';
        if (replyContent) {
            content += '<br><small>' + escapeHtml(replyName || 'Ẩn danh') + ': ' + replyContent + '</small>';
        }
    }

    return {
        name: name,
        content: content,
        description: buildDescription(item)
    };
}

function buildDescription(item) {
    var parts = [];
    var title = cleanText(item.select('.title-user-comment').first().text() + '');
    var likes = cleanText(item.select('.total-like-comment').first().text() + '');
    var time = cleanText(item.select('.action-comment .time').first().text() + '');
    if (title) parts.push(title);
    if (time) parts.push(time);
    if (likes) parts.push('Thích: ' + likes);
    return parts.join(' · ');
}

function parseNextPage(doc, page) {
    var pages = doc.select('.page_redirect p[onclick]');
    var current = parseInt(page || '1', 10);
    if (isNaN(current)) current = 1;

    var next = null;
    for (var i = 0; i < pages.size(); i++) {
        var onclick = (pages.get(i).attr('onclick') || '') + '';
        var match = onclick.match(/loadComment\((\d+)\)/);
        if (!match || !match[1]) continue;
        var value = parseInt(match[1], 10);
        if (!isNaN(value) && value > current && (next === null || value < next)) next = value;
    }
    return next !== null ? String(next) : null;
}

function cleanCommentHtml(html) {
    html = ((html || '') + '').replace(/<script[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<strong>\s*<\/strong>\s*/gi, '');
    html = html.replace(/<img([^>]*?)src=["']data:image\/[^"']*["']([^>]*?)data-src=["']([^"']+)["']([^>]*)>/gi, '<img$1src="$3"$2data-src="$3"$4>');
    html = html.replace(/\s+/g, ' ').trim();
    return html;
}

function hasClass(el, className) {
    var cls = ' ' + ((el.attr('class') || '') + '') + ' ';
    return cls.indexOf(' ' + className + ' ') >= 0;
}

function parseParams(url) {
    var out = {};
    var index = url.indexOf('?');
    if (index < 0) return out;
    var query = url.substring(index + 1);
    var parts = query.split('&');
    for (var i = 0; i < parts.length; i++) {
        var pair = parts[i].split('=');
        if (!pair[0]) continue;
        out[decodeURIComponent(pair[0])] = decodeURIComponent((pair.slice(1).join('=') || '').replace(/\+/g, ' '));
    }
    return out;
}

function cleanText(text) {
    return ((text || '') + '').replace(/\s+/g, ' ').trim();
}

function escapeHtml(text) {
    text = (text || '') + '';
    return text.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
