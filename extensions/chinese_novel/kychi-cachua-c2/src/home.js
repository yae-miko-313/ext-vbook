load("config.js");

function execute() {
    var g = String(GENDER);
    var lib = FANQIE_URL + "/api/author/library/book_list/v0/?page_count=20&creation_status=-1&word_count=-1&book_type=-1&sort=0&gender=" + g + "&category_id=-1&page_index={{page}}";
    var libF = FANQIE_URL + "/api/author/library/book_list/v0/?page_count=20&creation_status=0&word_count=-1&book_type=-1&sort=0&gender=" + g + "&category_id=-1&page_index={{page}}";

    var libH = FANQIE_URL + "/api/author/library/book_list/v0/?page_count=20&creation_status=-1&word_count=-1&book_type=-1&sort=3&gender=" + g + "&category_id=-1&page_index={{page}}";
    var libN = FANQIE_URL + "/api/author/library/book_list/v0/?page_count=20&creation_status=-1&word_count=-1&book_type=-1&sort=1&gender=" + g + "&category_id=-1&page_index={{page}}";
    return Response.success([
        { title: "\u70ED\u95E8\u63A8\u8350", input: lib,  script: "gen.js" },
        { title: "\u65B0\u4E66\u901F\u9012", input: libN, script: "gen.js" },
        { title: "\u5B8C\u7ED3\u7CBE\u9009", input: libF, script: "gen.js" },
        { title: "\u9AD8\u5206\u4F73\u4F5C", input: libH, script: "gen.js" },
        { title: "\uD83D\uDCDA \u4E66\u67B6", input: FANQIE_URL + "/api/reader/book/progress", script: "bookshelf.js" }
    ]);
}
