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
