load("language_list.js");

var MAX_RETRY = 3;
var MAX_LENGTH = 5000;

function execute(text, from, to, apiKey) {
    return translate(text, from || "auto", to || "vi", 0);
}

function translate(text, from, to, retry) {
    if (!text || !text.trim()) return null;
    if (retry >= MAX_RETRY) return null;

    if (text.length > MAX_LENGTH) {
        text = text.substring(0, MAX_LENGTH);
    }

    var url =
        "https://translate.googleapis.com/translate_a/single" +
        "?client=gtx" +
        "&sl=" + from +
        "&tl=" + to +
        "&dt=t" +
        "&q=" + encodeURIComponent(text);

    try {
        var response = fetch(url, { method: "GET", timeout: 10000 });
        if (!response || !response.ok) {
            return retryTranslate(text, from, to, retry);
        }

        var raw = response.text();
        if (!raw) {
            return retryTranslate(text, from, to, retry);
        }

        var data = JSON.parse(raw);
        var result = "";

        if (data && data[0]) {
            for (var i = 0; i < data[0].length; i++) {
                if (data[0][i] && data[0][i][0]) {
                    result += data[0][i][0];
                }
            }
        }

        return result
            ? Response.success(result)
            : retryTranslate(text, from, to, retry);

    } catch (e) {
        return retryTranslate(text, from, to, retry);
    }
}

function retryTranslate(text, from, to, retry) {
    return translate(text, from, to, retry + 1);
}
