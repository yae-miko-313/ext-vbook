function execute() {
    var data = [];
    var genres = [
        // Website nguồn
        { title: "NetTruyen", input: "website/nettruyen" },
        { title: "TruyenQQ", input: "website/truyenqq" },
        { title: "Toptruyen", input: "website/toptruyen" },
        { title: "Mangatool", input: "website/mangatool" },
        { title: "CManga", input: "website/cmanga" },
        { title: "Team Lạnh Lùng", input: "website/teamlanhlung" },
        { title: "Cứu Truyện", input: "website/cuuctruyen" },
        { title: "Lazyteam", input: "website/lazyteam" },
        { title: "Blogtruyen", input: "website/blogtruyen" },
        { title: "Yuri Garden", input: "website/yurigarden" },
        { title: "Mọt truyện", input: "website/mottruyen" },
        { title: "BaoTangTruyen", input: "website/baotangtruyen" },
        { title: "Manhuavn", input: "website/manhuavn" },

        // Thể loại truyện
        { title: "Action", input: "the-loai/action" },
        { title: "Adventure", input: "the-loai/adventure" },
        { title: "Anime", input: "the-loai/anime" },
        { title: "Chuyển Sinh", input: "the-loai/chuyen-sinh" },
        { title: "Cổ Đại", input: "the-loai/co-dai" },
        { title: "Comedy", input: "the-loai/comedy" },
        { title: "Comic", input: "the-loai/comic" },
        { title: "Cooking", input: "the-loai/cooking" },
        { title: "Doujinshi", input: "the-loai/doujinshi" },
        { title: "Drama", input: "the-loai/drama" },
        { title: "Fantasy", input: "the-loai/fantasy" },
        { title: "Gender Bender", input: "the-loai/gender-bender" },
        { title: "Historical", input: "the-loai/historical" },
        { title: "Horror", input: "the-loai/horror" },
        { title: "Live action", input: "the-loai/live-action" },
        { title: "Manga", input: "the-loai/manga" },
        { title: "Manhua", input: "the-loai/manhua" },
        { title: "Manhwa", input: "the-loai/manhwa" },
        { title: "Martial Arts", input: "the-loai/martial-arts" },
        { title: "Mecha", input: "the-loai/mecha" },
        { title: "Mystery", input: "the-loai/mystery" },
        { title: "Ngôn Tình", input: "the-loai/ngon-tinh" },
        { title: "Psychological", input: "the-loai/psychological" },
        { title: "Romance", input: "the-loai/romance" },
        { title: "School Life", input: "the-loai/school-life" },
        { title: "Sci-fi", input: "the-loai/sci-fi" },
        { title: "Shoujo", input: "the-loai/shoujo" },
        { title: "Shoujo Ai", input: "the-loai/shoujo-ai" },
        { title: "Shounen", input: "the-loai/shounen" },
        { title: "Shounen Ai", input: "the-loai/shounen-ai" },
        { title: "Slice of Life", input: "the-loai/slice-of-life" },
        { title: "Sports", input: "the-loai/sports" },
        { title: "Supernatural", input: "the-loai/supernatural" },
        { title: "Thiếu Nhi", input: "the-loai/thieu-nhi" },
        { title: "Tragedy", input: "the-loai/tragedy" },
        { title: "Trinh Thám", input: "the-loai/trinh-tham" },
        { title: "Truyện Màu", input: "the-loai/truyen-mau" },
        { title: "Truyện scan", input: "the-loai/truyen-scan" },
        { title: "Tu Tiên", input: "the-loai/tu-tien" },
        { title: "Webtoon", input: "the-loai/webtoon" },
        { title: "Xuyên Không", input: "the-loai/xuyen-khong" },
        { title: "Đam Mỹ", input: "the-loai/dam-my" }
    ];

    for (var i = 0; i < genres.length; i++) {
        data.push({
            title: genres[i].title,
            input: "https://www.zettruyen.africa/" + genres[i].input,
            script: "gen.js"
        });
    }

    return Response.success(data);
}