load('config.js');

function buildSuggests(authorUrl, firstGenreUrl, detailUrl) {
    var suggests = [];
    var seen = {};

    function pushSuggest(title, input) {
        input = normalizeUrl(input);
        if (!input || seen[input]) return;
        seen[input] = true;
        suggests.push({
            title: title,
            input: input,
            script: 'gen.js'
        });
    }

    if (authorUrl) {
        pushSuggest('Cùng tác giả/nhóm dịch', authorUrl);
    }

    return suggests;
}