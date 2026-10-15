load('config.js');

function execute() {
    var response = fetch(BASE_URL + "/api/films/the-loai");
    if (response.ok) {
        var json = response.json();
        var genres = [];
        if (json.items) {
            json.items.forEach(function(item) {
                genres.push({
                    title: item.name,
                    input: BASE_URL + "/api/films/the-loai/" + item.slug,
                    script: "gen.js"
                });
            });
            return Response.success(genres);
        }
    }
    // Fallback nếu API lỗi
    return Response.success([
        { title: "Hành động", input: BASE_URL + "/api/films/the-loai/hanh-dong", script: "gen.js" },
        { title: "Phiêu lưu", input: BASE_URL + "/api/films/the-loai/phieu-luu", script: "gen.js" },
        { title: "Hoạt hình", input: BASE_URL + "/api/films/the-loai/hoat-hinh", script: "gen.js" },
        { title: "Hài hước", input: BASE_URL + "/api/films/the-loai/hai-huoc", script: "gen.js" },
        { title: "Hình sự", input: BASE_URL + "/api/films/the-loai/hinh-su", script: "gen.js" },
        { title: "Tài liệu", input: BASE_URL + "/api/films/the-loai/tai-lieu", script: "gen.js" },
        { title: "Kịch tính", input: BASE_URL + "/api/films/the-loai/kich-tinh", script: "gen.js" },
        { title: "Gia đình", input: BASE_URL + "/api/films/the-loai/gia-dinh", script: "gen.js" },
        { title: "Giả tưởng", input: BASE_URL + "/api/films/the-loai/gia-tuong", script: "gen.js" },
        { title: "Lịch sử", input: BASE_URL + "/api/films/the-loai/lich-su", script: "gen.js" },
        { title: "Kinh dị", input: BASE_URL + "/api/films/the-loai/kinh-di", script: "gen.js" },
        { title: "Âm nhạc", input: BASE_URL + "/api/films/the-loai/am-nhac", script: "gen.js" },
        { title: "Bí ẩn", input: BASE_URL + "/api/films/the-loai/bi-an", script: "gen.js" },
        { title: "Lãng mạn", input: BASE_URL + "/api/films/the-loai/lang-man", script: "gen.js" },
        { title: "Khoa học viễn tưởng", input: BASE_URL + "/api/films/the-loai/khoa-hoc-vien-tuong", script: "gen.js" },
        { title: "Phim người đóng", input: BASE_URL + "/api/films/the-loai/phim-nguoi-dong", script: "gen.js" },
        { title: "Chiến tranh", input: BASE_URL + "/api/films/the-loai/chien-tranh", script: "gen.js" },
        { title: "Miền tây", input: BASE_URL + "/api/films/the-loai/mien-tay", script: "gen.js" }
    ]);
}
