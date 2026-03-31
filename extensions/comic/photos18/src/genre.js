load('config.js');
function addFilter(listLatest) {
    let newList = []
    var sortCheck = [
        { name: "Latest", path: "created/" },
        { name: "Hottest", path: "hits/" },
        { name: "Trend", path: "views/" },
        { name: "REC.", path: "score/" },
        { name: "Best", path: "likes/" },
    ]
    for (let i = 0; i < listLatest.length; i++) {
        var element = listLatest[i]
        for (let j = 0; j < sortCheck.length; j++) {
            newList.push({
                title: element.title + ' - ' + sortCheck[j].name,
                input: element.input + sortCheck[j].path,
                script: "gen.js"
            })
        }
    }
    return newList
}
function execute() {
    let genres = [
        { title: "The best beauties", input: "/cat/11/", script: "gen.js" },
        { title: "Cool photo", input: "/cat/3/", script: "gen.js" },
        { title: "Sexy Passion", input: "/cat/7/", script: "gen.js" },
        { title: "European and American photos", input: "/cat/1/", script: "gen.js" },
        { title: "Beauty pictures", input: "/cat/5/", script: "gen.js" },
        { title: "Beautiful legs in stockings", input: "/cat/4/", script: "gen.js" },
        { title: "COSPLAY", input: "/cat/8/", script: "gen.js" },
        { title: "Asian beauties", input: "/cat/9/", script: "gen.js" },
        { title: "Amateur pretty girl", input: "/cat/6/", script: "gen.js" },
        { title: "Chinese", input: "/cat/17/", script: "gen.js" },
        { title: "European and American beauties", input: "/cat/10/", script: "gen.js" },
        { title: "Gravure", input: "/cat/12/", script: "gen.js" },
        { title: "Aidol", input: "/cat/13/", script: "gen.js" },
        { title: "Thailand", input: "/cat/16/", script: "gen.js" },
        { title: "Korea", input: "/cat/15/", script: "gen.js" },
        { title: "Domestic beauties", input: "/cat/21/", script: "gen.js" },
        { title: "Hong Kong and Taiwan beauties", input: "/cat/20/", script: "gen.js" },
        { title: "Magazine", input: "/cat/14/", script: "gen.js" },
        { title: "Japanese and Korean beauties", input: "/cat/19/", script: "gen.js" },
        { title: "Nightclub hotties", input: "/cat/2/", script: "gen.js" },
    ];
    let data = addFilter(genres);
    return Response.success(data)
}