load('config.js');

function execute(url) {
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html();
        let list = [url];
        
        let pagination = doc.select("a.page-numbers");
        if (pagination.size() > 0) {
            let lastPage = 1;
            pagination.forEach(function(el) {
                let p = parseInt(el.text());
                if (p > lastPage) lastPage = p;
            });
            
            let baseUrl = url;
            if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
            
            for (let p = 2; p <= lastPage; p++) {
                list.push(baseUrl + "/page/" + p + "/");
            }
        }
        return Response.success(list);
    }
    return null;
}
