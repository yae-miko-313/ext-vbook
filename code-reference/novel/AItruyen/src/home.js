function execute() {
    return Response.success([
        {title: "Mới cập nhật", input:  "https://aitruyen.net/bang-xep-hang?type=cap-nhat", script: "gen.js"},
        {title: "Thịnh hành", input:  "https://aitruyen.net/bang-xep-hang?type=thinh-hanh", script: "gen.js"},
        {title: "Đề cử", input:  "https://aitruyen.net/bang-xep-hang?type=de-cu", script: "gen.js"},
        {title: "Đánh giá", input:  "https://aitruyen.net/bang-xep-hang?type=danh-gia", script: "gen.js"},
        {title: "Mới", input:  "https://aitruyen.net/bang-xep-hang?type=tan-binh", script: "gen.js"},
    ]);
}