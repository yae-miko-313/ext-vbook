load('config.js');

function execute() {
    var response = fetch(BASE_URL, {
        headers: {
            'User-Agent': BASE_UA
        }
    });

    if (!response.ok) {
        return Response.error('HTTP Error: ' + response.status);
    }

    var doc = response.html();
    var data = [];
    var seen = {};

    doc.select(".grid a[href*='/the-loai/']").forEach(function(e) {
        var title = e.text().trim();
        var href = normalizeLink(e.attr('href') || '');
        if (!title || !href || seen[href]) return;
        seen[href] = true;
        data.push({
            title: title,
            input: href,
            script: 'gen.js'
        });
    });

    return Response.success(data);
}
