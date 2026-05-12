function execute(key, page) {
    if (!page) page = '1';
    var response = fetch("https://ophim1.com/v1/api/tim-kiem", {
        queries: {
            keyword: key,
            page: page
        }
    });
    
    if (response.ok) {
        var resJson = response.json();
        var data = [];
        var list = resJson.data.items;
        var domain = resJson.data.params.cdnDataRoot;

        list.forEach(function (node) {
            data.push({
                name: node.name,
                link: "https://ophim17.cc/phim/" + node.slug,
                cover: node.thumb_url.indexOf('http') === 0 ? node.thumb_url : domain + node.thumb_url,
                description: node.year,
                host: "https://ophim17.cc"
            });
        });
        
        var pagination = resJson.data.params.pagination;
        var next = null;
        if (pagination) {
            var currentPage = parseInt(pagination.currentPage);
            var totalPages = Math.ceil(pagination.totalItems / pagination.totalItemsPerPage);
            if (currentPage < totalPages) {
                next = (currentPage + 1).toString();
            }
        }
        
        return Response.success(data, next);
    }
    return null;
}
