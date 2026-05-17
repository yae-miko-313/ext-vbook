load('config.js');

function execute(url) {
    var response = fetchPage(url);
    if (!response.ok) return Response.error('Failed to fetch page');

    var body = response.text();
    var nextData = extractNextData(body);
    
    // 1. Primary: Extract movie info from Next hydration payload
    var movie = extractJson(nextData, 'movie') || {};
    
    var name = cleanMovieName(movie.name);
    var cover = movie.poster_url || movie.thumb_url;
    var description = movie.description || '';
    var author = (movie.director && movie.director !== 'Đang cập nhật') ? movie.director : 'Yêu Anime';
    var status = movie.display_status || '';
    
    var genreObjects = [];
    if (movie.genres && movie.genres.length > 0) {
        movie.genres.forEach(function (g) {
            if (g.name && g.slug) {
                genreObjects.push({
                    title: g.name,
                    input: BASE_URL + '/the-loai/' + g.slug,
                    script: 'gen.js'
                });
            }
        });
    }

    // 2. Fallback to DOM parsing for missing critical fields
    if (!name || !cover || genreObjects.length === 0) {
        var doc = response.html();
        if (!name) name = cleanMovieName(cleanText(doc.select('h1').text()));
        if (!cover) cover = doc.select('img[alt="' + (name || '') + '"]').attr('src') || doc.select('img[src*="/posters/"]').attr('src');
        if (!description) description = cleanText(doc.select('p.line-clamp-3').text()) || cleanText(doc.select('.description').text());
        
        if (genreObjects.length === 0) {
            doc.select('a[href*="/the-loai/"]').forEach(function (a) {
                var gName = cleanText(a.text());
                var gHref = a.attr('href');
                if (gName && gHref) {
                    var exists = false;
                    for (var i = 0; i < genreObjects.length; i++) {
                        if (genreObjects[i].title === gName) {
                            exists = true;
                            break;
                        }
                    }
                    if (!exists) {
                        genreObjects.push({
                            title: gName,
                            input: normalizeUrl(gHref),
                            script: 'gen.js'
                        });
                    }
                }
            });
        }
    }

    // Determine Format: series vs movie
    var format = "series";
    if (movie.episode_total === 1 || 
        (movie.movie_type_id === 1) || 
        (movie.type && movie.type.name && movie.type.name.toLowerCase().indexOf("lẻ") !== -1) ||
        (status && status.toLowerCase().indexOf("trọn bộ") !== -1 && status.toLowerCase().indexOf("tập") === -1)) {
        format = "movie";
    }

    // Determine Ongoing state
    var ongoing = true;
    var statusLower = status.toLowerCase();
    if (statusLower.indexOf('hoàn thành') !== -1 || 
        statusLower.indexOf('trọn bộ') !== -1 || 
        statusLower.indexOf('full') !== -1 || 
        statusLower.indexOf('hoàn tất') !== -1 || 
        format === "movie") {
        ongoing = false;
    }

    // Construct Detail metadata block dynamically based on available data
    var detailParts = [];
    if (movie.origin_name && movie.origin_name !== movie.name) {
        detailParts.push("Tên gốc: " + movie.origin_name);
    }
    if (status && status !== 'Đang cập nhật') {
        detailParts.push("Trạng thái: " + status);
    }
    if (movie.type && movie.type.name && movie.type.name !== 'Đang cập nhật') {
        detailParts.push("Định dạng: " + movie.type.name);
    }
    if (movie.country && movie.country.name && movie.country.name !== 'Đang cập nhật') {
        detailParts.push("Quốc gia: " + movie.country.name);
    }
    if (movie.views) {
        detailParts.push("Lượt xem: " + movie.views);
    }
    if (movie.likes) {
        detailParts.push("Yêu thích: " + movie.likes);
    }
    if (movie.quality && movie.quality !== 'Đang cập nhật') {
        detailParts.push("Chất lượng: " + movie.quality);
    }
    if (movie.language && movie.language !== 'Đang cập nhật') {
        detailParts.push("Ngôn ngữ: " + movie.language);
    }
    if (genreObjects.length > 0) {
        var gNames = genreObjects.map(function(item) { return item.title; });
        detailParts.push("Thể loại: " + gNames.join(", "));
    }
    var detailText = detailParts.join("<br>");

    // Construct Rich Suggestions
    var suggests = [];
    
    // Suggest 1: Phim Hot (Views descending)
    suggests.push({
        title: "Đề cử: Phim Hot",
        input: BASE_URL + "/loc-phim?sort=views&order=desc",
        script: "gen.js"
    });

    // Suggest 2: Phim cùng thể loại (if available)
    if (genreObjects.length > 0) {
        suggests.push({
            title: "Cùng thể loại: " + genreObjects[0].title,
            input: genreObjects[0].input,
            script: "gen.js"
        });
    }

    return Response.success({
        name: name || 'Không rõ',
        cover: normalizeUrl(cover),
        author: author,
        description: description || 'Không có mô tả',
        detail: detailText,
        ongoing: ongoing,
        format: format,
        genres: genreObjects,
        suggests: suggests,
        host: BASE_URL
    });
}


