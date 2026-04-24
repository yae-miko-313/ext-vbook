load("config.js");

function execute() {
    return Response.success([
        {
            title: "Phim mới cập nhật",
            input: BASE_URL + "/api/films/phim-moi-cap-nhat?page={{page}}",
            script: "gen.js"
        },
        {
            title: "Phim đang chiếu",
            input: BASE_URL + "/api/films/danh-sach/phim-dang-chieu?page={{page}}",
            script: "gen.js"
        },
        {
            title: "Phim bộ",
            input: BASE_URL + "/api/films/danh-sach/phim-bo?page={{page}}",
            script: "gen.js"
        },
        {
            title: "Phim lẻ",
            input: BASE_URL + "/api/films/danh-sach/phim-le?page={{page}}",
            script: "gen.js"
        },
        {
            title: "TV Shows",
            input: BASE_URL + "/api/films/danh-sach/tv-shows?page={{page}}",
            script: "gen.js"
        },
        {
            title: "Thể loại",
            input: "genres-fixed",
            script: "genre.js"
        }
    ]);
}
