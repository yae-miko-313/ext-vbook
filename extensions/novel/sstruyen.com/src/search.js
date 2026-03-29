function execute(key, page) {
    if (!page) page = '1';
    
    // SSTruyen dùng query string ?s=keyword&page=n
    let url = "https://sstruyen.com.vn/tim-kiem";
    
    let response = Http.get(url).params({
        "s": key,
        "page": page
    }).html();

    if (response) {
        let list = [];
        // Sử dụng selector .item giống như bạn đã cung cấp ở các turn trước
        let items = response.select(".item");

        items.forEach(item => {
            let name = item.select("h3 a").text();
            if (name) {
                // Lấy thông tin tác giả và số chương từ các thẻ .line
                let author = item.select(".line").first().text().replace("Tác giả: ", "");
                
                list.push({
                    name: name,
                    link: item.select("h3 a").attr("href"),
                    // Nối host nếu link ảnh là đường dẫn tương đối
                    cover: "https://sstruyen.com.vn" + item.select(".cover img").attr("src"),
                    description: author,
                    host: "https://sstruyen.com.vn"
                });
            }
        });

        // Xử lý phân trang cho tìm kiếm
        let next = response.select(".pagination li.active + li").text();

        return Response.success(list, next);
    }
    return null;
}