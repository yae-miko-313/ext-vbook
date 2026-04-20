load('config.js');

function execute(input) {
    let doc = Html.parse(input);
    let books = parseCards(doc);
    return Response.success(books);
}
