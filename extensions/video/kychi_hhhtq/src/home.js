load('config.js');

function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: BASE_URL + "/show/1-----------/", script: "update.js" },
        { title: "Cổ Trang", input: BASE_URL + "/type/C%E1%BB%95+Trang/", script: "gen.js" },
        { title: "Hiện Đại", input: BASE_URL + "/type/Hi%E1%BB%87n+%C4%90%E1%BA%A1i/", script: "gen.js" },
        { title: "Đam Mỹ", input: BASE_URL + "/type/%C4%90am+M%E1%BB%B9/", script: "gen.js" },
        { title: "Huyền Huyễn", input: BASE_URL + "/type/Huye%CC%82%CC%80n+Huye%CC%82%CC%83n/", script: "gen.js" },
        { title: "Viễn Tưởng", input: BASE_URL + "/type/Vie%CC%82%CC%83n+Tu%CC%9Bo%CC%9B%CC%89ng/", script: "gen.js" },
        { title: "Chiếu Rạp", input: BASE_URL + "/type/Chi%E1%BA%BFu+R%E1%BA%A1p/", script: "gen.js" }
    ]);
}
