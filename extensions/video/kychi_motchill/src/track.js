load('config.js');

function execute(input) {
    var data = input;
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch (e) {
            data = { episodeUrl: input };
        }
    }

    var post = data.post;
    var nume = data.nume;
    var type = data.type || 'tv';
    var referer = data.episodeUrl || BASE_URL;

    if (post && nume) {
        var response = fetch(BASE_URL + '/wp-admin/admin-ajax.php', {
            method: 'POST',
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": referer,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            body: 'action=doo_player_ajax&post=' + post + '&nume=' + nume + '&type=' + type
        });

        if (response.ok) {
            var text = response.text();
            var streamUrl = "";
            
            // Extract iframe src (standard DooPlay response)
            var m = text.match(/src=["']([^"']+)["']/i);
            if (m) {
                streamUrl = m[1];
            } else {
                // Fallback: search for any URL in the response
                m = text.match(/https?:\/\/[^"'\s<>]+/i);
                if (m) streamUrl = m[0];
            }

            if (streamUrl) {
                return Response.success({
                    data: normalizeUrl(streamUrl),
                    type: "auto",
                    headers: { 
                        "Referer": referer,
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    },
                    host: BASE_URL
                });
            }
        }
    }

    // Fallback: if we only have episodeUrl, return it as iframe
    if (data.episodeUrl) {
        return Response.success({
            data: normalizeUrl(data.episodeUrl),
            type: "auto",//dùng auto cho embed nếu dùng iframe thì vbook khong phát đc
            headers: { "Referer": BASE_URL },
            host: BASE_URL
        });
    }

    return Response.error("Không tìm thấy link phát");
}



