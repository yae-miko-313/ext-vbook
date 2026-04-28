var BASE_URL = "https://hhkungfu.ee";

function normalizeUrl(url) {
    if (!url) return BASE_URL;
    if (typeof url !== "string") {
        if (Array.isArray(url) && url.length > 0) {
            url = url[0];
        } else {
            return BASE_URL;
        }
    }
    
    // Nếu đã có http, giữ nguyên
    if (url.indexOf("http") === 0) return url;
    
    // Thêm BASE_URL vào đầu
    if (url.indexOf("/") === 0) url = BASE_URL + url;
    else url = BASE_URL + "/" + url;
    
    return url;
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
