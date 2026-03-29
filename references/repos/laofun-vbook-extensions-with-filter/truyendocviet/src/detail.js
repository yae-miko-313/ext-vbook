function execute(url) {
    console.log(url)
    let htm = Http.get(url).string();
    if (htm) {
        var data = htm.match(/window\.__INITIAL_DATA__\s*=\s*({[\s\S]*?})<\/script>/);
        if (data) {
            console.log("Captured JSON string:", data[1]);
            data = JSON.parse(data[1]);
            console.log(data.UserAgent);
        }
    }
    
}