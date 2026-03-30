load("language_list.js");

function execute() {
    return Response.success(languages);
}
function getLanguage(lang) {
    if (!lang) return "auto";
    var langMap = {
        "zh_CN": "zh-CN",
        "zh": "zh-CN",
        "vi_VN": "vi",
        "en_US": "en",
        "en": "en"
    };
    return langMap[lang] || lang;
}
