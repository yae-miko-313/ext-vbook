load('config.js');
function execute() {
    const doc = Http.get(BASE_URL).html();
    const elms = doc.select("#menuMobileItems .genres-dropdown-content > a");
    const data = [];
    elms.forEach(elm => {
        data.push({
           title: elm.attr("title"),
           input: elm.attr("href"),
           script: 'cat.js'
        });
    })
    return Response.success(data);
}