load('config.js');

function execute(url) {
    // Determine the API URL to fetch chapter content
    let apiUrl = url;

    // If URL is already an API URL, use directly
    if (url.indexOf("api.ntruyen.biz/chapters/") >= 0) {
        apiUrl = url;
    } else {
        // Extract chapter ID from HTML URL pattern: /doc-truyen/slug-{id}
        let match = url.match(/-(\d+)(?:\/?)$/);
        if (!match) match = url.match(/(\d+)(?:\/?)$/);
        if (!match) return Response.error("Không tìm thấy ID chương");
        apiUrl = API_URL + "/chapters/" + match[1];
    }

    let response = fetch(apiUrl);
    if (!response.ok) return Response.error("Lỗi tải chương: " + response.status);

    let text = response.text();

    // API may return JSON with 'content' field, or plain text
    try {
        let json = JSON.parse(text);
        if (json.content) {
            // Content is HTML string from the API
            let content = json.content;
            // Clean up
            content = content.replace(/&nbsp;/g, ' ');
            content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
            content = content.replace(/<p>\s*(?:&nbsp;)?\s*<\/p>/gi, '');
            return Response.success(content);
        }
        // If JSON but no content field, stringify it
        return Response.success(JSON.stringify(json));
    } catch (e) {
        // Not JSON — treat as plain text/HTML
        // Wrap in paragraphs if raw text
        if (text.indexOf('<') < 0) {
            // Plain text, convert newlines to <p> tags
            let lines = text.split('\n');
            let html = '';
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i].trim();
                if (line.length > 0) {
                    html += '<p>' + line + '</p>';
                }
            }
            return Response.success(html);
        }
        return Response.success(text);
    }
}
