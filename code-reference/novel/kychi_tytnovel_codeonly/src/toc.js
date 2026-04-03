load("config.js");
function execute(url) {
    let sid = normalizeStoryId(url);
    if (!sid) {
        return Response.error('Invalid story id');
    }
    let result = null;
    const chapterNumbersMatch = url.match(/\/api\/v\d+\/chapters\/numbers\?(.+)$/);
    if (chapterNumbersMatch && chapterNumbersMatch[1]) {
        let params = {};
        chapterNumbersMatch[1].split('&').forEach(part => {
            const pair = part.split('=');
            const key = pair[0] ? decodeURIComponent(pair[0]) : '';
            const value = pair[1] ? decodeURIComponent(pair[1]) : '';
            if (key) {
                params[key] = value;
            }
        });
        result = apiFetch('chapters/numbers', params);
    } else {
        result = apiFetch('chapters/numbers', {
            story_id: sid,
            start: 0,
            end: 100
        });
    }

    if (result.ok) {
        let chapters = [];
        let json = result.response.json();
        const activeHost = result.host;
        json.data.forEach(item => {
            let storyId = item.story_id;
            if (storyId && typeof storyId === 'object') {
                storyId = storyId.$oid || sid;
            }
            if (!storyId) {
                storyId = sid;
            }
            chapters.push({
                name: item.title,
                url: `${getApiUrl('chapters/detail', activeHost)}?number=${encodeURIComponent(item.number)}&story_id=${encodeURIComponent(storyId)}`,
            });
        });
        return Response.success(chapters);
    }
    return errorFromApiResult('Tai danh sach chuong', result);

}