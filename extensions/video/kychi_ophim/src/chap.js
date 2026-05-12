function execute(url) {
    if (!url) return Response.error("Link trống");
    
    var servers = [];
    
    // Nếu là link m3u8 thì ưu tiên hiện HLS
    if (url.indexOf(".m3u8") !== -1) {
        servers.push({ title: "HLS Server", data: url });
    } else {
        servers.push({ title: "Embed Player", data: url });
    }
    
    return Response.success(servers);
}
