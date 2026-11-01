/**
 * Cloudflare Worker Proxy cho Extension NguonC vBook
 * Tác dụng: Giải mã data-obf từ embed streamc.xyz và proxy phân đoạn TS video MPEG-2
 */

export default {
  async fetch(request) {
    // Xử lý CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    const url = new URL(request.url);
    const workerOrigin = url.origin;

    // 1. Phân đoạn TS Chunk: /chunk hoặc /segment.ts
    // Query: /segment.ts?url=<encoded_chunk_url>&ref=<encoded_referer>
    if (url.pathname.startsWith("/chunk") || url.pathname.endsWith(".ts")) {
      const chunkUrl = url.searchParams.get("url");
      const referer =
        url.searchParams.get("ref") || "https://embed.streamc.xyz/";
      if (!chunkUrl) return new Response("Missing chunk url", { status: 400 });

      const forwardHeaders = {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Referer: referer,
      };

      const range = request.headers.get("Range");
      if (range) {
        forwardHeaders["Range"] = range;
      }

      const chunkResp = await fetch(chunkUrl, { headers: forwardHeaders });

      const respHeaders = new Headers(chunkResp.headers);
      respHeaders.set("Content-Type", "video/mp2t");
      respHeaders.set("Access-Control-Allow-Origin", "*");
      respHeaders.set("Access-Control-Expose-Headers", "*");
      respHeaders.set("Cache-Control", "public, max-age=86400");

      return new Response(chunkResp.body, {
        status: chunkResp.status,
        headers: respHeaders,
      });
    }

    // 2. Playlist M3U8: /playlist.m3u8 hoặc /m3u8 hoặc ?url=...
    const embedUrl = url.searchParams.get("url");
    if (!embedUrl) {
      return new Response(
        "NguonC Stream Proxy is running. Usage: /playlist.m3u8?url=<embed_url>",
        {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        },
      );
    }

    try {
      // Fetch trang embed để lấy chuỗi data-obf
      const embedResp = await fetch(embedUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          Referer: "https://phim.nguonc.com/",
        },
      });

      if (!embedResp.ok) {
        return new Response("Failed to fetch embed page: " + embedResp.status, {
          status: 502,
        });
      }

      const html = await embedResp.text();
      const match = html.match(/data-obf=["']([^"']+)["']/i);
      if (!match || !match[1]) {
        return new Response("data-obf attribute not found in embed page", {
          status: 404,
        });
      }

      // Giải mã Base64 lấy sUb
      const obfData = JSON.parse(atob(match[1]));
      const embedOrigin = new URL(embedUrl).origin;
      const streamUrl = embedOrigin + "/" + obfData.sUb;

      // Fetch playlist m3u8 từ CDN NguonC
      const m3u8Resp = await fetch(streamUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          Referer: embedUrl,
        },
      });

      if (!m3u8Resp.ok) {
        return new Response(
          "Failed to fetch stream playlist: " + m3u8Resp.status,
          { status: 502 },
        );
      }

      let m3u8Content = await m3u8Resp.text();

      // Rewrite toàn bộ URL chunk (.png) trong playlist thành endpoint /segment.ts của Worker
      m3u8Content = m3u8Content.replace(
        /(https?:\/\/[^\s\n\r]+\.png[^\s\n\r]*)/g,
        (segUrl) => {
          return `${workerOrigin}/segment.ts?url=${encodeURIComponent(segUrl)}&ref=${encodeURIComponent(embedUrl)}`;
        },
      );

      return new Response(m3u8Content, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Expose-Headers": "*",
          "Cache-Control": "no-cache",
        },
      });
    } catch (err) {
      return new Response("Proxy Error: " + err.message, { status: 500 });
    }
  },
};
