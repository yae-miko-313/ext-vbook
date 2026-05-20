load('config.js');

function execute() {
    return Response.success([
        {
            title: 'Truyện Hot Tháng Này',
            input: BASE_URL,
            script: 'gen.js'
        },
        {
            title: 'Truyện Mới Cập Nhật',
            input: BASE_URL + '/truyen-moi.html',
            script: 'gen.js'
        },
        {
            title: 'Truyện Hoàn Thành',
            input: BASE_URL + '/truyen-hoan-thanh.html',
            script: 'gen.js'
        }
    ]);
}