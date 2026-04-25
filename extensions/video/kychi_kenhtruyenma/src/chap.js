load('config.js');

function execute(url) {
    if (typeof url !== "string") url = "";
    
    url = normalizeUrl(url);
    
    var data = [];
    if (url) {
        data.push({
            title: "Máy chủ Audio 1",
            data: url
        });
    }
    
    return Response.success(data);
}
