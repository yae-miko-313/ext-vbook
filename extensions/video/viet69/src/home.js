function execute() {
    return Response.success([
        { title: "Mới nhất", input: "/", script: "search.js" },
        { title: "Yêu thích nhất", input: "/yeu-thich/", script: "search.js" },
        { title: "Xem nhiều nhất", input: "/xem-nhieu/", script: "search.js" },
        { title: "Bình luận nhiều nhất", input: "/binh-luan/", script: "search.js" }
    ]);
}
