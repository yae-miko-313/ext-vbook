load('config.js');
function execute() {
    return Response.success([
        { title: "Truyện Mới", input: BASE_URL + "/truyen/", script: "book.js" },
        { title: "Hoàn Thành", input: BASE_URL + "/trang-thai-truyen/hoan-thanh/", script: "book.js" },
        { title: "Ngôn Tình", input: BASE_URL + "/the-loai/ngon-tinh/", script: "book.js" },
        { title: "Hiện Đại", input: BASE_URL + "/the-loai/hien-dai/", script: "book.js" },
        { title: "Đô Thị", input: BASE_URL + "/the-loai/do-thi/", script: "book.js" },
        { title: "Drama", input: BASE_URL + "/the-loai/drama/", script: "book.js" }
    ]);
}