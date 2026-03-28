load('config.js');

function execute() {
    var categories = [
        { title: "Truyện HOT", input: "truyen-hot", script: "gen.js" },
        { title: "Truyện Mới Cập Nhật", input: "truyen-moi-cap-nhat", script: "gen.js" },
        { title: "Truyện Đã Hoàn Thành", input: "truyen-full", script: "gen.js" },
        { title: "Truyện Mới Đăng", input: "truyen-moi-dang", script: "gen.js" }
    ];
    
    return Response.success(categories);
}
