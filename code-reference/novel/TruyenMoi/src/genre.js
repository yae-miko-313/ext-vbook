function execute() {
    var data = [];
    var genres = [
        { title: "Tổng Tài", input: "tong-tai" },
        { title: "Kỳ Ảo", input: "ky-ao" },
        { title: "Cạnh Kỹ", input: "canh-ky" },
        { title: "Huyền Nghi", input: "huyen-nghi" },
        { title: "Dã Sử", input: "da-su" },
        { title: "FanFic", input: "fanfic" },
        { title: "Đồng Nhân", input: "dong-nhan" },
        { title: "Truyện Audio", input: "truyen-audio" },
        { title: "Thám Hiểm", input: "tham-hiem" },
        { title: "Quan Trường", input: "quan-truong" },
        { title: "Bách Hợp", input: "bach-hop" },
        { title: "Quân Sự", input: "quan-su" },
        { title: "Phương Tây", input: "phuong-tay" },
        { title: "Việt Nam", input: "viet-nam" },
        { title: "Đoản Văn", input: "doan-van" },
        { title: "Cung Đấu", input: "cung-dau" },
        { title: "Đông Phương", input: "dong-phuong" },
        { title: "Linh Dị", input: "linh-di" },
        { title: "Điền Văn", input: "dien-van" },
        { title: "Gia Đấu", input: "gia-dau" },
        { title: "Trọng Sinh", input: "trong-sinh" },
        { title: "Ngược", input: "nguoc" },
        { title: "Khác", input: "khac" },
        { title: "Võng Du", input: "vong-du" },
        { title: "Hệ Thống", input: "he-thong" },
        { title: "Xuyên Nhanh", input: "xuyen-nhanh" },
        { title: "Nữ Phụ", input: "nu-phu" },
        { title: "Hài Hước", input: "hai-huoc" },
        { title: "Nữ Cường", input: "nu-cường" },
        { title: "Lịch Sử", input: "lich-su" },
        { title: "Light Novel", input: "light-novel" },
        { title: "Dị Năng", input: "di-nang" },
        { title: "Khoa Huyễn", input: "khoa-huyen" },
        { title: "Sủng", input: "sung" },
        { title: "Mạt Thế", input: "mat-the" },
        { title: "Đam Mỹ", input: "dam-my" },
        { title: "Đô Thị", input: "do-thi" },
        { title: "Sắc", input: "sac" },
        { title: "Cổ Đại", input: "co-dai" },
        { title: "Dị Giới", input: "di-gioi" },
        { title: "Huyền Huyễn", input: "huyen-huyen" },
        { title: "Xuyên Không", input: "xuyen-khong" },
        { title: "Truyện Teen", input: "truyen-teen" },
        { title: "Tiên Hiệp", input: "tien-hiep" },
        { title: "Ngôn Tình", input: "ngon-tinh" },
        { title: "Tiểu Thuyết", input: "tieu-thuyet" },
        { title: "Trinh Thám", input: "trinh-tham" },
        { title: "Kiếm Hiệp", input: "kiem-hiep" }
    ];

    for (var i = 0; i < genres.length; i++) {
        data.push({
            title: genres[i].title,
            input: "https://truyenmoikk.com/the-loai/" + genres[i].input,
            script: "gen.js"
        });
    }

    return Response.success(data);
}