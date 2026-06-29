load("config.js");

function execute(url) {
  var chapUrl = resolveUrl(url);
  var browser = Engine.newBrowser();
  browser.setUserAgent(UserAgent.ios()); // Tùy chỉnh user agent
  var doc = browser.launch(chapUrl, 15000);
  browser.close();
  var imgs = doc.select('img[src*="cdn."]');
  if (imgs.size() === 0)
    return Response.error("Mở browser lên mà verify Cloudflare đi bạn ơi");

  var data = [];
  for (var i = 0; i < imgs.size(); i++) {
    var src = imgs.get(i).attr("src") || "";
    if (!src || src.indexOf("http") !== 0) continue;
    data.push(src);
  }

  if (data.length === 0)
    return Response.error("Không có ảnh trong chương (liên hệ tác giả)");
  return Response.success(data);
}
