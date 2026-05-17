load('config.js');

// chap.js — Extract m3u8 stream URLs từ RSC payload của AnimeHay
// RSC payload chứa mảng "episodes" với cấu trúc:
// { server: "#Hà Nội (Vietsub)", name: "Tập 01", slug: "tap-01", type: "m3u8", link: "https://..." }
// Mỗi tập có 2 entry: type "m3u8" (direct stream) và type "embed" (player wrapper)

function execute(url) {
    if (!url) return Response.success([]);

    url = normalizeUrl(url);
    var response = fetchPage(url);
    if (!response.ok) return Response.success([]);

    var html = response.text();

    // Tìm episode slug từ URL: /phim/{slug}/tap-01 -> tap-01
    var epSlugMatch = url.match(/\/(tap-[^\/\?]+)/);
    var epSlug = epSlugMatch ? epSlugMatch[1] : '';

    // Extract episodes array từ RSC payload
    // Pattern: "episodes":[{...},{...}]
    var servers = [];
    var seen = {};

    // Regex tìm tất cả episode entries có slug khớp và type m3u8
    // Format trong RSC: "slug":"tap-01","type":"m3u8","link":"https://..."
    var pattern = /"server"\s*:\s*"([^"]+)"\s*,\s*"name"\s*:\s*"([^"]+)"\s*,\s*"slug"\s*:\s*"([^"]+)"\s*,\s*"type"\s*:\s*"([^"]+)"\s*,\s*"link"\s*:\s*"([^"]+)"/g;
    var match;

    while ((match = pattern.exec(html)) !== null) {
        var serverName = match[1];
        var epName = match[2];
        var slug = match[3];
        var type = match[4];
        var link = match[5];

        // Chỉ lấy entries khớp episode slug hiện tại
        if (slug !== epSlug) continue;

        // Ưu tiên m3u8 > embed
        var key = serverName + '_' + type;
        if (seen[key]) continue;
        seen[key] = true;

        if (type === 'm3u8') {
            // Direct m3u8 stream — ưu tiên cao nhất
            servers.push({
                title: serverName + ' (M3U8)',
                data: JSON.stringify({
                    url: link.replace(/\\\//g, '/'),
                    type: 'native',
                    referer: DEFAULT_REFERER
                })
            });
        } else if (type === 'embed') {
            // Embed player fallback
            servers.push({
                title: serverName + ' (Embed)',
                data: JSON.stringify({
                    url: link.replace(/\\\//g, '/'),
                    type: 'auto',
                    referer: DEFAULT_REFERER
                })
            });
        }
    }

    // Nếu không tìm thấy qua regex chính, thử pattern escaped (RSC thường escape quotes)
    if (servers.length === 0) {
        var escPattern = /\\?"server\\?"\s*:\\s*\\?"([^"\\]+)\\?"\s*,\s*\\?"name\\?"\s*:\\s*\\?"([^"\\]+)\\?"\s*,\s*\\?"slug\\?"\s*:\\s*\\?"([^"\\]+)\\?"\s*,\s*\\?"type\\?"\s*:\\s*\\?"([^"\\]+)\\?"\s*,\s*\\?"link\\?"\s*:\\s*\\?"([^"\\]+)\\?"/g;
        while ((match = escPattern.exec(html)) !== null) {
            var sName = match[1];
            var eSlug = match[3];
            var eType = match[4];
            var eLink = match[5].replace(/\\\//g, '/');

            if (eSlug !== epSlug) continue;

            var eKey = sName + '_' + eType;
            if (seen[eKey]) continue;
            seen[eKey] = true;

            if (eType === 'm3u8') {
                servers.push({
                    title: sName + ' (M3U8)',
                    data: JSON.stringify({
                        url: eLink,
                        type: 'native',
                        referer: DEFAULT_REFERER
                    })
                });
            } else if (eType === 'embed') {
                servers.push({
                    title: sName + ' (Embed)',
                    data: JSON.stringify({
                        url: eLink,
                        type: 'auto',
                        referer: DEFAULT_REFERER
                    })
                });
            }
        }
    }

    return Response.success(servers);
}
