function execute(url) {
    let response = Http.get(url).html();
    if (response) {
        let content = response.select(".truyen");

        // Loại bỏ các thành phần rác nếu có
        content.select("script, style, div, ins").remove();

        // Lấy mã HTML bên trong để xử lý thủ công các điểm ngắt dòng
        let html = content.html();

        return Response.success(html);
    }
    return null;
}