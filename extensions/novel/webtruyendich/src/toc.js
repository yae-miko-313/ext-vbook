load("config.js");
function execute(url) {
    var res = fetch(url);
    if (!res || !res.ok) return Response.success([]);
    var html = res.text();
    
    var nIdMatch = html.match(/novel_id\s*=\s*["'](\d+)["']/) || html.match(/data-novel-id=["'](\d+)["']/);
    var sNameMatch = html.match(/source_name\s*=\s*['"]([^'"]+)['"]/) || html.match(/data-source=["']([^'"]+)["']/);
    var nSlugMatch = html.match(/novel_url\s*=\s*["']([^"']+)["']/);
    var slug = nSlugMatch ? nSlugMatch[1] : url.split('/').filter(Boolean).pop();

    if (!nIdMatch) return Response.success([]);

    var novelId = nIdMatch[1];
    var sourceName = sNameMatch ? sNameMatch[1] : "69shuba";
    var allChapters = [];
    var seen = {};

    var apiUrlBig = BASE_URL + "/api/novels/" + novelId + "/chapters?source=" + sourceName + "&limit=5000";
    var resBig = fetch(apiUrlBig, { headers: { "X-Requested-With": "XMLHttpRequest" } });

    if (resBig && resBig.ok) {
        var jsonBig = resBig.json();
        var dataBig = jsonBig.data || jsonBig.items || [];
        if (dataBig.length > 100) {
            for (var i = 0; i < dataBig.length; i++) {
                var chSlug1 = dataBig[i].chapter_url || dataBig[i].slug;
                var cUrl1 = BASE_URL + "/truyen/" + slug + "/" + sourceName + "/" + chSlug1;
                if (!seen[cUrl1]) {
                    allChapters.push({ name: dataBig[i].title || dataBig[i].name, url: cUrl1, host: BASE_URL });
                    seen[cUrl1] = true;
                }
            }
            return Response.success(allChapters);
        }
    }

    var page = 1;
    while (page <= 50) {
        var apiUrl = BASE_URL + "/api/novels/" + novelId + "/chapters?source=" + sourceName + "&page=" + page + "&limit=100";
        var apiRes = fetch(apiUrl, { headers: { "X-Requested-With": "XMLHttpRequest" } });

        if (!apiRes || !apiRes.ok) break;
        var json = apiRes.json();
        var data = json.data || json.items || [];
        if (!data || data.length === 0) break;

        var hasNew = false;
        for (var j = 0; j < data.length; j++) {
            var chSlug2 = data[j].chapter_url || data[j].slug;
            var fullUrl = BASE_URL + "/truyen/" + slug + "/" + sourceName + "/" + chSlug2;
            if (!seen[fullUrl]) {
                allChapters.push({ name: data[j].title || data[j].name, url: fullUrl, host: BASE_URL });
                seen[fullUrl] = true;
                hasNew = true;
            }
        }
        if (!hasNew) break;
        page++;
    }
    return Response.success(allChapters);
}