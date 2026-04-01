load('config.js');
function execute(url) {
    let [raw_url, action_token] = url.split('|')
    let response = fetch(raw_url, {
    headers: {
        'Referer': BASE_URL,
        'Token': action_token
    }
    });
    if (response.ok) {
        return Graphics.createImage(response.base64())
    }

    return null;
}