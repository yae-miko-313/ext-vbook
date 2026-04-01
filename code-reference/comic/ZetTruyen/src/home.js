function execute() {
    return Response.success([
        {title: "Truyện Hoàn Thành", input: "https://www.zettruyen.africa/tim-kiem-nang-cao?genres=&status=Ho%C3%A0n%20th%C3%A0nh&type=all&sort=latest&chapterRange=all&name=", script: "gen.js"},
        {title: "Truyện Mới", input: "https://www.zettruyen.africa/tim-kiem-nang-cao", script: "gen.js"}
    ]);
}
