load('config.js');

function execute(url) {
    var response = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    });

    if (response.ok) {
        var doc = response.html();
        var iframe = doc.select("#iframeStream").attr("src");
        
        if (iframe) {
            return Response.success({
                data: iframe,
                type: "auto",// đối với các link embed mặc định dùng auto, không iframe
                headers: {
                    "Referer": BASE_URL + "/"
                }
            });
        }
    }

    return null;
}
