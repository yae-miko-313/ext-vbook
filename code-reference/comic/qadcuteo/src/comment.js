load('config.js');
function execute(url, next) {
    let commentPage = next ? parseInt(next) : 1;

    let commentUrl = url;
    if (commentPage > 1) {
        commentUrl = url + "comment-page-" + commentPage + "/#comments";
    }

    let response = fetch(commentUrl);
    if (response.ok) {
        let doc = response.html();
        let results = [];

        doc.select('ol.comment-list > li.comment').forEach(e => {
            let name = e.select('.comment-author .heading').first().text().trim();

            let timeEl = e.select('.comment-metadata a');
            let time = '';
            if (timeEl.size() > 0) {
                time = timeEl.first().text().trim();
            }

            let contentEl = e.select('.comment-content');
            let content = contentEl.first().text().trim();

            let replies = e.select('ol.children > li.comment');
            if (replies.size() > 0) {
                replies.forEach(reply => {
                    let replyName = reply.select('.comment-author .heading').first().text().trim();
                    let replyContent = reply.select('.comment-content').first().text().trim();
                    content += '<br>↳ ' + replyName + '：' + replyContent;
                });
            }

            results.push({
                name: name,
                content: content,
                description: time
            });
        });

        let nextCommentPage = null;
        let nextLink = doc.select('.comment-navigation .nav-next a');
        if (nextLink.size() > 0) {
            nextCommentPage = (commentPage + 1).toString();
        }

        return Response.success(results, nextCommentPage);
    }
    return Response.error("Không thể tải comment");
}
