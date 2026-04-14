load('config.js');

function execute() {
    var response = fetchPage(BASE_URL);
    if (response.ok) {
        var doc = response.html();
        var data = [];
        doc.select('.grid .flex').forEach(function(e) {
            data.push({
                title: e.text(),
                input: e.attr('href'),
                script: 'gen.js'
            });
        });
        return Response.success(data);
    }
    return null;
}
