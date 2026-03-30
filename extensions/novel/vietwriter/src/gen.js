load('config.js');
function execute() {
    return Response.success([
        { title: "Truyện Sáng Tác", input: BASE_URL + "/truyen-sang-tac/", script: "book.js" },
        { title: "Truyện Ngôn Tình", input: BASE_URL + "/truyen-ngon-tinh/", script: "book.js" },
        { title: "Truyện Việt", input: BASE_URL + "/truyen-viet/", script: "book.js" },
        { title: "Truyện Convert", input: BASE_URL + "/truyen-convert/", script: "book.js" },
        { title: "Truyện Ma", input: BASE_URL + "/truyen-ma/", script: "book.js" },
        { title: "Tiên Hiệp", input: BASE_URL + "/tien-hiep/", script: "book.js" },
        { title: "Kiếm Hiệp", input: BASE_URL + "/kiem-hiep/", script: "book.js" },
        { title: "Truyện Teen", input: BASE_URL + "/truyen-teen/", script: "book.js" },
        { title: "Đam Mỹ", input: BASE_URL + "/dam-my/", script: "book.js" },
        { title: "Cổ Đại", input: BASE_URL + "/co-dai/", script: "book.js" },
        { title: "Xuyên Không", input: BASE_URL + "/truyen-xuyen-khong/", script: "book.js" },
        { title: "Trinh Thám", input: BASE_URL + "/trinh-tham/", script: "book.js" },
        { title: "Review Truyện", input: BASE_URL + "/review-truyen/", script: "book.js" },
        { title: "Tiểu Thuyết", input: BASE_URL + "/tieu-thuyet/", script: "book.js" }
    ]);
}