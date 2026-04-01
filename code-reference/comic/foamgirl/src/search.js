load('config.js');
function execute(key, page) {
  if (!page) page = "1";
    url = BASE_URL + "/page/" + page + "?post_type=post&s=" + key;
  let response = fetch(url, {method: "GET"})
  if (response.ok) {
    let doc = response.html();
    Console.log(doc)
    let data = [];
    doc.select("ul#index_ajax_list > li").forEach(e => {
            data.push({
                name: e.select(".meta-title").text(),
                link: e.select(".meta-title").attr("href").replace(BASE_URL, ''),
                cover: e.select("img").attr('data-original'),
            })
        });
        var next = doc.select(".next.page-numbers").first().attr("href").match(/page\/(\d+)/)
        if (next) next = next[1]; else next = '';
    return Response.success(data, next);
  }
  return null;
}
