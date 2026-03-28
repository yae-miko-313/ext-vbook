load('config.js');

function execute() {
    var categories = [
        { title: "Truyện HOT", input: "truyen-hot", script: "genre.js" },
        { title: "Truyện Mới Cập Nhật", input: "truyen-moi-cap-nhat", script: "genre.js" },
        { title: "Truyện Đã Hoàn Thành", input: "truyen-full", script: "genre.js" },
        { title: "Truyện Mới Đăng", input: "truyen-moi-dang", script: "genre.js" }
    ];
    
    return Response.success(categories);
}
