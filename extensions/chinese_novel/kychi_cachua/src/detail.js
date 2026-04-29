load('config.js');

function execute(url) {
    // Regex linh hoạt hơn để lấy Book ID
    var bookIdMatch = url.match(/(?:bookId=|page\/|detail\/)([a-zA-Z0-9_-]+)/);
    var bookId = bookIdMatch ? bookIdMatch[1] : null;
    
    if (!bookId) {
        return Response.error("Không tìm thấy Book ID trong URL: " + url);
    }

    var apiUrl = BASE_URL + "/detail?book_id=" + bookId + "&source=番茄&tab=小说";
    var response = fetchWithUA(apiUrl);
    
    if (response.ok) {
        var json = SafeJson(response);
        var data = json.data;
        if (Array.isArray(data)) data = data[0];

        if (!data) return Response.error("Không tìm thấy thông tin truyện cho ID: " + bookId);

        var status = (data.book_search_visible == 'true' ? '连载中' : (data.tomato_book_status == '3' ? '已下架' : '正常'));
        if (data.creation_status == "0") status = "已完结";

        var name = data.book_name || data.bookName || data.title;
        var author = data.author || data.book_author || data.author_name;
        var cover = data.thumb_url || data.thumbUri || data.book_cover;
        var abstract = data.abstract || data.book_abstract || data.description || "";
        var wordCount = data.word_number || data.word_count || "0";
        var chapterCount = data.serial_count || data.item_count || data.chapter_count || "0";

        return Response.success({
            name: decodeText(name),
            cover: replaceCover(cover),
            author: decodeText(author),
            description: decodeText(abstract).replace(/\n/g, "<br>"),
            detail: "状态: " + status + "<br>评分: " + (data.score || "0") + "<br>字数: " + wordCount + "<br>章节: " + chapterCount,
            genres: data.category ? data.category.split("/").map(function(tag) {
                return {
                    title: tag,
                    input: BASE_URL + "/get_discover?source=番茄&tab=小说&type=0&gender=1&category_id=0&page={{page}}",
                    script: "gen.js"
                };
            }) : [],
            ongoing: data.creation_status != "0",
            link: FANQIE_URL + "/page/" + bookId,
            host: BASE_URL
        });
    }

    return Response.error("Không thể tải chi tiết truyện (HTTP " + response.status + ")");
}
