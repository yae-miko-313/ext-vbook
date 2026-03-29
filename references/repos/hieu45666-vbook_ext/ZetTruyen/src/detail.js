function execute(url) {
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html();
        
        // Trích xuất Tên truyện
        let name = doc.select("h1").first().text();
        
        // Trích xuất Ảnh bìa (ưu tiên data-src hoặc src của ảnh chính)
        let cover = doc.select(".thumb-cover img").first().attr("src");

        // Tìm bảng thông tin để trích xuất các trường dữ liệu
        let infoBlocks = doc.select(".flex.md\\:flex-col.flex-row");
        let author = "Đang cập nhật";
        let status = "Đang tiến hành";
        let ongoing = true;

        infoBlocks.forEach(block => {
            let label = block.select(".font-medium").text().trim();
            let value = block.select("div:nth-child(2)").text().trim();

            if (label.includes("Tác giả")) {
                author = value;
            } else if (label.includes("Trạng thái")) {
                status = value;
                if (status.includes("Hoàn thành")) ongoing = false;
            }
        });

        // Trích xuất phần mô tả truyện
        // Thường nằm trong thẻ có ID summary hoặc class liên quan đến nội dung
        let description = doc.select(".comic-content").text().trim();

        return Response.success({
            name: name,
            cover: cover,
            author: author,
            description: description,
            detail: "Trạng thái: " + status,
            ongoing: ongoing,
            host: "https://www.zettruyen.africa"
        });
    }
    return null;
}