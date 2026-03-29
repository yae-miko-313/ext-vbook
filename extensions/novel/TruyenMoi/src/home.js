function execute() {
    return Response.success([
        {title: "Truyện Hot", input: "https://truyenmoikk.com/danh-sach/truyen-hot", script: "gen.js"},
        {title: "Truyện Full", input: "https://truyenmoiii.org/danh-sach/truyen-full", script: "gen.js"},
        {title: "Truyện Mới", input: "https://truyenmoiii.org/danh-sach/truyen-moi", script: "gen.js"},
    ]);
}
