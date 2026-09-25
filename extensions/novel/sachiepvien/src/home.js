function execute() {
    return Response.success([
        { title: "Convert thô", input: "/brand/convert-tho/", script: "search.js" },
        { title: "Đề cử", input: "/category/de-cu/", script: "search.js" },
        { title: "Sáng tác", input: "/brand/truyen-sang-tac/", script: "search.js" },
        { title: "Dịch / Edit", input: "/brand/truyen-dich-edit/", script: "search.js" },
        { title: "Lẩu thập cẩm", input: "/brand/lau-thap-cam/", script: "search.js" }
    ]);
}
