load("config.js");

function execute(url) {
    url = normalizeLink(url);
		return Response.error("Đang tìm hiểu, chưa hỗ trợ");
    // if (!url) return Response.error("No track");

    // return Response.success({
		// 		data: url,
		// 		type: "auto",
		// 		headers: {
		// 			"User-Agent": "Mozilla/5.0 (Linux; Android 13)",
		// 			"Referer": BASE_URL + "/"
		// 		},
		// 		host: BASE_URL,
		// 		timeSkip: []
		// });
}