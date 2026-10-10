function execute(url) {
    if (!url) return Response.error("Link trống");
    
    return Response.success([
        {
            title: "Embed Player",
            data: url
        }
    ]);
}
