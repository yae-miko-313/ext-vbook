load("config.js");

function execute(url) {
	// hls thì lỗi link, embed thì vbook có vẻ chưa hỗ trợ
		return Response.error("Đang tìm hiểu, chưa hỗ trợ");
		// return Response.success({
		// 		data: "https://embed15.streamc.xyz/embed.php?hash=9e253800cde588cb4daaf91749b28a4f",
		// 		type: "auto",
		// 		headers: {
		// 				"User-Agent": "Mozilla/5.0 (Linux; Android 13)",
		// 				"Referer": BASE_URL + "/"
		// 		},
		// 		host: BASE_URL,
		// 		timeSkip: []
		// });
}
