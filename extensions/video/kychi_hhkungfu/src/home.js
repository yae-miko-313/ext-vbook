load('config.js');

function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: BASE_URL + "/moi-cap-nhat", script: "gen.js" },
        { title: "Xem Nhiều", input: BASE_URL + "/top-xem-nhieu", script: "gen.js" },
        { title: "Hoàn Thành", input: BASE_URL + "/hoan-thanh", script: "gen.js" },
        { title: "Tu Tiên", input: BASE_URL + "/category/tu-tien", script: "gen.js" },
        { title: "Luyện Cấp", input: BASE_URL + "/category/luyen-cap", script: "gen.js" },
        { title: "Trùng Sinh", input: BASE_URL + "/category/trung-sinh", script: "gen.js" },
        { title: "Kiếm Hiệp", input: BASE_URL + "/category/kiem-hiep", script: "gen.js" },
        { title: "Xuyên Không", input: BASE_URL + "/category/xuyen-khong", script: "gen.js" },
        { title: "Hài Hước", input: BASE_URL + "/category/hai-huoc", script: "gen.js" },
        { title: "Hiện Đại", input: BASE_URL + "/category/hien-dai", script: "gen.js" }
    ]);
}
