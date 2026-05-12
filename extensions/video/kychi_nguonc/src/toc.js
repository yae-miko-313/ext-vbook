load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    var slug = url.split('/').pop();
    var apiUrl = BASE_URL + "/api/film/" + slug;

    var response = fetch(apiUrl);
    if (response.ok) {
        var resJson = response.json();
        var movie = resJson.movie || (resJson.data && resJson.data.movie);
        if (!movie) return Response.error("Không tìm thấy dữ liệu phim");
        
        var episodesData = movie.episodes || []; 
        var list = [];

        var serversWithData = episodesData.filter(function(server) {
            return server.items && Array.isArray(server.items) && server.items.some(function(item) {
                return item.embed; // Chỉ quan tâm đến link embed
            });
        }).length;

        var hasMultipleServers = serversWithData > 1;

        if (Array.isArray(episodesData)) {
            episodesData.forEach(function(server) {
                var serverName = server.server_name || "Nguồn";
                var epItems = [];

                if (server.items && Array.isArray(server.items)) {
                    server.items.forEach(function(item) {
                        var streamUrl = item.embed; // Chỉ dùng link embed
                        if (streamUrl) {
                            var name = item.name || "";
                            var epName = name;
                            
                            if (name && !isNaN(name) && name.toLowerCase().indexOf("tập") === -1) {
                                epName = "Tập " + name;
                            }

                            epItems.push({
                                name: epName,
                                url: streamUrl,
                                host: BASE_URL
                            });
                        }
                    });
                }

                if (epItems.length > 0) {
                    if (hasMultipleServers) {
                        list.push({
                            name: serverName,
                            type: "section"
                        });
                    }
                    list = list.concat(epItems);
                }
            });
        }
        return Response.success(list);
    }
    return Response.error("Không lấy được danh sách tập phim");
}
