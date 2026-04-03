load("config.js");
function execute(url) {
    let sid = normalizeStoryId(url);
    if (!sid) {
        return Response.error('Invalid story id');
    }
    let result = apiFetch(`stories/${sid}/detail`);
    if (result.ok) {
        let json = result.response.json().data;
        let genres = [];
        json.genre.forEach(e => {
            genres.push({
                title: e,
                input: e,
                script: "source.js"
            });
        });
        return Response.success({
            name: json.title,
            cover: json.cover,
            author: json.author,
            description: json.desc,
            genres: genres,
            detail: json.star + " đánh giá<br>" + json.chapter_count + " chương" + "<br>" + json.view_count + " đọc",
            ongoing: json.full === false
        });
    }
    return errorFromApiResult('Tai chi tiet truyen', result);
}
