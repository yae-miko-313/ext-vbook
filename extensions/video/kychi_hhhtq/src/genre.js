load('config.js');

function execute() {
    var result = [];

    var theloai = [
        { name: "Cổ Trang", url: BASE_URL + "/type/C%E1%BB%95+Trang/" },
        { name: "Hiện Đại", url: BASE_URL + "/type/Hi%E1%BB%87n+%C4%90%E1%BA%A1i/" },
        { name: "Đam Mỹ", url: BASE_URL + "/type/%C4%90am+M%E1%BB%B9/" },
        { name: "Huyền Huyễn", url: BASE_URL + "/type/Huye%CC%82%CC%80n+Huye%CC%82%CC%83n/" },
        { name: "Viễn Tưởng", url: BASE_URL + "/type/Vie%CC%82%CC%83n+Tu%CC%9Bo%CC%9B%CC%89ng/" },
        { name: "Chiếu Rạp", url: BASE_URL + "/type/Chi%E1%BA%BFu+R%E1%BA%A1p/" }
    ];

    for (var i = 0; i < theloai.length; i++) {
        result.push({
            title: "Thể loại: " + theloai[i].name,
            input: theloai[i].url,
            script: "gen.js"
        });
    }

    return Response.success(result);
}
