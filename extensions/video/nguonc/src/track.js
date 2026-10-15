load('config.js');

function execute(data) {
    if (!data) return Response.error("Link trống");

    // Nếu đã là link stream direct .m3u8 hoặc .mp4
    if (data.indexOf(".m3u8") !== -1 || data.indexOf(".mp4") !== -1) {
        return Response.success({
            type: "native",
            data: data,
            host: BASE_URL,
            mimeType: "application/x-mpegURL",
            headers: {
                "User-Agent": UserAgent.chrome(),
                "Referer": BASE_URL
            }
        });
    }

    // Embed streamc.xyz: POST bootstrap về chính embed.php, server trả sẵn link playlist HLS (preissued)
    var embedOrigin = data.replace(/^(https?:\/\/[^\/]+).*$/, "$1");
    var response = fetch(data, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Origin": embedOrigin,
            "Referer": data
        },
        body: JSON.stringify({
            action: "bootstrap",
            referrer: BASE_URL + "/",
            frame_origins: [BASE_URL],
            request_grant: true,
            playlist_format: "hls",
            pretty_url: true,
            path_chunks: true,
            bootstrap_format: "json"
        })
    });
    if (!response.ok) return Response.error("Không lấy được cấu hình video (HTTP " + response.status + ")");

    var json = response.json();
    var playlist = json && json.preissued && json.preissued.playlist;
    if (!playlist) return Response.error("Không tìm thấy link phát video");

    // Tự tải playlist rồi đưa cho player dưới dạng data URI vì:
    // - host embed chặn HTTP/1.1 (403) mà player Android dùng; segment ở host khác nên vẫn tải thẳng
    // - segment đầu (streamaaa0000.png) luôn bị Cloudflare chặn 403 khiến player dừng ngay, nên bỏ đi (~2 giây)
    var playlistResponse = fetch(playlist, {
        headers: {
            "User-Agent": UserAgent.chrome(),
            "Referer": embedOrigin + "/"
        }
    });
    if (playlistResponse.ok) {
        var m3u8 = playlistResponse.text().replace(/#EXTINF:[^\n]*\n[^\n]*0000\.png[^\n]*\n/, "");
        playlist = "data:application/x-mpegURL;base64," + base64Ascii(m3u8);
    }

    // Playlist và các segment (.png ngụy trang TS) đều bắt buộc Referer của host embed
    return Response.success({
        type: "native",
        data: playlist,
        host: embedOrigin,
        mimeType: "application/x-mpegURL",
        headers: {
            "User-Agent": UserAgent.chrome(),
            "Referer": embedOrigin + "/"
        }
    });
}

// Playlist chỉ chứa ký tự ASCII nên mã hóa thẳng từng byte
function base64Ascii(str) {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var out = "";
    for (var i = 0; i < str.length; i += 3) {
        var a = str.charCodeAt(i), b = str.charCodeAt(i + 1), c = str.charCodeAt(i + 2);
        var n = (a << 16) | ((b || 0) << 8) | (c || 0);
        out += chars.charAt(n >> 18 & 63) + chars.charAt(n >> 12 & 63)
            + (i + 1 < str.length ? chars.charAt(n >> 6 & 63) : "=")
            + (i + 2 < str.length ? chars.charAt(n & 63) : "=");
    }
    return out;
}
