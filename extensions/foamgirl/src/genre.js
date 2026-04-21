load('config.js');

function execute() {
    let resName = [
        'Chinese', 'Japan', 'Korea', 'Cosplay'
    ]
    let resList = [
        fetch(BASE_URL + '/chinese/'),
        fetch(BASE_URL + '/japan/'),
        fetch(BASE_URL + '/korea/'),
        fetch(BASE_URL + '/cosplay/'),
    ]
    let genres = [];
    for(let i = 0; i<4; i++)
    {
        let res = resList[i];
        let doc = res.html();
    
        doc.select('.fl_list.sx-tag-all .fl_link').forEach(tag => {
            if(tag.text() != "ALL") {
                genres.push({
                    title: resName[i] + ' - ' + tag.text(),
                    input: tag.attr('href').replace(BASE_URL, ''), 
                    script: "gen.js"

                })
            }
        })
    }
    return Response.success(genres)
}