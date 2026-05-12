load('config.js');

function execute() {
    return Response.success([
        { title: "Cập nhật", input: BASE_URL + "/the-loai/phim-cap-nhat-1", script: "gen.js" },
        { title: "Phim Mới", input: BASE_URL + "/the-loai/phim-moi-1", script: "gen.js" },
        { title: "Phim Bộ", input: BASE_URL + "/the-loai/phim-bo-1", script: "gen.js" },
        { title: "Phim Lẻ", input: BASE_URL + "/the-loai/phim-le-1", script: "gen.js" },
        { title: "Phim Chiếu Rạp", input: BASE_URL + "/the-loai/phim-chieu-rap-1", script: "gen.js" },
        { title: "Hoạt Hình", input: BASE_URL + "/the-loai/hoat-hinh-1", script: "gen.js" },
        { title: "Âu - Mỹ", input: BASE_URL + "/quoc-gia/au-my-1", script: "gen.js" },
        { title: "Trung Quốc", input: BASE_URL + "/quoc-gia/trung-quoc-hong-kong-1", script: "gen.js" },
        { title: "Hàn Quốc", input: BASE_URL + "/quoc-gia/han-quoc-1", script: "gen.js" },
        { title: "Nhật Bản", input: BASE_URL + "/quoc-gia/nhat-ban-1", script: "gen.js" }
    ]);
}
