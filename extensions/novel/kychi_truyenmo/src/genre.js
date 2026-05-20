load('config.js');

function execute() {
    var response = fetchPage(BASE_URL);
    if (!response.ok) return Response.error('HTTP Error: ' + response.status);

    var doc = response.html();
    var data = [];
    var seen = {};

    doc.select('.list-story-categories .show-list-categories a[href*="/the-loai/"], .dropdown-menu a.dropdown-item[href*="/the-loai/"], .list-categories .item-category a[href*="/the-loai/"]').forEach(function(a) {
        var href = normalizeUrl(a.attr('href'));
        if (!href || seen[href]) return;
        seen[href] = true;
        var title = cleanText(a.text());
        if (!title) return;
        data.push({
            title: title,
            input: href,
            script: 'gen.js'
        });
    });

    return Response.success(data);
}