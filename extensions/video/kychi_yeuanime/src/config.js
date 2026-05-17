var BASE_URL = 'https://yeuanime.net';

function fetchPage(url, headers) {
    var defaultHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': BASE_URL + '/'
    };
    if (headers) {
        for (var key in headers) {
            defaultHeaders[key] = headers[key];
        }
    }
    return fetch(url, { headers: defaultHeaders });
}

function normalizeUrl(url) {
    if (!url) return '';
    if (url.indexOf('http') === 0) return url;
    if (url.indexOf('//') === 0) return 'https:' + url;
    if (url.indexOf('/') === 0) return BASE_URL + url;
    return BASE_URL + '/' + url;
}

function cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
}

function cleanMovieName(name) {
    if (!name) return '';
    return name.toString().trim().replace(/^.*?Xem chi tiết phim\s+/i, '').trim();
}

function extractNextData(html) {
    var regex = /self\.__next_f\.push\(\[1,"(.*?)"\]\)/g;
    var match;
    var fullData = '';
    while ((match = regex.exec(html)) !== null) {
        fullData += match[1];
    }
    // Deep unescape: handle backslashes, quotes, slashes, and unicode.
    // DO NOT unescape \n, \r, \t as it causes JSON.parse syntax errors on newlines inside strings.
    return fullData.replace(/\\"/g, '"')
                   .replace(/\\\//g, '/')
                   .replace(/\\\\/g, '\\')
                   .replace(/\\u0022/g, '"')
                   .replace(/\\u([0-9a-fA-F]{4})/g, function (match, grp) {
                       return String.fromCharCode(parseInt(grp, 16));
                   });
}

function extractJson(text, key) {
    if (!text) return null;
    var searchStr = '"' + key + '":';
    var start = text.indexOf(searchStr);
    if (start === -1) return null;
    
    start += searchStr.length;
    var count = 0;
    var end = -1;
    var foundStart = false;
    for (var i = start; i < text.length; i++) {
        var c = text.charAt(i);
        if (c === '{' || c === '[') {
            count++;
            foundStart = true;
        } else if (c === '}' || c === ']') {
            count--;
        }
        if (foundStart && count === 0) {
            end = i + 1;
            break;
        }
    }
    if (end !== -1) {
        try {
            var jsonStr = text.substring(start, end);
            return JSON.parse(jsonStr);
        } catch (e) {}
    }
    return null;
}

function extractJsonAll(text, key) {
    var resultList = [];
    if (!text) return resultList;
    var searchStr = '"' + key + '":';
    var start = 0;
    while ((start = text.indexOf(searchStr, start)) !== -1) {
        var pStart = start + searchStr.length;
        var count = 0;
        var end = -1;
        var foundStart = false;
        for (var i = pStart; i < text.length; i++) {
            var c = text.charAt(i);
            if (c === '{' || c === '[') {
                count++;
                foundStart = true;
            } else if (c === '}' || c === ']') {
                count--;
            }
            if (foundStart && count === 0) {
                end = i + 1;
                break;
            }
        }
        if (end !== -1) {
            try {
                var jsonStr = text.substring(pStart, end);
                var parsed = JSON.parse(jsonStr);
                if (Array.isArray(parsed)) {
                    resultList = resultList.concat(parsed);
                } else if (parsed && typeof parsed === 'object') {
                    resultList.push(parsed);
                }
            } catch (e) {}
        }
        start += searchStr.length;
    }
    return resultList;
}

function parseMovies(nextData) {
    var list = [];
    
    var movies = extractJsonAll(nextData, 'movies');
    movies.forEach(function (movie) {
        addMovieToList(movie, list);
    });

    var moviehots = extractJsonAll(nextData, 'moviehots');
    moviehots.forEach(function (movie) {
        addMovieToList(movie, list);
    });

    var results = extractJsonAll(nextData, 'results');
    results.forEach(function (movie) {
        addMovieToList(movie, list);
    });

    // Secondary search for movies in LD+JSON or sidebars
    var movieRegex = /\{"@type":"Movie",.*?\}/g;
    var match;
    while ((match = movieRegex.exec(nextData)) !== null) {
        try {
            var movie = JSON.parse(match[0]);
            if (movie.url && movie.name) {
                var slug = movie.url.split('/').pop();
                addMovieToList({
                    name: movie.name,
                    slug: slug,
                    poster_url: movie.image,
                    description: movie.description
                }, list);
            }
        } catch (e) {}
    }
    return list;
}

function cleanTag(text, lang) {
    var combined = ((text || '') + ' ' + (lang || '')).toLowerCase();
    var tags = [];
    
    var epNum = '';
    var epSource = text || '';
    var epMatch = epSource.match(/\d+/);
    if (epMatch) {
        epNum = epMatch[0];
    }
    
    if (combined.indexOf('vietsub') !== -1 || combined.indexOf('viet sub') !== -1 || combined.indexOf('vs') !== -1) {
        tags.push('VS' + epNum);
    }
    if (combined.indexOf('thuyết minh') !== -1 || combined.indexOf('thuyet minh') !== -1 || combined.indexOf('tm') !== -1) {
        tags.push('TM' + epNum);
    }
    
    if (tags.length === 0) {
        if (epNum) {
            return 'Tập ' + epNum;
        }
        return text || lang || '';
    }
    
    return tags.join(' ');
}

function addMovieToList(movie, list) {
    if (!movie.slug || !movie.name) return;
    var name = cleanMovieName(movie.name);
    var link = BASE_URL + '/phim/' + movie.slug;
    var cover = movie.poster_url || movie.thumb_url || movie.image_name || movie.image || movie.thumb || '';
    
    for (var i = 0; i < list.length; i++) {
        if (list[i].link === link) return;
    }
    
    var rawTag = movie.episode_current || movie.display_status || movie.status || '';
    var rawLang = (movie.language && movie.language !== 'Đang cập nhật') ? movie.language : '';
    var tag = cleanTag(rawTag, rawLang);
    
    list.push({
        name: name,
        link: link,
        cover: normalizeUrl(cover),
        description: '',
        tag: tag,
        host: BASE_URL
    });
}
