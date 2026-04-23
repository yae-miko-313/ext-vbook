load('config.js');

// CHAP — Server Picker
// Input: URL tập phim /xem/{id}-sv{n}-ep{n}/
function execute(url) {
    // Handle undefined/null/empty input
    if (!url) {
        return Response.success([{ title: "Server 1", data: BASE_URL }]);
    }
    
    // Handle array input (test tool sends array)
    if (typeof url !== 'string') {
        if (url.length > 0) {
            url = url[0];
        } else {
            return Response.success([{ title: "Server 1", data: BASE_URL }]);
        }
    }
    
    url = normalizeUrl(url);

    // Parse movie ID và episode từ URL /xem/{id}-sv{n}-ep{m}/
    var urlMatch = url.match(/\/xem\/(\d+)-sv(\d+)-ep(\d+)/);
    if (!urlMatch) {
        // Không match pattern, trả về URL gốc
        return Response.success([{ title: "Server 1", data: url }]);
    }
    
    var movieId = urlMatch[1];
    var currentSv = urlMatch[2];
    var currentEp = urlMatch[3];

    // Fetch trang DETAIL để tìm các server có sẵn
    var detailUrl = BASE_URL + "/phim/" + movieId + "/";
    var response = fetch(detailUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": BASE_URL + "/"
        }
    });

    var tracks = [];
    var serverNumbers = [];

    if (response.ok) {
        var doc = response.html();
        if (doc) {
            // Tìm tất cả links có pattern server trong trang detail
            var links = doc.select("a[href*='/xem/']");
            links.forEach(function(a) {
                var href = a.attr("href") || "";
                var svMatch = href.match(/-sv(\d+)-/);
                if (svMatch) {
                    var svNum = parseInt(svMatch[1], 10);
                    if (serverNumbers.indexOf(svNum) < 0) {
                        serverNumbers.push(svNum);
                    }
                }
            });
        }
    }

    // Sắp xếp server numbers
    serverNumbers.sort(function(a, b) { return a - b; });

    // Nếu không tìm thấy server nào, chỉ trả về server hiện tại
    if (serverNumbers.length === 0) {
        serverNumbers.push(parseInt(currentSv, 10));
    }

    // Tạo track cho mỗi server với cùng episode
    for (var i = 0; i < serverNumbers.length; i++) {
        var svNum = serverNumbers[i];
        var svKey = "Server " + svNum;
        var newUrl = BASE_URL + "/xem/" + movieId + "-sv" + svNum + "-ep" + currentEp + "/";
        tracks.push({ title: svKey, data: newUrl });
    }

    return Response.success(tracks);
}

