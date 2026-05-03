load('config.js');
try { load('crypto.js'); } catch (e) {}

/**
 * Main executor: Lấy nội dung chương từ quykhu.com
 */
function execute(url) {
    url = String(url || '').trim();
    if (!url) return Response.error('URL chương không hợp lệ.');

    var doc = null;
    if (typeof Engine !== 'undefined' && Engine && typeof Engine.newBrowser === 'function') {
        try {
            var browser = Engine.newBrowser();
            doc = browser.launch(url, 15000);
            if (browser.close) try { browser.close(); } catch(e) {}
        } catch (e) {}
    }

    if (!doc) {
        var resp = fetchPage(url);
        if (resp.ok) doc = resp.html();
    }

    if (!doc) return Response.error('Không tải được nội dung trang.');

    var rawHTML = '';
    try { rawHTML = doc.html(); } catch (e) { rawHTML = ''; }

    var content = '';
    var contentEls = doc.select('.smiley, #content, .chapter-content, #chapter-content');
    if (getSize(contentEls) > 0) {
        content = getElement(contentEls, 0).html();
    }

    if (!content || content.indexOf('window.__loadXorContent') !== -1 || content.length < 50) {
        content = manualXorDecrypt(doc, rawHTML) || content;
    }

    if (!content || content.length < 50) {
        var m = rawHTML.match(/<div[^>]*class=["']?smiley["']?[^>]*>([\s\S]*?)<\/div>/i);
        if (m && m[1]) content = m[1];
    }

    if (content && content.length > 50) {
        return Response.success(cleanContent(content));
    }

    return Response.error('Không tìm thấy nội dung chương hoặc giải mã thất bại.');
}

function manualXorDecrypt(doc, rawHTML) {
    var endpoint = '';
    var xorKey = '';

    var m = rawHTML.match(/fetch\s*\(\s*["'](\/r\/c\/(\d+))/);
    if (m && m[1]) endpoint = normalizeUrl(m[1]);
    
    if (!endpoint) {
        var m2 = rawHTML.match(/\/r\/c\/(\d+)/);
        if (m2) endpoint = normalizeUrl(m2[0]);
    }

    var keyMatch = rawHTML.match(/(?:window\.__xorKey|__key|xor_?key)\s*=\s*["']([^"']+)["']/i);
    if (keyMatch) xorKey = keyMatch[1];
    
    if (!xorKey) {
        var scripts = doc.select('script');
        var scriptCount = getSize(scripts);
        for (var i = 0; i < scriptCount; i++) {
            var st = getElement(scripts, i).html();
            var km = st.match(/(?:__xorKey|__key|xor_?key)\s*=\s*["']([^"']+)["']/i);
            if (km) { xorKey = km[1]; break; }
        }
    }

    if (endpoint && xorKey) {
        var payloadResp = fetchPage(endpoint, {
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' }
        });
        if (payloadResp.ok) {
            try {
                var payload = JSON.parse(payloadResp.text());
                var data = payload.d || (payload.data && payload.data.d) || (typeof payload.data === 'string' ? payload.data : '');
                var key = payload.k || (payload.data && payload.data.k) || xorKey;
                
                if (data && key) {
                    return xorDecode(data, key);
                }
            } catch (e) {}
        }
    }
    return '';
}

function xorDecode(base64Text, key) {
    try {
        if (!base64Text || !key) return '';
        
        var raw;
        var hasCrypto = false;
        try { hasCrypto = (typeof CryptoJS !== 'undefined'); } catch(e) {}
        
        if (hasCrypto) {
            var wa = CryptoJS.enc.Base64.parse(base64Text);
            raw = CryptoJS.enc.Latin1.stringify(wa);
        } else {
            if (typeof atob === 'function') {
                raw = atob(base64Text);
            } else {
                return '';
            }
        }

        var result = [];
        var keyLen = key.length;
        for (var i = 0; i < raw.length; i++) {
            result.push(String.fromCharCode(raw.charCodeAt(i) ^ key.charCodeAt(i % keyLen)));
        }
        var decoded = result.join('');

        try {
            return decodeURIComponent(escape(decoded));
        } catch (e) {
            return decoded;
        }
    } catch (e) {
        return '';
    }
}

function cleanContent(content) {
    if (!content) return '';
    var result = String(content);
    
    result = result.replace(/<script[\s\S]*?<\/script>/gi, '');
    result = result.replace(/<style[\s\S]*?<\/style>/gi, '');
    result = result.replace(/window\.__loadXorContent[\s\S]*?<\/script>/gi, '');
    result = result.replace(/&nbsp;/g, ' ');
    result = result.replace(/<(?!br|p|\/p|img)[^>]+>/gi, '');
    result = result.replace(/\n/gm, '<br>');
    result = result.replace(/(?:<br\s*\/?>\s*)+/gi, '<br>');
    
    return result.trim();
}


