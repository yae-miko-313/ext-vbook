function execute(url, page) {
    let requestUrl = url + "?page=" + page;
    
    let response = Http.get(requestUrl).html();
    if (response) {
        let list = [];
        // Lấy tất cả các thẻ div có class là item
        let items = response.select(".item");

        items.forEach(item => {
            let name = item.select("h3 a").text();
            if (name) { // Kiểm tra nếu có tên truyện mới thêm vào list
                list.push({
                    name: name,
                    link: item.select("h3 a").attr("href"),
                    // SSTruyen dùng link tương đối, cần thêm domain nếu app yêu cầu full link
                    cover: item.select(".cover img").attr("src"),
                    description: item.select(".line").first().text(), // Lấy dòng Tác giả
                    host: "https://sstruyen.com.vn"
                });
            }
        });

        // Xử lý phân trang
        // Tìm li có class active, sau đó lấy li tiếp theo
        let next = response.select(".phan-trang a.active + a").text();

        return Response.success(list, next);
    }
    return null;
}