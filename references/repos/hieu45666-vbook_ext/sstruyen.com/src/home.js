function execute() {
    return Response.success([
        { title: "Truyện Hot", input: "https://sstruyen.com.vn/danh-sach/truyen-hot", script: "gen.js" },
        { title: "Truyện Full", input: "https://sstruyen.com.vn/danh-sach/truyen-full", script: "gen.js" }, 
        { title: "Truyện Ngôn Tình Ngắn", input: "https://sstruyen.com.vn/danh-sach/truyen-ngon-tinh-ngan", script: "gen.js" },
        { title: "Truyện Ngôn Tình Hay", input: "https://sstruyen.com.vn/danh-sach/truyen-ngon-tinh-hay", script: "gen.js" },
        { title: "Truyện Ngôn Tình 18+", input: "https://sstruyen.com.vn/danh-sach/truyen-ngon-tinh-18", script: "gen.js" },
        { title: "Truyện Ngôn Tình Hoàn", input: "https://sstruyen.com.vn/danh-sach/truyen-ngon-tinh-hoan", script: "gen.js" },
        { title: "Truyện Ngôn Tình Hài", input: "https://sstruyen.com.vn/danh-sach/truyen-ngon-tinh-hai-huoc", script: "gen.js" },
        { title: "Truyện Teen Hay", input: "https://sstruyen.com.vn/danh-sach/truyen-teen-hay", script: "gen.js" },
        { title: "Truyện Tiên Hiệp Hay", input: "https://sstruyen.com.vn/danh-sach/truyen-tien-hiep-hay", script: "gen.js" }
    ]);
}