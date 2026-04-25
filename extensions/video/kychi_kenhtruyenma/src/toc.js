load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    
    var response = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": BASE_URL + "/"
        }
    });
    
    if (!response.ok) return Response.success([]);
    
    var html = response.text();
    var audioList = parseAudioList(html);
    
    // Giữ lại logic sắp xếp A-Z vì nó hữu ích
    audioList.sort(function(a, b) {
        var getNumber = function(s) {
            var m = s.match(/\d+/);
            return m ? parseInt(m[0], 10) : 0;
        };
        return getNumber(a.title) - getNumber(b.title);
    });

    var chapters = [];
    for (var i = 0; i < audioList.length; i++) {
        var item = audioList[i];
        chapters.push({
            name: item.title,
            url: item.mp3,
            host: BASE_URL
        });
    }
    
    return Response.success(chapters);
}
