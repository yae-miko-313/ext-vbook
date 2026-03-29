load("language_list.js");

function execute(text) {
    return translateContent(text, 0);
}

function translateContent(text, retryCount) {
    if (retryCount > 2) return null;
    let url = 'https://xombot.b3x0m.us.kg/dich';
    let response = fetch(url, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: text })
    });
    if (response.ok) {
        let result = response.json();
        return Response.success(result.text.trim());
    }
    return translateContent(text, retryCount + 1);
}