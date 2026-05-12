function execute(url) {
    // url có thể là slug hoặc link full
    var slug = url.split('/').pop().replace('.html', '');
    var response = fetch("https://ophim1.com/v1/api/phim/" + slug);
    if (response.ok) {
        var resJson = response.json();
        if (!resJson || !resJson.data || !resJson.data.item) return null;
        var movie = resJson.data.item;
        
        var tags = [];
        if (movie.category) {
            movie.category.forEach(function(c) {
                tags.push(c.name);
            });
        }
        if (movie.country) {
            movie.country.forEach(function(c) {
                tags.push(c.name);
            });
        }

        var detailText = "";
        detailText += "Tên gốc: " + movie.origin_name + "<br>";
        detailText += "Trạng thái: " + movie.episode_current + " / " + movie.episode_total + "<br>";
        detailText += "Chất lượng: " + movie.quality + " " + movie.lang + "<br>";
        detailText += "Năm: " + movie.year + "<br>";
        detailText += "Thời lượng: " + movie.time + "<br>";
        if (movie.actor && movie.actor.length > 0) {
            detailText += "Diễn viên: " + movie.actor.join(", ") + "<br>";
        }
        if (movie.director && movie.director.length > 0) {
            detailText += "Đạo diễn: " + movie.director.join(", ") + "<br>";
        }
        if (tags.length > 0) {
            detailText += "Thể loại: " + tags.join(", ");
        }

        return Response.success({
            name: movie.name,
            cover: movie.thumb_url.indexOf('http') === 0 ? movie.thumb_url : "https://img.ophim.live/uploads/movies/" + movie.thumb_url,
            author: (movie.director && movie.director.length > 0 && movie.director[0] !== "") ? movie.director.join(", ") : "Đang cập nhật",
            description: movie.content ? movie.content.replace(/<[^>]*>/g, '') : "",
            detail: detailText,
            ongoing: movie.status !== "completed",
            format: (movie.type === "series" || (movie.episode_total && parseInt(movie.episode_total) > 1)) ? "series" : "movie",
            host: "https://ophim17.cc"
        });
    }
    return null;
}
