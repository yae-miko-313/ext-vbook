load("config.js");

function addItem(arr, title, input) {
    arr.push({ title: title, input: input, script: "gen.js" });
}

function execute() {
    var tabs = [];

    addItem(tabs, "Danh sách: Phim đang chiếu", BASE_URL + "/api/films/danh-sach/phim-dang-chieu?page=1");
    addItem(tabs, "Danh sách: Phim bộ", BASE_URL + "/api/films/danh-sach/phim-bo?page=1");
    addItem(tabs, "Danh sách: Phim lẻ", BASE_URL + "/api/films/danh-sach/phim-le?page=1");
    addItem(tabs, "Danh sách: TV Shows", BASE_URL + "/api/films/danh-sach/tv-shows?page=1");

    addItem(tabs, "Thể loại: Hành Động", BASE_URL + "/api/films/the-loai/hanh-dong?page=1");
    addItem(tabs, "Thể loại: Tình Cảm", BASE_URL + "/api/films/the-loai/tinh-cam?page=1");
    addItem(tabs, "Thể loại: Hoạt Hình", BASE_URL + "/api/films/the-loai/hoat-hinh?page=1");
    addItem(tabs, "Thể loại: Kinh Dị", BASE_URL + "/api/films/the-loai/kinh-di?page=1");
    addItem(tabs, "Thể loại: Viễn Tưởng", BASE_URL + "/api/films/the-loai/vien-tuong?page=1");

    addItem(tabs, "Quốc gia: Âu Mỹ", BASE_URL + "/api/films/quoc-gia/au-my?page=1");
    addItem(tabs, "Quốc gia: Hàn Quốc", BASE_URL + "/api/films/quoc-gia/han-quoc?page=1");
    addItem(tabs, "Quốc gia: Trung Quốc", BASE_URL + "/api/films/quoc-gia/trung-quoc?page=1");
    addItem(tabs, "Quốc gia: Nhật Bản", BASE_URL + "/api/films/quoc-gia/nhat-ban?page=1");
    addItem(tabs, "Quốc gia: Thái Lan", BASE_URL + "/api/films/quoc-gia/thai-lan?page=1");

    addItem(tabs, "Năm: 2026", BASE_URL + "/api/films/nam-phat-hanh/2026?page=1");
    addItem(tabs, "Năm: 2025", BASE_URL + "/api/films/nam-phat-hanh/2025?page=1");
    addItem(tabs, "Năm: 2024", BASE_URL + "/api/films/nam-phat-hanh/2024?page=1");
    addItem(tabs, "Năm: 2023", BASE_URL + "/api/films/nam-phat-hanh/2023?page=1");

    return Response.success(tabs);
}
