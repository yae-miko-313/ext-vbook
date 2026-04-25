load('config.js');

// Home: Hien thi 6-7 menu chinh
function execute() {
    var menus = [
        { name: "Truyện mới đăng", title: "Truyện mới đăng", input: BASE_URL + "/truyen-moi-dang", script: "gen.js" },
        { name: "Truyện mới cập nhật", title: "Truyện mới cập nhật", input: BASE_URL + "/truyen-moi-cap-nhat", script: "gen.js" },
        { name: "Truyện Ma", title: "Truyện Ma", input: BASE_URL + "/truyen-ma", script: "gen.js" },
        { name: "Kiếm Hiệp", title: "Kiếm Hiệp", input: BASE_URL + "/kiem-hiep", script: "gen.js" },
        { name: "Ngôn Tình", title: "Ngôn Tình", input: BASE_URL + "/ngon-tinh", script: "gen.js" },
        { name: "Truyện Tiên Hiệp", title: "Truyện Tiên Hiệp", input: BASE_URL + "/truyen-tien-hiep", script: "gen.js" },
        { name: "Truyện Audio", title: "Truyện Audio", input: BASE_URL + "/truyen-audio", script: "gen.js" }
    ];
    return Response.success(menus);
}
