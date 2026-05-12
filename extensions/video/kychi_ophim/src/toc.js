function execute(url) {
    var slug = url.split('/').pop().replace('.html', '');
    var response = fetch("https://ophim1.com/v1/api/phim/" + slug);
    if (response.ok) {
        var resJson = response.json();
        var episodes = resJson.data.item.episodes;
        var data = [];
        
        if (episodes) {
            episodes.forEach(function (server) {
                // Thêm section theo Server (Vietsub/Thuyết Minh)
                data.push({ name: server.server_name, type: "section" });
                
                server.server_data.forEach(function (ep) {
                    var displayName = ep.name;
                    if (displayName.toLowerCase().indexOf("tập") === -1) {
                        displayName = "Tập " + displayName;
                    }
                    data.push({
                        name: displayName,
                        url: ep.link_m3u8 || ep.link_embed
                    });
                });
            });
        }
        
        return Response.success(data);
    }
    return null;
}
