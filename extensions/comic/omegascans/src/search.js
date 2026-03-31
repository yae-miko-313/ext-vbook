load('config.js');
function execute(key, page) {
    if (!page) page = '1';
    let response = fetch(`${BASE_API}/query`,{
        method: 'GET',
        queries: {
            'adult': true,
            'query_string': key,
        }
    });
    if (response.ok) {
        let json = response.json();
        let books = [];
        json.data.forEach(item => {
            books.push({
                name: item.title,
                link: BASE_URL + '/series/' + item.series_slug,
                cover: item.thumbnail,
                description: item.series_type + ', ' + item.meta.chapters_count + ' chương',
            });
        });
        return Response.success(books);
    }
    return null;
}