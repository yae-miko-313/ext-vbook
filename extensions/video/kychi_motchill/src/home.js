load('config.js');

function execute() {
    return Response.success([
        { title: "Phim mới", input: BASE_URL + "/phim-moi", script: "gen.js" },
        { title: "Phim bộ", input: BASE_URL + "/phim-bo", script: "gen.js" },
        { title: "Phim lẻ", input: BASE_URL + "/phim-le", script: "gen.js" },
        { title: "Hoạt hình", input: BASE_URL + "/hoat-hinh", script: "gen.js" },
        { title: "Nổi bật", input: BASE_URL + "/phim-de-xuat", script: "gen.js" }
    ]);
}
