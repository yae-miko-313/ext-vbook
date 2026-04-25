var BASE_URL = "https://kenhtruyenma.com";

function normalizeUrl(url) {
    if (!url) return BASE_URL;
    if (typeof url !== "string") {
        if (Array.isArray(url) && url.length > 0) {
            url = url[0];
        } else {
            return BASE_URL;
        }
    }
    
    if (url.indexOf("http") !== 0) {
        if (url.indexOf("/") === 0) url = BASE_URL + url;
        else url = BASE_URL + "/" + url;
    }
    return url.replace(/\/$/, "");
}

function cleanText(text) {
    if (!text) return "";
    return text.replace(/\s+/g, " ").trim();
}

var Response = {
    success: function(data, data2) {
        return JSON.stringify({ code: 0, data: data, data2: data2 });
    },
    error: function(data) {
        return JSON.stringify({ code: 1, data: data });
    }
};

// Parse danh sach truyen tu .tss_e items (dung cho home, search, gen)
function parseStoryList(doc) {
    var list = [];
    var seen = {};
    
    var items = doc.select(".tss_e");
    
    items.forEach(function(item) {
        var linkEl = item.select("a[href*='/audio/']").first();
        if (!linkEl) return;
        
        var href = linkEl.attr("href") || "";
        if (!href || href.indexOf("/audio/") < 0) return;
        
        var fullUrl = href.indexOf("http") === 0 ? href : BASE_URL + href;
        if (seen[fullUrl]) return;
        seen[fullUrl] = true;
        
        var titleEl = item.select(".ct_title").first();
        var title = titleEl ? cleanText(titleEl.text()) : "";
        
        if (!title) {
            var img = item.select("img").first();
            if (img) {
                var alt = img.attr("alt") || "";
                title = alt.replace(/^Nghe truyen\s+/, "").trim();
            }
        }
        
        if (!title || title.length < 2) return;
        
        var cover = "";
        var imgLink = item.select(".img_link").first();
        if (imgLink) {
            var style = imgLink.attr("style") || "";
            var bgMatch = style.match(/url\((['"]?)(.*?)\1\)/);
            if (bgMatch) cover = bgMatch[2];
        }
        
        if (!cover) {
            var img = item.select("img").first();
            if (img) cover = img.attr("src") || "";
        }
        
        var tag = "";
        var rlbHeart = item.select(".rlb_heart .sl").first();
        if (rlbHeart) tag = cleanText(rlbHeart.text());
        
        var narrator = "";
        var ctiE = item.select(".cti_e span").first();
        if (ctiE) narrator = cleanText(ctiE.text());
        
        list.push({
            name: title,
            link: fullUrl,
            cover: cover,
            description: narrator ? "Giọng đọc: " + narrator : "",
            host: BASE_URL
        });
    });
    
    return list;
}

// Parse dataList tu HTML de lay danh sach audio MP3
function parseAudioList(html) {
    var list = [];
    
    // Method 1: Extract using regex for each item (most reliable)
    var regex = /title:\s*["']([^"']+)["']\s*,\s*mp3:\s*["']([^"']+)["']/g;
    var result;
    while ((result = regex.exec(html)) !== null) {
        list.push({
            title: result[1],
            mp3: result[2]
        });
    }
    
    // Method 2: Try JSON parse as fallback
    if (list.length === 0) {
        var match = html.match(/var\s+dataList\s*=\s*(\[.*?\]);/s);
        if (match && match[1]) {
            try {
                var jsonStr = match[1];
                // Convert JavaScript object to valid JSON
                jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
                jsonStr = jsonStr.replace(/,\s*([}\]])/g, "$1");
                var dataList = JSON.parse(jsonStr);
                
                for (var i = 0; i < dataList.length; i++) {
                    var item = dataList[i];
                    if (item && item.mp3) {
                        list.push({
                            title: item.title || ("Tập " + (i + 1)),
                            mp3: item.mp3
                        });
                    }
                }
            } catch (e) {}
        }
    }
    
    return list;
}
