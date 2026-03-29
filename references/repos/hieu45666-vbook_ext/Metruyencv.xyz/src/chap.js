load("config.js");

function execute(url) {
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html();
        let content = doc.select(".text-left").html();
        // Xóa quảng cáo nếu có
        content = content.replace(/<a[^>]*>.*?<\/a>/g, "");
        return Response.success(content);
    }
    return null;
}