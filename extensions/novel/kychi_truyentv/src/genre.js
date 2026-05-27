load('config.js');
function execute() {
    return Response.success([
        { title: "Ngôn Tình", input: BASE_URL + "/the-loai/ngon-tinh.html", script: "gen.js" },
        { title: "Đồng Nhân", input: BASE_URL + "/the-loai/dong-nhan.html", script: "gen.js" },
        { title: "Đô Thị", input: BASE_URL + "/the-loai/do-thi.html", script: "gen.js" },
        { title: "Đam Mỹ", input: BASE_URL + "/the-loai/dam-my.html", script: "gen.js" },
        { title: "Huyền Huyễn", input: BASE_URL + "/the-loai/huyen-huyen.html", script: "gen.js" },
        { title: "Tiên Hiệp", input: BASE_URL + "/the-loai/tien-hiep.html", script: "gen.js" },
        { title: "Trọng Sinh", input: BASE_URL + "/the-loai/trong-sinh.html", script: "gen.js" },
        { title: "Hệ Thống", input: BASE_URL + "/the-loai/he-thong.html", script: "gen.js" },
        { title: "Sắc Hiệp", input: BASE_URL + "/the-loai/sac-hiep.html", script: "gen.js" },
        { title: "Xuyên Không", input: BASE_URL + "/the-loai/xuyen-khong.html", script: "gen.js" },
        { title: "Mạt Thế", input: BASE_URL + "/the-loai/mat-the.html", script: "gen.js" },
        { title: "Cổ Đại", input: BASE_URL + "/the-loai/co-dai.html", script: "gen.js" },
        { title: "Quân Sự", input: BASE_URL + "/the-loai/quan-su.html", script: "gen.js" },
        { title: "Convert", input: BASE_URL + "/the-loai/convert.html", script: "gen.js" },
        { title: "Ngược", input: BASE_URL + "/the-loai/nguoc.html", script: "gen.js" }
    ]);
}
