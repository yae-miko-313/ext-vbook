load('config.js');
function execute() {
    var response = fetch(BASE_URL);
    if (response.ok) {
        var doc = response.html();
        var data = [];
        var seen = {};
        doc.select('.list-cat-inner a').forEach(function(e) {
            var title = e.text().trim();
            var href = e.attr('href') || '';
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
    return Response.error('HTTP Error: ' + response.status);
}