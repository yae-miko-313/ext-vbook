load("config.js");
function execute(url) {
    let res = fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return null;
    let doc = res.html();

    doc.select("header, nav, footer, .menu, form, input, .search-form, .post-meta, .meta, .chapter-list, .widget").remove();
    let content = doc.select("div.content, .entry-content, .reading-content, .main-warp").first();
    
    if(content) {
        content.select("script, style, iframe, a, button, .ads, .text-center, h1, h2, .title, .chapter-title").remove();
        let htmlContent = content.html();

        htmlContent = htmlContent.replace(/Mời Quý độc giả CLICK[\s\S]*?chân thành cảm ơn![ \d]*/gi, "");
        htmlContent = htmlContent.replace(/Mở ứng dụng shopee[\s\S]*?chương truyện!/gi, "");
        htmlContent = htmlContent.replace(/https?:\/\/s99s\.net\/\w+/gi, ""); 
        htmlContent = htmlContent.replace(/&nbsp;/gi, " ");
        
        var vnc = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZáàảãạăắằẳẵặâấầẩẫậđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴ";
        var dotRegex = new RegExp("([" + vnc + "])\\.+([" + vnc + "])", "g");
        
        var temp = "";
        while (temp !== htmlContent) {
            temp = htmlContent;
            htmlContent = htmlContent.replace(dotRegex, "$1$2");
        }

        htmlContent = htmlContent.replace(/<\/?(p|div|br|h\d)[^>]*>/gi, "\n");
        htmlContent = htmlContent.replace(/<[^>]+>/g, "");

        var rawLines = htmlContent.split(/\n/);
        var cleanLines = [];
        
        for (var i = 0; i < rawLines.length; i++) {
            var l = rawLines[i].replace(/[ \t]{2,}/g, ' ').trim();
            if (!l) continue;
            let lowL = l.toLowerCase();
            
            l = l.replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g, "").trim();
            
            if (/^\s*(?:#|\[|“|"|'|‘)?\s*(?:ttty|gsnh|ttyy|gs|tt)[\s\-]*\d*[ \-–]*Chương\s*\d+/i.test(l) || /^Chương\s*\d+$/i.test(l)) continue;
            if (/^\d+\.$/.test(l) || /^\d+$/.test(l)) continue;

            if (l === "–" || l === "-" || l === "Chương" ||
                lowL.includes("đang tìm") || lowL.includes("tìm kiếm truyện") ||
                lowL.includes("cập nhật lúc") || lowL.includes("lượt xem") ||
                lowL.includes("mời quý độc giả") || lowL.includes("liên kết hoặc ảnh") ||
                lowL.includes("chân thành cảm ơn") || lowL.includes("đội ngũ chúng tôi") ||
                lowL.includes("danh sách chương") || lowL.includes("bạn đang xem chương") ||
                lowL.includes("truyện hay mỗi ngày") || lowL.includes("copyright") ||
                lowL.includes("website đang hoạt động") || lowL.includes("đọc từ đầu") || 
                lowL.includes("đọc tập mới") || lowL.includes("tác giả") || 
                lowL.includes("trạng thái") || lowL.includes("thể loại") ||
                lowL.includes("s99s.net") || lowL.includes("shopee")) { 
                continue;
            }
            
            if (cleanLines.length > 0) {
                var prevLine = cleanLines[cleanLines.length - 1];
                if (/^[.!?:;,\]}"”'’]+$/.test(l)) {
                    cleanLines[cleanLines.length - 1] = prevLine + l;
                    continue;
                }
                var prevEndsWithPunc = /[.!?…"”'’]$/.test(prevLine);
                var startsWithQuote = /^["“'‘]/.test(l);
                var firstChar = l.replace(/^["“'‘]/, "").charAt(0);
                var isLowerLetter = (firstChar && firstChar === firstChar.toLowerCase() && firstChar !== firstChar.toUpperCase());
                
                if (!prevEndsWithPunc || (isLowerLetter && !startsWithQuote)) {
                    cleanLines[cleanLines.length - 1] = prevLine + " " + l;
                    continue;
                }
            }
            cleanLines.push(l);
        }

        while (cleanLines.length > 0 && /^Chương\s*\d+/i.test(cleanLines[0])) cleanLines.shift();
        while (cleanLines.length > 0 && cleanLines[0].toLowerCase() === "chương") cleanLines.shift();
        
        var finalHtml = []; 
        var dialogueReg = /(“[^”]+”|"[^"]+"|‘[^’]+’|'[^']+')/g;
        
        for (var k = 0; k < cleanLines.length; k++) {
            var line = cleanLines[k];
            var pts = line.split(dialogueReg);
            var formattedLine = "";
            for (var j = 0; j < pts.length; j++) {
                var p = pts[j].trim();
                if (!p) continue;
                if (/^(“.*”|".*"|‘.*’|'.*')$/.test(p)) formattedLine += "<i>" + p + "</i> ";
                else formattedLine += p + " ";
            }
            finalHtml.push("<p>" + formattedLine.trim() + "</p>");
        }
        return Response.success(finalHtml.join(""));
    }
    return null;
}