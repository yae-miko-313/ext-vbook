load('config.js');

function execute(url) {
    if (!url) return Response.success([]);

    var response = fetchPage(url);
    if (!response.ok) return Response.success([]);

    var html = response.text(); 
    var servers = [];
    
    // Bắt nội dung bên trong biến all_sources bằng 1 regex tối ưu
    var match = html.match(/all_sources\s*=\s*\[\s*["']([^"']+)["']/);
    if (match) {
        var streamUrl = match[1];
        var serverTitle = 'Server 1';
        
        // Trích xuất domain làm tên server
        var domainMatch = streamUrl.match(/https?:\/\/([^\/]+)/);
        if (domainMatch && domainMatch[1]) {
            var domain = domainMatch[1].replace('www.', '').split('.')[0];
            if (domain) {
                serverTitle = domain.charAt(0).toUpperCase() + domain.slice(1);
            }
        }
        
        servers.push({
            title: serverTitle,
            data: JSON.stringify({
                url: streamUrl,
                referer: url
            })
        });
    }
    
    return Response.success(servers);
}





