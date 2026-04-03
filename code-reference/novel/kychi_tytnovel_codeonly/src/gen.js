load('config.js');
function execute(url, page) {
    if (!page) page = '0';
    let result = apiFetch('stories/list', {
        offset: page,
        limit: 36,
        sort: url
    });
    if (result.ok) {
        let json = result.response.json();
        let books = [];
        json.data.forEach(item => {
            books.push({
                name: item.title,
                link: BASE_URL + '/truyen/' + item.id,
                cover: item.cover,
                description: item.author + ', ' + item.chapter_count + ' chương',
            });
        });

        return Response.success(books, parseInt(page) + 36 + "");
    }
    return errorFromApiResult('Tai danh sach truyen', result);
}