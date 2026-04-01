load("config.js");

const toAbs = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (url.startsWith("//")) return "https:" + url;
    return BASE_URL + (url.startsWith("/") ? "" : "/") + url;
};

const buildApiUrl = (inputUrl, page) => {
    // BỘ ĐÁNH CHẶN TỪ KHÓA: Nếu input không phải là định dạng link thì xác định đây là từ khóa tìm kiếm
    if (!inputUrl.startsWith("http") && !inputUrl.startsWith("/") && !inputUrl.includes("webtruyendich.com")) {
        return BASE_URL + "/api/search-novels?keyword=" + encodeURIComponent(inputUrl) + "&page=" + String(page || 1);
    }
    
    // Luồng xử lý cho URL Danh mục (Thể loại / Mới cập nhật)
    const urlObj = inputUrl.split("?");
    const path = urlObj[0];
    const params = {};
    if (urlObj[1]) {
        urlObj[1].split("&").forEach(p => {
            const [k, v] = p.split("=");
            if (k) params[k] = decodeURIComponent(v || "");
        });
    }
    params.sort = params.sort || "update_date";
    params.page = String(page || 1);
    const base = path.includes("/api/search-novels") ? path : (BASE_URL + "/api/search-novels");
    const query = Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v))
        .join("&");
    return base + "?" + query;
};

const toBook = (item) => {
    if (!item) return null;
    let title = item.title || item.name || item.novel_title || "";
    if (title) title = title.replace(/^Bìa truyện\s+/i, '').trim();
    
    const slug = item.url || item.slug || item.novel_slug || "";
    const link = slug.startsWith("http") ? slug : (BASE_URL + "/truyen/" + slug);
    const cover = toAbs(item.thumbnail || item.cover || item.image || "");

    let meta = [];
    if (item.author || item.novel_author) meta.push(item.author || item.novel_author);
    if (item.genre_name) meta.push(item.genre_name);
    if (item.status || item.novel_status) meta.push(item.status || item.novel_status);
    if (item.max_chapters) meta.push(item.max_chapters + " chương");

    return { name: title, link: toAbs(link), cover: cover, description: meta.join(" · "), host: BASE_URL };
};

function execute(url, page) {
    const curPage = parseInt(page || "1");
    const apiUrl = buildApiUrl(url, curPage);
    const res = fetch(apiUrl, { headers: { "X-Requested-With": "XMLHttpRequest", "Accept": "application/json" } });

    if (!res || !res.ok) return Response.success([]);
    const json = res.json();
    if (!json) return Response.success([]);

    const dataArr = json.data || json.novels || json.items || (Array.isArray(json) ? json : []);
    const books = dataArr.map(toBook).filter(Boolean);

    let nextPage = "";
    const current = json.current_page || json.page || curPage;
    const last = json.last_page || json.total_pages;
    
    if (last && current < last) nextPage = String(current + 1);
    else if (books.length >= 10) nextPage = String(curPage + 1);
    
    return Response.success(books, nextPage);
}
