load('config.js');
function execute(url) {
    var response = fetchPage(url);
    if (!response.ok) {
        return Response.error('HTTP Error: ' + response.status);
    }

    var htmlText = response.text();
    var content = extractFromNextStream(htmlText);

    if (!content) {
        var retry = fetchPage(url);
        if (retry.ok) {
            var doc = retry.html();
            if (doc && typeof doc.select === 'function') {
                var contentEl = doc.select('div.chapter-content, .chapter-c, article, .entry-content, .noi-dung, .smiley').first();
                if (contentEl) content = contentEl.html() || '';
            }
        }
    }

    content = cleanContent(content);

    if (!content) {
        return Response.error('Nội dung chương trống.');
    }

    return Response.success(content);
}

function extractFromNextStream(htmlText) {
    var raw = String(htmlText || '');
    if (!raw) return '';

    var scriptChunks = [];
    var scriptRegex = /self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)\<\/script\>/g;
    var m;
    while ((m = scriptRegex.exec(raw)) !== null) {
        scriptChunks.push(m[1]);
    }

    var best = '';
    for (var i = 0; i < scriptChunks.length; i++) {
        var decoded = decodeFlightChunk(scriptChunks[i]);
        if (!decoded) continue;
        var score = (decoded.match(/<p>/g) || []).length;
        if (score >= 5 && decoded.length > best.length) {
            best = decoded;
        }
    }

    if (!best) {
        var fallback = decodeFlightChunk(raw);
        if ((fallback.match(/<p>/g) || []).length >= 5) {
            best = fallback;
        }
    }

    return best;
}

function decodeFlightChunk(chunk) {
    var s = String(chunk || '');
    if (!s) return '';
    return s
        .replace(/\\u003c/g, '<')
        .replace(/\\u003e/g, '>')
        .replace(/\\u0026/g, '&')
        .replace(/\\u0027/g, "'")
        .replace(/\\u0022/g, '"')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\t/g, '\t')
        .replace(/\\\//g, '/')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
}

function cleanContent(content) {
    var text = String(content || '');
    var firstP = text.indexOf('<p>');
    if (firstP >= 0) text = text.substring(firstP);

    var lastCloseP = text.lastIndexOf('</p>');
    if (lastCloseP >= 0) text = text.substring(0, lastCloseP + 4);

    return text
        .replace(/\n/gm, '<br>')
        .replace(/&(nbsp|amp|quot|lt|gt|bp|emsp);/g, ' ')
        .replace(/(<br\s*\/?>(\s|&nbsp;)*){2,}/g, '<br>')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<img[^>]*>/gi, '')
        .replace(/<\/?p[^>]*>/gi, '')
        .trim();
}