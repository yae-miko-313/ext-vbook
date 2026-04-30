function execute(url) {
	var browser = Engine.newBrowser();
	browser.setUserAgent(UserAgent.chrome()); // Tùy chỉnh user agent
	var doc = browser.launch(url, 5000);
	browser.close();
	var htm = doc.select(".read-content").html();
	return Response.success(htm);
}