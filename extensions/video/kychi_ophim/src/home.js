function execute() {
    return Response.success([
        { title: "Phim mới cập nhật", input: "https://ophim1.com/danh-sach/phim-moi-cap-nhat", script: "gen.js" },
        { title: "Phim lẻ", input: "https://ophim1.com/v1/api/danh-sach/phim-le", script: "gen.js" },
        { title: "Phim bộ", input: "https://ophim1.com/v1/api/danh-sach/phim-bo", script: "gen.js" },
        { title: "Hoạt hình", input: "https://ophim1.com/v1/api/danh-sach/hoat-hinh", script: "gen.js" },
        { title: "TV Shows", input: "https://ophim1.com/v1/api/danh-sach/tv-shows", script: "gen.js" },
    ]);
}
