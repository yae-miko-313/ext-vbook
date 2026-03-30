function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: "https://webnovel.vn/all/", script: "gen.js" },
        { title: "Tiên Hiệp", input: "https://webnovel.vn/tien-hiep/", script: "gen.js" },
        { title: "Ngôn Tình", input: "https://webnovel.vn/ngon-tinh/", script: "gen.js" },
        { title: "Truyện Full", input: "https://webnovel.vn/truyen-full/", script: "gen.js" },
        { title: "Sách Hay", input: "https://webnovel.vn/sach-hay/", script: "gen.js" }
    ]);
}
