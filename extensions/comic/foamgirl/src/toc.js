load('config.js');
function execute(url) {
    let id = url.match(/(\d+)\.html/)[1];
    let response= fetch(BASE_URL + '/' + id + ".html");
    if(response.ok){
        let doc = response.html();
        let data = [];
        let lastPage = doc.select('.nav-links [title="Last"]');
        if(lastPage.length){
            lastPage = lastPage.text();
           
            for(let i=1; i<=lastPage; i++)
            {
                data.push({
                    name: "Page: " + i,
                    url: '/' + id + "_" + i + ".html"
                })
            }
        } else {
            doc.select(".nav-links > *").forEach(item=> {
                if(item.select('.fa').length == 0 ){
                    let check = item.attr('class').match(/current/)
                    if(check){
                        data.push({
                            name: item.text(),
                            url: url.replace(BASE_URL, '')
                        })
                    }else {
                        data.push({
                            name: item.attr('title'),
                            url: item.attr('href').replace(BASE_URL, ''),
                        })
                    }
                }
            })
        }
        
        return Response.success(data);
    }   
    return Response.error("something went wrong")

}