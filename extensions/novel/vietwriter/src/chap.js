load("config.js");
function execute(url) {
    try {
        var res = fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) throw new Error("Lỗi HTTP");
        var doc = res.html(); 
        var content = null;
        var match = url.match(/(?:post-|posts\/)(\d+)/);
        if (match) content = doc.select("#js-post-" + match[1] + " .message-body .bbWrapper").first();
        if (!content) content = doc.select(".message-body .bbWrapper").first();
        if (content) {
            var blackList = [".message-signature", ".bbCodeBlock", ".bbCodeSpoiler", ".quoteContainer", ".js-expandWatch", "script", "style", "a", "img"];
            content.select(blackList.join(", ")).remove();
            var rawHtml = content.html();
            rawHtml = rawHtml.replace(/Bạn đang đọc truyện tại.*?VietWriter/gi, ""); 
            rawHtml = rawHtml.replace(/<(div|p)[^>]*>/gi, "<br>"); 
            var lines = rawHtml.split(/<br\s*\/?>|\n/i);
            var finalLines = [];
            var tagRegex = /<[^>]+>/g; 
            var spaceRegex = /\s{2,}/g;
            var dialogueRegex = /(“[^”]+”|"[^"]+")/g; 
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].replace(tagRegex, '').replace(spaceRegex, ' ').trim(); 
                if (line) {
                    line = line.replace(dialogueRegex, "<b>$1</b>");
                    finalLines.push("<p>" + line + "</p>");
                }
            }
            return Response.success(finalLines.join(""));
        }
        return Response.error("Cấu trúc HTML bất thường.");
    } catch (e) {
        return Response.error("Bug Chap: " + e.message);
    }
}