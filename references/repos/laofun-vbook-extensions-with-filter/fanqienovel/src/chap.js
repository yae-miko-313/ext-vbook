load("config.js");

function execute(url) {
  const regex = /(?:item_id=|\/)(\d+)$/;
  let chapid = url.match(regex)[1];
  let chapterUrl = config_host + "/content?item_id=" + chapid;
  let response = fetch(chapterUrl, {
    headers: {
      Authorization: "Bearer " + config_token,
    },
  });
  if (response.ok) {
    let json = response.json();
    let content = json.data.data.content
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<h1[\s\S]*?<\/h1>/gi, "")
      .replace(/<br\s*\/?>|\n/g, "<br><br>");
    return Response.success(content);
  }

  return null;
}
