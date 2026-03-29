function execute(url) {
    let response = Http.get(url).html();
    if (response) {
        let list = [];
        
        // 1. Lấy danh sách chương ở trang hiện tại
        let chapters = response.select("#chapter-list ul li a");
        chapters.forEach(item => {
            list.push({
                name: item.text(),
                url: item.attr("href"),
                host: "https://sstruyen.com.vn"
            });
        });

        // 2. Xử lý lấy thêm chương từ các trang khác (nếu có phân trang)
        // SSTruyen thường dùng hàm page(truyen_id, số_trang)
        // Nếu bạn muốn lấy toàn bộ ngay lập tức, có thể duyệt qua các link phân trang
        // Ở đây tôi hướng dẫn lấy trang 1, các trang sau app vBook sẽ tự gọi dựa trên logic plugin
        
        return Response.success(list);
    }
    return null;
}