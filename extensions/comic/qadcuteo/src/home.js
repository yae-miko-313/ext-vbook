function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: "/", script: "gen.js" },
        { title: "Đang Hot", input: "/?m_orderby=trending", script: "gen.js" },
        { title: "Nhiều Người Đọc", input: "/?m_orderby=views", script: "gen.js" },
        { title: "Mới Đăng", input: "/?m_orderby=new-manga", script: "gen.js" },
        { title: "Đánh Giá Cao", input: "/?m_orderby=rating", script: "gen.js" },
        { title: "Đã Hoàn Thành", input: "/da-hoan-thanh/", script: "gen.js" }
    ]);
}