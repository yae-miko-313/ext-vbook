var BASE_URL = "https://hhkungfu.ee";

function normalizeUrl(url) {
    if (!url) return BASE_URL;
    if (typeof url !== "string") return BASE_URL;
    
    if (url.indexOf("//") === 0) return "https:" + url;
    if (url.indexOf("http") === 0) return url;
    
    if (url.indexOf("/") === 0) return BASE_URL + url;
    return BASE_URL + "/" + url;
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
