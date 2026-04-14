load('config.js');

function execute() {
    var items = [];
    for (var i = 0; i < CATEGORIES.length; i++) {
        items.push({
            title: CATEGORIES[i].title,
            input: CATEGORIES[i].input,
            script: 'gen.js'
        });
    }
    return Response.success(items);
}
