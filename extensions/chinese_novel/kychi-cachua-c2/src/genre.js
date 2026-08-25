load("config.js");

function execute() {
    // Base URL cho thư viện Fanqie
    var base = FANQIE_URL + "/api/author/library/book_list/v0/?page_count=20&creation_status=-1&word_count=-1&book_type=-1&sort=0";

    function url(catId, gender) {
        return base + "&gender=" + gender + "&category_id=" + catId + "&page_index={{page}}";
    }

    return Response.success([
        { title: "\u7384\u5E7B",              input: url("7",    "1"), script: "gen.js" },
        { title: "\u5947\u5E7B",              input: url("8",    "1"), script: "gen.js" },
        { title: "\u6B66\u4FCA",              input: url("9",    "1"), script: "gen.js" },
        { title: "\u4ED9\u4FA0",              input: url("10",   "1"), script: "gen.js" },
        { title: "\u90FD\u5E02",              input: url("11",   "1"), script: "gen.js" },
        { title: "\u5386\u53F2",              input: url("12",   "1"), script: "gen.js" },
        { title: "\u519B\u4E8B",              input: url("13",   "1"), script: "gen.js" },
        { title: "\u6E38\u620F",              input: url("14",   "1"), script: "gen.js" },
        { title: "\u7ADE\u6280",              input: url("15",   "1"), script: "gen.js" },
        { title: "\u79D1\u5E7B",              input: url("16",   "1"), script: "gen.js" },
        { title: "\u60AC\u7591",              input: url("17",   "1"), script: "gen.js" },
        { title: "\u8111\u6D1E(\u7537)",     input: url("1007", "1"), script: "gen.js" },
        { title: "\u73B0\u4EE3\u8A00\u60C5", input: url("19",   "0"), script: "gen.js" },
        { title: "\u53E4\u4EE3\u8A00\u60C5", input: url("20",   "0"), script: "gen.js" },
        { title: "\u5E7B\u60F3\u8A00\u60C5", input: url("21",   "0"), script: "gen.js" },
        { title: "\u9752\u6625\u6821\u56ED", input: url("23",   "0"), script: "gen.js" },
        { title: "\u540C\u4EBA",              input: url("24",   "0"), script: "gen.js" },
        { title: "\u8111\u6D1E(\u5973)",     input: url("1008", "0"), script: "gen.js" }
    ]);
}
