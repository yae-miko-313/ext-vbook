load("config.js");

var DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": BASE_URL + "/"
};

function parseInput(input) {
    if (typeof input === "string") return input;
    if (Array.isArray(input) && input.length > 0) return input[0];
    if (input && typeof input === "object" && input.url) return input.url;
    if (input && typeof input === "object" && input.data) return input.data;
    return "";
}

function fetchPlayerHtml(postId, chapterSt, sv) {
    var types = ["pro", "tiktik", "vip4k", "vip4kv2"];
    for (var i = 0; i < types.length; i++) {
        var tryType = types[i];
        try {
            var resp = fetch(BASE_URL + "/wp-admin/admin-ajax.php", {
                method: "POST",
                headers: {
                    "Referer": BASE_URL + "/",
                    "User-Agent": DEFAULT_HEADERS["User-Agent"],
                    "X-Requested-With": "XMLHttpRequest",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: "action=dox_ajax_player&post_id=" + postId +
                      "&chapter_st=" + encodeURIComponent(chapterSt) +
                      "&sv=" + sv + "&type=" + tryType
            });
            if (!resp.ok) continue;
            var html = resp.text();
            if (html.indexOf("<iframe") >= 0 && html.indexOf("not-found") < 0) {
                Log.log("[TRACK] Player HTML ok, type=" + tryType);
                var srcM = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
                if (srcM) Log.log("[TRACK] src: " + srcM[1]);
                return html;
            }
        } catch (e) {
            Log.log("[TRACK] API error: " + e);
        }
    }
    return null;
}

function extractIframeSrc(html) {
    var m = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    return m ? m[1] : "";
}

function execute(input) {
    var url = parseInput(input);
    if (!url) return Response.error("Invalid input");
    url = normalizeUrl(url);
    Log.log("[TRACK] Input: " + url);

    var resp = fetch(url, { headers: DEFAULT_HEADERS });
    if (!resp.ok) return Response.error("Cannot fetch page");
    var pageHtml = resp.text();

    var postId = "", chapterSt = "", sv = "1";
    var activeLink = pageHtml.match(/data-post-id=["'](\d+)["'][^>]*data-ep=["']([^"']+)["'][^>]*data-sv=["']([^"']+)["']/);
    if (activeLink) {
        postId = activeLink[1]; chapterSt = activeLink[2]; sv = activeLink[3];
    } else {
        var idM = pageHtml.match(/DoPostInfo\s*=\s*\{[^}]*\bid\s*:\s*(\d+)/);
        if (idM) postId = idM[1];
        var tapM = url.match(/\/(tap-[\d]+)/);
        if (tapM) chapterSt = tapM[1];
        var svM = url.match(/sv(\d+)\.html/);
        if (svM) sv = svM[1];
    }

    if (!postId) return Response.error("Cannot find post ID");
    Log.log("[TRACK] postId=" + postId + " ch=" + chapterSt + " sv=" + sv);

    var playerHtml = fetchPlayerHtml(postId, chapterSt, sv);
    if (!playerHtml) return Response.error("Player API fail");

    var playerSrc = extractIframeSrc(playerHtml);
    if (!playerSrc) return Response.error("No iframe src");
    Log.log("[TRACK] src: " + playerSrc);

    // v16: Direct playerSrc + type auto
    // Simple fallback: let vBook figure it out
    Log.log("[TRACK] Return direct src with type:auto");
    return Response.success({
        data: playerSrc,
        type: "auto",
        headers: {
            "Referer": BASE_URL + "/",
            "User-Agent": DEFAULT_HEADERS["User-Agent"]
        },
        host: BASE_URL,
        timeSkip: []
    });
}