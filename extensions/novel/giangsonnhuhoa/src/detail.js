load("config.js");
function clean(t) { 
    if(!t) return "Chưa rõ tên";
    var original = t.trim();
    var cleaned = original.replace(/^\s*(?:#|\[|“|"|'|‘)?\s*(?:ttty|gsnh|ttyy|gs|tt)\s*(?:\])?\s*\d+[\s\-:–"”'‘\.\|]*/i, "").trim();
    return cleaned.length > 0 ? cleaned : original; 
}
function execute(url) {
    let res = fetch(url);
    if (res.ok) {
        let doc = res.html();
        let rawName = doc.select("h1.title, .post-title h1, h1").first().text().trim();
        
        let cover = "";
        let ogImage = doc.select("meta[property='og:image']").attr("content");
        if (ogImage && ogImage.indexOf("TruyenCuaToi.info") === -1 && ogImage.indexOf("logo") === -1) cover = ogImage;

        if (!cover) {
            let imgs = doc.select(".summary_image img, .book_cover img, .post-thumbnail img, article img, .main-warp img");
            for (let i = 0; i < imgs.size(); i++) {
                let imgEl = imgs.get(i);
                let src = imgEl.attr("data-src") || imgEl.attr("data-lazy-src") || imgEl.attr("src");
                if (src && src.indexOf("TruyenCuaToi.info") === -1 && src.indexOf("logo") === -1 && src.indexOf("avatar") === -1) {
                    cover = src; break;
                }
            }
        }
        
        if (!cover || cover.includes("data:image")) {
            let html = doc.html();
            let match = html.match(/src="([^"]*\/wp-content\/uploads\/[^"]*)"/);
            if (match && match[1].indexOf("TruyenCuaToi.info") === -1 && match[1].indexOf("logo") === -1) cover = match[1];
        }
        if (cover && cover.startsWith("//")) cover = "https:" + cover;
        if (!cover) cover = "https://i.imgur.com/15469.png";

        let rawText = doc.text();
        let author = doc.select("span.label:contains(Tác giả) + span.value, .author-name, .author, .author-content").first().text().trim() || "Chưa rõ";
        
        let status = "Đang cập nhật";
        if (rawText.toLowerCase().includes("hoàn thành")) status = "Hoàn thành";
        else if (rawText.toLowerCase().includes("đang ra")) status = "Đang ra";

        let viewsMatch = rawText.match(/Lượt xem\s*(\d+)/i);
        let views = viewsMatch ? viewsMatch[1] : "Chưa rõ";
        
        let chapters = "N/A";
        let chapNodes = doc.select(".chapter-list a, .es-story-link, .list-chapter a");
        if (chapNodes.size() > 0) {
            chapters = chapNodes.size().toString();
        } else {
            let chapMatch = rawText.match(/Số chương[\s:]*(\d+)/i);
            if (chapMatch) chapters = chapMatch[1];
        }

        let genres = [];
        let seenGenres = {};
        doc.select("a[href*='/the-loai/']").forEach(g => {
            let txt = g.text().trim();
            let link = g.attr("href");
            let lowTxt = txt.toLowerCase();
            if (txt && !seenGenres[txt] && lowTxt !== "truyện" && lowTxt !== "kho truyện" && lowTxt !== "mới cập nhật" && lowTxt !== "hoàn thành" && lowTxt !== "tìm kiếm truyện") {
                seenGenres[txt] = true;
                genres.push({ title: txt, input: link, script: "book.js" });
            }
        });

        doc.select("header, nav, .menu, #masthead, form, input, .search-form, footer").remove();
        
        let descHtml = "";
        let possibleDesc = doc.select(".summary__content, .description-summary, .entry-content, .post-content, .main-warp, article");
        for (let i = 0; i < possibleDesc.size(); i++) {
            let el = possibleDesc.get(i);
            el.select("script, style, .ads, .meta, .info, .btn, button, table, h1, .entry-header").remove();
            
            let rawHtml = el.html();
            // XÓA TRỰC TIẾP QUẢNG CÁO SHOPEE BẰNG REGEX TRONG MÔ TẢ
            rawHtml = rawHtml.replace(/Mời Quý độc giả CLICK[\s\S]*?chân thành cảm ơn![ \d]*/gi, "");
            rawHtml = rawHtml.replace(/Mở ứng dụng shopee[\s\S]*?chương truyện!/gi, "");
            rawHtml = rawHtml.replace(/https?:\/\/s99s\.net\/\w+/gi, "");
            
            let lines = rawHtml.replace(/<\/?(div|p|h\d)[^>]*>/gi, "<br>").split(/<br\s*\/?>|\n/i);
            let validLines = [];
            
            for(let j = 0; j < lines.length; j++) {
                let l = lines[j].replace(/<[^>]+>/g, '').trim();
                let lowL = l.toLowerCase();
                
                // MỞ RỘNG BỘ LỌC TỪ KHÓA ĐỂ BẢO VỆ MÔ TẢ
                if(l && 
                   !lowL.includes("đang tìm") && !lowL.includes("đăng nhập") && !lowL.includes("đăng ký") && 
                   !lowL.includes("trang chủ") && !lowL.includes("kho truyện") && !lowL.includes("chính sách") &&
                   !lowL.includes("đọc từ đầu") && !lowL.includes("đọc tập mới") && !lowL.includes("tìm kiếm truyện") &&
                   !lowL.includes("thể loại") && !lowL.includes("hoàn thành") && !lowL.includes("lượt xem") &&
                   !lowL.includes("cập nhật") && !lowL.includes("tác giả") && !lowL.includes("trạng thái") &&
                   !lowL.includes("mời quý độc giả") && !lowL.includes("liên kết hoặc ảnh") && 
                   !lowL.includes("shopee") && !lowL.includes("chân thành cảm ơn") && 
                   !lowL.includes("đội ngũ chúng tôi") && !lowL.includes("s99s.net") &&
                   !seenGenres[l]) { 
                    validLines.push(l);
                }
            }
            let cleanText = validLines.join("<br><br>");
            if (cleanText.length > 20) { 
                descHtml = cleanText; 
                break;
            }
        }
        if(!descHtml) descHtml = "Truyện đọc nhanh, không có mô tả chi tiết.";

        let info = [
            "👤 Tác giả: " + author,
            "📌 Trạng thái: " + status,
            "👁️ Lượt xem: " + views,
            "📖 Số chương: " + chapters,
            "🎭 Thể loại: " + (genres.map(g => g.title).join(", ") || "Chưa rõ")
        ];

        return Response.success({
            name: clean(rawName), cover: cover, author: author, description: descHtml, 
            detail: info.join("<br>"), genres: genres, ongoing: status !== "Hoàn thành", host: BASE_URL
        });
    }
    return null;
}