load('config.js');
function execute(url, page) {
    if (!page) page = '1';
    let response = fetch(`${BASE_API}/query`,{
        method: 'GET',
        queries: {
            'series_type': 'Comic',
            'perPage': 12,
            'adult': true,
            'order': 'desc',
            'orderBy': url,
            'page': page
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
        if(json.meta.current_page < json.meta.last_page){
            var next = parseInt(page) + 1 + ""
        }
        return Response.success(books, next || null);
    }
    return null;
}