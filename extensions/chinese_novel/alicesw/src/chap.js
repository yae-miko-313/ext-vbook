load('config.js');
function execute(url) {
	let response = fetch(url, {
		headers: {
			"user-agent": MOBILE_UA
		}
	});
	if (!response.ok) return Response.error("HTTP " + response.status);
	var htm = response.html().select(".content_txt").html();
	return Response.success(htm);
}
