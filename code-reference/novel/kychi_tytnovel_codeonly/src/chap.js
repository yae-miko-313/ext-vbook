load('config.js');
function execute(url) {
    const detailMatch = url.match(/\/api\/v\d+\/chapters\/detail\?(.+)$/);
    if (!detailMatch || !detailMatch[1]) {
        return Response.error('Invalid chapter url');
    }

    let params = {};
    detailMatch[1].split('&').forEach(part => {
        const pair = part.split('=');
        const key = pair[0] ? decodeURIComponent(pair[0]) : '';
        const value = pair[1] ? decodeURIComponent(pair[1]) : '';
        if (key) {
            params[key] = value;
        }
    });

    let result = apiFetch('chapters/detail', params);
    if (result.ok) {
        let json = result.response.json();
        let content = json.data.content
            .replace(/&(nbsp|amp|quot|lt|gt|bp|emsp);/g, "")
            .replace(/(\<br[\s]*\/?\>[\s]*)+/g, '<br>');
        return Response.success(content)
    }
    return errorFromApiResult('Tai noi dung chuong', result);
}