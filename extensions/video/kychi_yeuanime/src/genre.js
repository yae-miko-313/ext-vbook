load('config.js');

function execute() {
    var list = [];

    // Thể loại (Genres)
    var staticGenres = [
        { name: 'Hành Động', slug: 'hanh-dong' },
        { name: 'Phiêu Lưu', slug: 'phieu-luu' },
        { name: 'Cổ Trang', slug: 'co-trang' },
        { name: 'Thần Thoại', slug: 'than-thoai' },
        { name: 'Võ Thuật', slug: 'vo-thuat' },
        { name: 'Kinh Dị', slug: 'kinh-di' },
        { name: 'Hài Hước', slug: 'hai-huoc' },
        { name: 'Lãng Mạn', slug: 'lang-man' },
        { name: 'Tình Cảm', slug: 'tinh-cam' },
        { name: 'Tâm Lý', slug: 'tam-ly' },
        { name: 'Viễn Tưởng', slug: 'vien-tuong' },
        { name: 'Học Đường', slug: 'hoc-duong' },
        { name: 'Thể Thao', slug: 'the-thao' },
        { name: 'Bí Ẩn', slug: 'bi-an' },
        { name: 'Gây Cấn', slug: 'gay-can' },
        { name: 'Chính Kịch', slug: 'chinh-kich' },
        { name: 'Gia Đình', slug: 'gia-dinh' },
        { name: 'Chiến Tranh', slug: 'chien-tranh' },
        { name: 'Lịch Sử', slug: 'lich-su' },
        { name: 'Khoa Học', slug: 'khoa-hoc' },
        { name: 'Khoa Học Viễn Tưởng', slug: 'khoa-hoc-vien-tuong' },
        { name: 'Kinh Điển', slug: 'kinh-dien' },
        { name: 'Miền Tây', slug: 'mien-tay' },
        { name: 'Phim Hài', slug: 'phim-hai' },
        { name: 'Phim Ngắn', slug: 'phim-ngan' },
        { name: 'Tài Liệu', slug: 'tai-lieu' },
        { name: 'Trẻ Em', slug: 'tre-em' },
        { name: 'Hoạt Hình', slug: 'hoat-hinh' }
    ];
    staticGenres.forEach(function (g) {
        list.push({
            title: '[Thể Loại] ' + g.name,
            input: BASE_URL + '/the-loai/' + g.slug,
            script: 'gen.js'
        });
    });

    // Quốc gia (Countries)
    var staticCountries = [
        { name: 'Nhật Bản', slug: 'nhat-ban' },
        { name: 'Trung Quốc', slug: 'trung-quoc' },
        { name: 'Âu Mỹ', slug: 'au-my' },
        { name: 'Quốc Gia Khác', slug: 'quoc-gia-khac' }
    ];
    staticCountries.forEach(function (c) {
        list.push({
            title: '[Quốc Gia] ' + c.name,
            input: BASE_URL + '/quoc-gia/' + c.slug,
            script: 'gen.js'
        });
    });

    // Chủ đề (Topics)
    var staticTopics = [
        { name: 'Black Clover', slug: 'black-clover' },
        { name: 'Bleach', slug: 'bleach' },
        { name: 'Demon Slayer', slug: 'demon-slayer' },
        { name: 'Dragon Ball', slug: 'dragon-ball' },
        { name: 'Naruto', slug: 'naruto' },
        { name: 'One Piece', slug: 'one-piece' },
        { name: 'Pokemon', slug: 'pokemon' }
    ];
    staticTopics.forEach(function (t) {
        list.push({
            title: '[Chủ Đề] ' + t.name,
            input: BASE_URL + '/chu-de/' + t.slug,
            script: 'gen.js'
        });
    });

    return Response.success(list);
}

