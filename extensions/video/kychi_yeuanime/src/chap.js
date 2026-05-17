load('config.js');

function extractStream(text, nextDataText) {
    var match = /"(?:m3u8Url|link_m3u8|embedUrl|link_embed)"\s*:\s*"([^"]+)"/i.exec(nextDataText);
    if (match) return match[1];
    
    var raw = /(?:m3u8Url|link_m3u8|embedUrl|link_embed)\\?":\s*\\?"(https?:\/\/[^"\\]+)\\?"/i.exec(text);
    return raw ? raw[1].replace(/\\\//g, '/').replace(/\\/g, '') : '';
}

function getPageUrlForServer(baseUrl, src) {
    var parts = baseUrl.split('/');
    if (parts.length > 0 && src.language_slug) {
        parts[parts.length - 1] = src.language_slug;
    }
    return parts.join('/') + '?server=' + src.server_slug;
}

function execute(url) {
    var baseUrl = url.split('?')[0];
    var response = fetchPage(baseUrl);
    if (!response.ok) return Response.success([]);

    var text = response.text();
    var nextData = extractNextData(text);
    
    var currentStreamUrl = extractStream(text, nextData);
    var currentServerSlug = (/"currentSource"\s*:\s*\{"server"\s*:\s*\{[^}]*"slug"\s*:\s*"([^"]+)"/i.exec(nextData) || [])[1] || '';

    var sources = extractJson(nextData, 'availableSources') || [];
    var list = [];
    var addedUrls = {};

    sources.forEach(function(src) {
        if (!src.server_slug || !src.server_name) return;
        
        var streamUrl = '';
        if (src.server_slug === currentServerSlug && currentStreamUrl) {
            streamUrl = currentStreamUrl;
        } else {
            var serverUrl = getPageUrlForServer(baseUrl, src);
            var serverRes = fetchPage(serverUrl);
            if (serverRes.ok) {
                var serverText = serverRes.text();
                streamUrl = extractStream(serverText, extractNextData(serverText));
            }
        }
        
        if (streamUrl && !addedUrls[streamUrl]) {
            addedUrls[streamUrl] = true;
            list.push({
                title: src.server_name + ' (' + (src.language_name || 'Vietsub') + ')',
                data: streamUrl 
            });
        }
    });

    return Response.success(list);
}
