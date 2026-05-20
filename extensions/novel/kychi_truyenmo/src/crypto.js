function safeBase64Decode(text) {
    if (!text) return '';
    try {
        if (typeof atob === 'function') {
            return atob(text);
        }
    } catch (error) {
    }

    return '';
}

function safeBase64Encode(text) {
    if (!text) return '';
    try {
        if (typeof btoa === 'function') {
            return btoa(text);
        }
    } catch (error) {
    }

    return '';
}

function extractBeforeContentMap(rawHtml) {
    var map = {};
    var html = String(rawHtml || '');
    if (!html) return map;

    var regex = /\.([a-zA-Z0-9\-_]+):before\s*\{\s*content:\s*"([^\"]*)"\s*;?\s*\}/g;
    var match;
    while ((match = regex.exec(html)) !== null) {
        var cls = match[1];
        var txt = match[2] || '';
        txt = txt.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\n/g, ' ').replace(/\\r/g, '');
        map[cls] = txt;
    }

    return map;
}

function decodeObfuscatedSpan(content, map) {
    var html = String(content || '');
    if (!html || !map) return html;

    return html.replace(/<span[^>]*class="([^"]+)"[^>]*><\/span>/gi, function(_, clsNames) {
        var classes = String(clsNames || '').split(/\s+/);
        for (var i = 0; i < classes.length; i++) {
            var key = classes[i];
            if (map[key] !== undefined) return map[key];
        }
        return '';
    });
}