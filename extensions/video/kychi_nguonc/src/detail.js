load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    var slug = url.split('/').pop();
    var apiUrl = BASE_URL + "/api/film/" + slug;

    var response = fetch(apiUrl);
    if (response.ok) {
        var resJson = response.json();
        var movie = resJson.movie || (resJson.data && resJson.data.movie);
        if (movie) {
            var suggests = [];
            var infoText = "";
            infoText += "Tên gốc: " + (movie.original_name || movie.origin_name) + "<br>";
            infoText += "Trạng thái: " + (movie.current_episode || "Đang cập nhật") + " / " + (movie.total_episodes || "??") + "<br>";
            infoText += "Chất lượng: " + (movie.quality || "") + " " + (movie.language || "") + "<br>";
            if (movie.time && movie.time !== "null") infoText += "Thời lượng: " + movie.time + "<br>";
            if (movie.director && movie.director !== "N/A") infoText += "Đạo diễn: " + movie.director + "<br>";
            if (movie.casts && movie.casts !== "N/A") infoText += "Diễn viên: " + movie.casts + "<br>";

            if (movie.category) {
                var categories = movie.category;
                // Group 1: Định dạng
                if (categories["1"] && categories["1"].list) {
                    var formats = categories["1"].list.map(function(item) { return item.name; });
                    if (formats.length > 0) infoText += "Định dạng: " + formats.join(", ") + "<br>";
                }
                // Group 2: Thể loại
                if (categories["2"] && categories["2"].list) {
                    var genresList = categories["2"].list;
                    var genres = genresList.map(function(item) { return item.name; });
                    if (genres.length > 0) {
                        infoText += "Thể loại: " + genres.join(", ") + "<br>";
                        // Suggest theo thể loại đầu tiên
                        var firstGenre = genresList[0];
                        var genreSlug = firstGenre.slug || firstGenre.id;
                        if (genreSlug) {
                            suggests.push({
                                title: "Cùng thể loại: " + firstGenre.name,
                                input: BASE_URL + "/api/films/the-loai/" + genreSlug,
                                script: "gen.js"
                            });
                        }
                    }
                }
                // Group 3: Năm
                if (categories["3"] && categories["3"].list) {
                    var yearsList = categories["3"].list;
                    var years = yearsList.map(function(item) { return item.name; });
                    if (years.length > 0) {
                        infoText += "Năm: " + years.join(", ") + "<br>";
                        var yearName = yearsList[0].name;
                        suggests.push({
                            title: "Phim cùng năm " + yearName,
                            input: BASE_URL + "/api/films/nam-phat-hanh/" + yearName,
                            script: "gen.js"
                        });
                    }
                }
                // Group 4: Quốc gia
                if (categories["4"] && categories["4"].list) {
                    var countriesList = categories["4"].list;
                    var countries = countriesList.map(function(item) { return item.name; });
                    if (countries.length > 0) {
                        infoText += "Quốc gia: " + countries.join(", ") + "<br>";
                        var countrySlug = countriesList[0].slug;
                        suggests.push({
                            title: "Phim cùng quốc gia: " + countriesList[0].name,
                            input: BASE_URL + "/api/films/quoc-gia/" + countrySlug,
                            script: "gen.js"
                        });
                    }
                }
            }

            var ongoing = true;
            var status = (movie.status || "").toLowerCase();
            if (status === "completed" || status === "hoanthanh" || status === "hoàn thành") {
                ongoing = false;
            }

            var format = "movie";
            if (movie.total_episodes && (parseInt(movie.total_episodes) > 1 || isNaN(parseInt(movie.total_episodes)))) {
                format = "series";
            }

            return Response.success({
                name: movie.name,
                cover: movie.thumb_url || movie.poster_url,
                author: (movie.director && movie.director !== "N/A") ? movie.director : "Đang cập nhật",
                description: movie.description ? movie.description.replace(/<[^>]*>/g, '') : "",
                detail: infoText,
                ongoing: ongoing,
                format: format,
                suggests: suggests,
                host: "https://phim.nguonc.com"
            });
        }
    }
    return Response.error("Không tìm thấy thông tin phim");
}
