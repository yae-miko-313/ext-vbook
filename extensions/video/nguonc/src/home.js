load('config.js');

function execute() {
    return Response.success([
        { title: "Phim mới cập nhật", input: BASE_URL + "/api/films/phim-moi-cap-nhat", script: "gen.js" },
        { title: "Phim đang chiếu", input: BASE_URL + "/api/films/danh-sach/phim-dang-chieu", script: "gen.js" },
        { title: "Phim bộ", input: BASE_URL + "/api/films/danh-sach/phim-bo", script: "gen.js" },
        { title: "Phim lẻ", input: BASE_URL + "/api/films/danh-sach/phim-le", script: "gen.js" },
        { title: "Hoạt hình", input: BASE_URL + "/api/films/danh-sach/hoat-hinh", script: "gen.js" },
        { title: "TV Shows", input: BASE_URL + "/api/films/danh-sach/tv-shows", script: "gen.js" },

    ]);
}
