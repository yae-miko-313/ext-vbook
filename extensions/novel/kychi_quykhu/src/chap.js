load('config.js');

function execute(url) {
    var response = fetchPage(url);
    if (!response.ok) return Response.error('HTTP Error: ' + response.status);

    var doc = response.html();
    var content = doc.select('.smiley').html() || '';
    if (content && content.indexOf('window.__loadXorContent') === -1) {
        return Response.success(cleanContent(content));
    }

    var endpoint = '';
    doc.select('script').forEach(function(s) {
        if (endpoint) return;
        var t = s.html() || '';
        var m = t.match(/https?:\/\/[^"']+\/r\/c\/(\d+)/) || t.match(/['"](\/r\/c\/\d+)['"]/);
        if (m) {
            endpoint = m[0].indexOf('/r/c/') >= 0 && m[0].indexOf('http') === 0 ? m[0] : (BASE_URL + m[1]);
        }
    });
    if (!endpoint) {
        var idMatch = String(url).match(/\/chuong-(\d+)/i);
        if (idMatch) endpoint = BASE_URL + '/r/c/' + idMatch[1];
    }
    if (!endpoint) return Response.error('Không tìm được endpoint nội dung chương.');

    var payloadResp = fetchPage(endpoint, {
        headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    });
    if (!payloadResp.ok) return Response.error('HTTP Error: ' + payloadResp.status);

    var payload = payloadResp.json();
    if (!payload || !payload.d || !payload.k) {
        return Response.error('Payload chương không hợp lệ.');
    }

    var decoded = xorDecode(payload.d, payload.k);
    if (!decoded) return Response.error('Giải mã nội dung thất bại.');
    return Response.success(cleanContent(decoded));
}

function xorDecode(base64Text, key) {
    try {
        var bytes = base64ToBytes(String(base64Text || ''));
        var keyStr = String(key || '');
        if (!keyStr || !bytes.length) return '';

        var decodedBytes = [];
        for (var i = 0; i < bytes.length; i++) {
            var k = keyStr.charCodeAt(i % keyStr.length) & 255;
            decodedBytes.push(bytes[i] ^ k);
        }

        return utf8DecodeBytes(decodedBytes);
    } catch (e) {
        return '';
    }
}

function base64ToBytes(input) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var str = String(input || '').replace(/[^A-Za-z0-9\+\/\=]/g, '');
    var out = [];
    var i = 0;

    while (i < str.length) {
        var enc1 = chars.indexOf(str.charAt(i++));
        var enc2 = chars.indexOf(str.charAt(i++));
        var enc3 = chars.indexOf(str.charAt(i++));
        var enc4 = chars.indexOf(str.charAt(i++));

        var chr1 = (enc1 << 2) | (enc2 >> 4);
        var chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        var chr3 = ((enc3 & 3) << 6) | enc4;

        out.push(chr1 & 255);
        if (enc3 !== 64) out.push(chr2 & 255);
        if (enc4 !== 64) out.push(chr3 & 255);
    }

    return out;
}

function utf8DecodeBytes(bytes) {
    var out = '';
    var i = 0;
    while (i < bytes.length) {
        var c = bytes[i++];
        if (c < 128) {
            out += String.fromCharCode(c);
        } else if (c > 191 && c < 224) {
            var c2 = bytes[i++] || 0;
            out += String.fromCharCode((c & 31) << 6 | c2 & 63);
        } else {
            var c2b = bytes[i++] || 0;
            var c3 = bytes[i++] || 0;
            out += String.fromCharCode((c & 15) << 12 | (c2b & 63) << 6 | (c3 & 63));
        }
    }
    return out;
}

function cleanContent(content) {
    return String(content || '')
        .replace(/\n/gm, '<br>')
        .replace(/&(nbsp|amp|quot|lt|gt|bp|emsp);/g, ' ')
        .replace(/(<br\s*\/?>(\s|&nbsp;)*){2,}/g, '<br>')
        .replace(/<img[^>]*>/gi, '')
        .replace(/<\/?p[^>]*>/gi, '');
}
