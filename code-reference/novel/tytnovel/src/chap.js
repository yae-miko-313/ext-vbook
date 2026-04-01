load('config.js');
function execute(url) {
    let response = fetch(url,{
        method: 'GET',
        headers: {
            'Authorization': BASE_TOKEN,
            'client-id': 'simbo',
            'client-language': 'en',
            'client-platform': 'ios',
            'client-token': 'simbo',
            'client-version': BASE_VERSION,
            'user-id': BASE_USER
        }
    });
    if (response.ok) {
        let json = response.json();
        let content = json.data.content
            .replace(/&(nbsp|amp|quot|lt|gt|bp|emsp);/g, "")
            .replace(/(\<br[\s]*\/?\>[\s]*)+/g, '<br>');
        return Response.success(content)
    }
}