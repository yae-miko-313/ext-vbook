load('config.js');

function execute() {
    return Response.success([
        {title: "Cập Nhật", input: 'status=all&sort=latest', script: "gen.js"},
        {title: "Xem Nhiều", input: 'status=all&sort=rating', script: "gen.js"},
        {title: "Theo Dõi", input: 'status=all&sort=bookmark', script: "gen.js"},
        {title: "Hoàn Thành", input: 'status=completed&sort=latest', script: "gen.js"},
    ]);
}