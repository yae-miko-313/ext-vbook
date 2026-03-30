load('config.js');
function execute() {
    return Response.success([
        { title: "Truyện App", input: BASE_URL + "/truyen-app/", script: "book.js" },
        { title: "Văn Học Việt Nam", input: BASE_URL + "/van-hoc-viet/", script: "book.js" },
        { title: "Văn Học Nước Ngoài", input: BASE_URL + "/van-hoc/", script: "book.js" }
    ]);
}