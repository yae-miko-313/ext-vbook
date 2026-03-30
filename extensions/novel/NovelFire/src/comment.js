function execute(input) {
    if (!input) return Response.success([]);
    
    var apiRes = fetch("https://novelfire.net/comment/show?post_id=" + input + "&order_by=newest");
    if (!apiRes.ok) return Response.success([]);
    
    var text = apiRes.text();
    var doc;
    try {
        var cJson = JSON.parse(text);
        doc = Html.parse(cJson.html || cJson.data || text);
    } catch(ex) {
        doc = Html.parse(text);
    }
    
    var comments = [];
    var items = doc.select(".comment-item, .comment, .comment-box, .media");
    
    // Lớp phòng thủ: Nếu API không trả về đúng class, in nguyên text ra để bắt lỗi
    if (items.isEmpty() && text.length > 10) {
        var cleanText = text.replace(/<[^>]*>/g, "").trim().substring(0, 300);
        if (cleanText) {
             return Response.success([{
                name: "Hệ thống (API ẩn)",
                content: cleanText,
                description: ""
            }]);
        }
    }

    items.forEach(function(e) {
        var cUser = e.select(".name, .author, h4, .media-heading").first().text().trim() || "Ẩn danh";
        var cText = e.select(".content, .text, p, .comment-content").first().text().trim();
        
        if (cText) {
            comments.push({
                name: cUser,
                content: cText,
                description: ""
            });
        }
    });
    
    return Response.success(comments);
}
