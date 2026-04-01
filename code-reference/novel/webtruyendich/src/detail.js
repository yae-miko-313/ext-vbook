load("config.js");

function execute(url) {
    const res = fetch(url);
    if (!res || !res.ok) return null;
    const doc = res.html();

    const name = doc.select('h1').text().trim();
    let cover = doc.select('meta[property="og:image"]').attr("content");
    if (cover && cover.startsWith("//")) cover = "https:" + cover;
    else if (cover && cover.startsWith("/")) cover = BASE_URL + cover;
    
    let author = doc.select('meta[property="book:author"]').attr("content");
    if (!author) {
        let authorEl = doc.select('a[href*="keyword="]').first();
        if (authorEl) author = authorEl.text().trim();
    }
    if (!author) author = "Đang cập nhật";

    let originalName = "";
    let totalChapters = doc.select('.text-xl.font-bold').first().text().trim();
    let status = doc.select('.bg-green-100').text().trim() || "Đang ra";

    doc.select('p').forEach(p => {
        let t = p.text().trim();
        if (t.startsWith("Tên gốc:") && !originalName) originalName = t.substring(8).trim();
        else if (t.startsWith("Số chương:") && !totalChapters) totalChapters = t.substring(10).trim();
        else if (t.startsWith("Tình trạng:") && status === "Đang ra") {
            let s = t.substring(11).trim();
            if (s) status = s;
        }
    });

    const description = doc.select('.lg\\:col-span-2 p').html(); 
    let genres = [];
    let gapElement = doc.select('.flex.flex-wrap.gap-2').first();
    if (gapElement) {
        gapElement.select('a').forEach(a => {
            let title = a.text().trim();
            if (title && a.select('.material-symbols-outlined').size() === 0) {
                let href = a.attr("href");
                let inputUrl = href.startsWith("http") ? href : BASE_URL + (href.startsWith("/") ? "" : "/") + href;
                genres.push({ title: title, input: inputUrl, script: "gen.js" });
            }
        });
    }

    let lastChEl = doc.select('#gioi-thieu a[href*="/chuong-"]').first();
    let lastChapter = lastChEl ? lastChEl.text().trim() : "";

    // 1. Lưu lại Text thể loại nguyên gốc để in vào khối Info bên dưới
    let categoryText = genres.map(g => g.title).join(', ');

    // 2. THUẬT TOÁN BIẾN TÁC GIẢ THÀNH TAGS (Nằm ở vị trí đầu tiên)
    if (author && author !== "Đang cập nhật") {
        genres.unshift({ 
            title: author, 
            input: BASE_URL + "/api/search-novels?keyword=" + encodeURIComponent(author) + "&page=1", 
            script: "source.js" 
        });
    }

    // 3. Kết xuất hiển thị chi tiết (Giữ nguyên định dạng gốc của web như trong ảnh)
    let detailHtml = '<div>'
        + '<p>Tác giả: ' + author + '</p>'
        + (originalName ? '<p>Tên gốc: ' + originalName + '</p>' : '')
        + (categoryText ? '<p>Thể loại: ' + categoryText + '</p>' : '')
        + '<p>Tình trạng: ' + status + '</p>'
        + (totalChapters ? '<p>Số chương: ' + totalChapters + '</p>' : '')
        + (lastChapter ? '<p>Chương mới: ' + lastChapter + '</p>' : '')
        + '</div>';

    return Response.success({ 
        name: name, 
        cover: cover, 
        author: author, 
        description: description, 
        genres: genres, 
        detail: detailHtml, 
        ongoing: status.includes("Đang ra"), 
        host: BASE_URL 
    });
}
