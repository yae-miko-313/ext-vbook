function execute() {
    return Response.success([
        {title: "Mới cập nhật", input:  "latest", script: "gen.js"},
        {title: "Truyện HOT", input:  "trending", script: "gen.js"},
        {title: "Lượt xem", input:  "views", script: "gen.js"},
        {title: "Sắp xếp A-Z", input:  "alphabet", script: "gen.js"},
        {title: "Số chương", input:  "chapter-number", script: "gen.js"},
        {title: "Truyện đã hoàn thành", input:  "trending&status=end", script: "gen.js"},
    ]);
}