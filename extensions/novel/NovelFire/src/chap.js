function execute(url) {
    var res = fetch(url);
    if (!res.ok) return null;
    var doc = res.html();
    var content = doc.select("#chapter-content, #chapter-container, div#content, .chapter-content, div[itemprop='articleBody']").first();
    if (!content) return null;

    content.select("script, style, iframe, .ads, .ad-box, .notice, .text-muted").remove();
    var htm = content.html();
    var lowerHtm = htm.toLowerCase();
    
    // Thuật toán dò tìm rác cắt chuỗi một lần duy nhất
    var shareIdx = lowerHtm.indexOf("share to your friends");
    var tipIdx = lowerHtm.indexOf("tip: you can use left");
    var cutIdx = -1;
    
    if (shareIdx !== -1) cutIdx = shareIdx;
    if (tipIdx !== -1 && (cutIdx === -1 || tipIdx < cutIdx)) cutIdx = tipIdx;
    
    if (cutIdx !== -1) {
        var cutPos = lowerHtm.lastIndexOf("<br", cutIdx);
        if (cutPos === -1) cutPos = lowerHtm.lastIndexOf("<p", cutIdx);
        if (cutPos === -1) cutPos = lowerHtm.lastIndexOf("<div", cutIdx);
        htm = htm.substring(0, cutPos !== -1 ? cutPos : cutIdx);
    }
    
    htm = htm.replace(/Restore scroll position/gi, "").replace(/<\/?(div|p)[^>]*>/gi, "<br>");
    var rawLines = htm.split(/<br\s*\/?>/i);
    var cleanLines = [];

    for (var i = 0; i < rawLines.length; i++) {
        var line = rawLines[i].replace(/<[^>]*>/g, "").trim();
        if (!line || line.toLowerCase() === "report") continue;

        // --- ĐỒNG BỘ THUẬT TOÁN REGEX TỪ TOC.JS ---
        line = line.replace(/^\d+\s+(Chapter|Chương)/i, "$1");
        line = line.replace(/(Chapter\s*\d+)[\s:.-]+(?:Chapter\s*\d+[\s:.-]*)+/gi, "$1");
        line = line.replace(/^(Chapter\s*\d+)\s*-\s*\d+\s*[:-]\s*/i, "$1: ");

        var isDuplicate = false;
        if (cleanLines.length > 0) {
            var prev = cleanLines[cleanLines.length - 1];
            var lowerLine = line.toLowerCase(), lowerPrev = prev.toLowerCase();
            if (lowerPrev === lowerLine) isDuplicate = true;
            else if ((lowerPrev.indexOf(lowerLine) === 0 || lowerLine.indexOf(lowerPrev) === 0) && (lowerLine.indexOf("chapter") === 0 || lowerLine.indexOf("chương") === 0)) {
                if (line.length > prev.length) cleanLines[cleanLines.length - 1] = line;
                isDuplicate = true;
            }
        }
        if (!isDuplicate) cleanLines.push(line);
    }

    var output = "";
    var splitter = /(“[^”]+”|"[^"]+"|‘[^’]+’|'[^']+'|\([^)]+\)|\[[^\]]+\]|<[^>]+>|&lt;[^&]+&gt;)/g;

    for (var j = 0; j < cleanLines.length; j++) {
        var parts = cleanLines[j].split(splitter);
        for (var k = 0; k < parts.length; k++) {
            var pText = parts[k].trim();
            if (!pText) continue;
            if (/^(“.*”|".*"|‘.*’|'.*'|\(.*\)|\[.*\]|<.*>|&lt;.*&gt;)$/.test(pText)) pText = "<i>" + pText + "</i>";
            output += '<p style="text-indent: 1.5em; text-align: justify; margin-top: 0.6em; margin-bottom: 0.6em; line-height: 1.6;">' + pText + '</p>';
        }
    }
    return Response.success(output);
}
