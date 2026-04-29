load('config.js');

function execute() {
    var webApiUrl = "https://fanqienovel.com/api/author/library/book_list/v0/?page_count=18&creation_status=-1&word_count=-1&book_type=-1&sort=0";

    var maleTags = [
        ["玄幻", 7], ["神豪", 20], ["鉴宝", 17], ["三国", 67], ["二次元", 39],
        ["历史", 12], ["美食", 78], ["奶爸", 42], ["娱乐圈", 43], ["洪荒", 66]
    ];

    var femaleTags = [
        ["现代言情", 3], ["古代言情", 5], ["穿越", 37], ["重生", 36], ["甜宠", 96]
    ];

    var genres = [];
    

    maleTags.forEach(function(tag) {
        genres.push({
            title: tag[0],
            input: webApiUrl + "&gender=1&category_id=" + tag[1] + "&page_index={{page}}",
            script: "gen.js"
        });
    });


    femaleTags.forEach(function(tag) {
        genres.push({
            title: tag[0],
            input: webApiUrl + "&gender=0&category_id=" + tag[1] + "&page_index={{page}}",
            script: "gen.js"
        });
    });

    return Response.success(genres);
}
