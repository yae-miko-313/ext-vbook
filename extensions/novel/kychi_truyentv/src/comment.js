load('config.js');

function execute(input, page) {
    var url = normalizeUrl(input);
    if (!url) return Response.success([]);
    
    var currentPage = page ? String(page) : '1';
    
    // Step 1: Fetch detail page to extract commentable_id
    var detailResponse = fetchPage(url);
    if (!detailResponse.ok) return Response.success([]);
    
    var doc = detailResponse.html();
    var commentableId = '';
    var commentableType = 'novels'; // default
    
    // Try to find commentable_id from data attributes or hidden inputs
    var idEl = doc.select('[data-commentable-id], input[name="commentable_id"]').first();
    if (idEl) {
        commentableId = idEl.attr('data-commentable-id') || idEl.attr('value');
    }
    
    // Try to find from meta tags or script data
    if (!commentableId) {
        var scripts = doc.select('script[type="application/ld+json"]');
        for (var i = 0; i < scripts.size(); i++) {
            var scriptEl = scripts.get(i);
            if (scriptEl) {
                try {
                    var data = JSON.parse(scriptEl.html());
                    if (data && data['@id']) {
                        commentableId = String(data['@id']).split('/').pop();
                        break;
                    }
                } catch (e) {}
            }
        }
    }
    
    // Fallback: Try to extract from URL pattern
    if (!commentableId) {
        var urlParts = url.split('-');
        for (var j = urlParts.length - 1; j >= 0; j--) {
            var part = urlParts[j].replace('.html', '');
            if (part.match(/^\d+$/)) {
                commentableId = part;
                break;
            }
        }
    }
    
    if (!commentableId) return Response.success([]);
    
    // Step 2: Fetch comments via JSON API (be tolerant to different JSON shapes)
    var attemptedApis = [];
    function fetchCommentsForType(type) {
        var apiUrl = BASE_URL + '/api/comments?commentable_type=' + encodeURIComponent(type) +
                     '&commentable_id=' + encodeURIComponent(commentableId) + '&page=' + currentPage;
        attemptedApis.push(apiUrl);
        var resp = fetchPage(apiUrl);
        if (!resp.ok) return null;

        try {
            var txt = resp.text();
            var j = JSON.parse(txt);

            // Support multiple shapes:
            // 1) { data: [ ... ], current_page, last_page }
            // 2) { data: { data: [ ... ], current_page, last_page } }
            // 3) { data: { comments: [ ... ], current_page, last_page } }
            var container = j && j.data ? j.data : j;
            var list = [];
            if (Array.isArray(container)) {
                list = container;
            } else if (container) {
                if (Array.isArray(container.data)) list = container.data;
                else if (Array.isArray(container.comments)) list = container.comments;
                else if (Array.isArray(container.items)) list = container.items;
            }

            var curr = j.current_page || (container && container.current_page) || (container && container.currentPage) || 1;
            var last = j.last_page || (container && container.last_page) || (container && container.lastPage) || curr;

            var out = [];
            for (var k = 0; k < list.length; k++) {
                var c = list[k];
                if (!c) continue;
                var rawContent = c.content || c.message || c.body || c.content_html || c.comment || '';
                var name = c.username || c.name || c.user_name || (c.user && (c.user.name || c.user.username)) || 'Ẩn danh';
                var avatar = c.avatar || (c.user && c.user.avatar) || '';
                if (avatar && !avatar.match(/^https?:\/\//)) avatar = BASE_URL.replace(/\/$/, '') + '/' + avatar.replace(/^\//, '');

                out.push({
                    name: name,
                    content: cleanText(rawContent),
                    avatar: avatar,
                    description: c.created_at || c.time || c.created_at_iso || c.created || ''
                });
            }

            return {items: out, current: parseInt(curr, 10) || 1, last: parseInt(last, 10) || parseInt(curr, 10) || 1};
        } catch (e) {
            return null;
        }
    }

    // Try detected type first, then fall back to common alternatives
    var triedTypes = [];
    if (commentableType) triedTypes.push(commentableType);
    if (triedTypes.indexOf('novels') === -1) triedTypes.push('novels');
    if (triedTypes.indexOf('comics') === -1) triedTypes.push('comics');

    var finalResult = null;
    for (var t = 0; t < triedTypes.length; t++) {
        var r = fetchCommentsForType(triedTypes[t]);
        if (r && r.items && r.items.length > 0) {
            finalResult = r;
            break;
        }
        // keep last non-null result if empty so we can still return pagination
        if (!finalResult && r) finalResult = r;
    }

    if (!finalResult || !finalResult.items || finalResult.items.length === 0) {
        // return diagnostic comment so tester can see what we tried
        var debugText = 'commentableId=' + commentableId + '; tried=' + attemptedApis.join(' | ');
        return Response.success([{name: 'DEBUG', content: debugText, avatar: '', description: ''}]);
    }

    var nextPage = '';
    if (finalResult.current < finalResult.last) nextPage = String(finalResult.current + 1);

    return Response.success(finalResult.items, nextPage);
}
