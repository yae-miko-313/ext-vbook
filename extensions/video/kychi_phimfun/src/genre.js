load('config.js');

function execute() {
    return Response.success([
        { title: "Thần thoại - Cổ trang", input: BASE_URL + "/the-loai/than-thoai-co-trang-1", script: "gen.js" },
        { title: "Hành động", input: BASE_URL + "/the-loai/hanh-dong-1", script: "gen.js" },
        { title: "Tâm lý", input: BASE_URL + "/the-loai/tam-ly-1", script: "gen.js" },
        { title: "Chiến tranh", input: BASE_URL + "/the-loai/chien-tranh-1", script: "gen.js" },
        { title: "Võ thuật - Kiếm hiệp", input: BASE_URL + "/the-loai/vo-thuat-kiem-hiep-1", script: "gen.js" },
        { title: "Nhạc kịch", input: BASE_URL + "/the-loai/nhac-kich-1", script: "gen.js" },
        { title: "Kinh dị", input: BASE_URL + "/the-loai/kinh-di-1", script: "gen.js" },
        { title: "Tội phạm - Hình sự", input: BASE_URL + "/the-loai/toi-pham-hinh-su-1", script: "gen.js" },
        { title: "Phiêu lưu", input: BASE_URL + "/the-loai/phieu-luu-1", script: "gen.js" },
        { title: "Hài hước", input: BASE_URL + "/the-loai/hai-huoc-1", script: "gen.js" },
        { title: "Viễn tưởng", input: BASE_URL + "/the-loai/vien-tuong-1", script: "gen.js" },
        { title: "Khoa học - Tài liệu", input: BASE_URL + "/the-loai/khoa-hoc-tai-lieu-1", script: "gen.js" },
        { title: "Hoạt hình", input: BASE_URL + "/the-loai/hoat-hinh-1", script: "gen.js" },
        { title: "Thể thao", input: BASE_URL + "/the-loai/the-thao-1", script: "gen.js" },
        { title: "Tình cảm - Lãng mạn", input: BASE_URL + "/the-loai/tinh-cam-lang-man-1", script: "gen.js" },
        { title: "Kỳ ảo", input: BASE_URL + "/the-loai/ky-ao-1", script: "gen.js" },
        { title: "Giật gân", input: BASE_URL + "/the-loai/giat-gan-1", script: "gen.js" },
        { title: "Gia đình", input: BASE_URL + "/the-loai/gia-dinh-1", script: "gen.js" },
        { title: "Bí ẩn", input: BASE_URL + "/the-loai/bi-an-1", script: "gen.js" },
        { title: "Lịch sử", input: BASE_URL + "/the-loai/lich-su-1", script: "gen.js" },
        { title: "Viễn Tây", input: BASE_URL + "/the-loai/vien-tay-1", script: "gen.js" },
        { title: "Tiểu sử", input: BASE_URL + "/the-loai/tieu-su-1", script: "gen.js" },
        { title: "GameShow", input: BASE_URL + "/the-loai/chuong-trinh-truyen-hinh-1", script: "gen.js" },
        { title: "DramaTV", input: BASE_URL + "/the-loai/dramatv-1", script: "gen.js" }
    ]);
}
