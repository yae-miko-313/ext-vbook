load("config.js");
function execute(url) {
    let response = fetch(url,{
        method: 'GET',
        headers: {
            //'Authorization': BASE_TOKEN,
            'client-id': 'simbo',
            'client-language': 'en',
            'client-platform': 'ios',
            'client-token': 'simbo',
            'client-version': BASE_VERSION,
            //'user-id': BASE_USER
        }
    });
    if (response.ok) {
        let chapters = [];
        let json = response.json();
        console.log(json.data);
        json.data.forEach(item => {
            chapters.push({
                name: item.title,
                url: `${BASE_HOST}/api/v2/chapters/detail?number=${item.number}&story_id=${item.story_id.$oid}`,
            });
        });
        return Response.success(chapters);
    }
    return null;

}