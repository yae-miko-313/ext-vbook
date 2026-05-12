function execute(url, page) {
    if (!page) page = '1';
    var response = fetch(url + "?page=" + page);
    if (response.ok) {
        var resJson = response.json();
        var data = [];
        var list = resJson.items || (resJson.data && resJson.data.items);
        var domain = resJson.pathImage || (resJson.data && resJson.data.params && resJson.data.params.cdnDataRoot) || "https://img.ophim.live/uploads/movies/";

        if (list) {
            list.forEach(function (node) {
                var description = node.year;
                if (node.episode_current) {
                    description += " • " + node.episode_current;
                }
                if (node.quality && node.lang) {
                    description += " • " + node.quality + " " + node.lang;
                }
                
                data.push({
                    name: node.name,
                    link: "https://ophim17.cc/phim/" + node.slug,
                    cover: node.thumb_url.indexOf('http') === 0 ? node.thumb_url : domain + node.thumb_url,
                    description: description,
                    host: "https://ophim17.cc"
                });
            });
            
            var pagination = resJson.pagination || (resJson.data && resJson.data.params && resJson.data.params.pagination);
            var next = null;
            if (pagination) {
                var currentPage = parseInt(pagination.currentPage);
                var totalPages = parseInt(pagination.totalPages || pagination.totalItems / pagination.totalItemsPerPage);
                if (currentPage < totalPages) {
                    next = (currentPage + 1).toString();
                }
            }
            
            return Response.success(data, next);
        }
    }
    return null;
}
