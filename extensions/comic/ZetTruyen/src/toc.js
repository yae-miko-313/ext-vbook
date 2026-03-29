function execute(url) {
    // Lấy slug từ URL truyện
    let parts = url.split('/').filter(Boolean);
    let slug = parts.pop();
    
    let list = [];
    let page = 1;
    let hasNext = true;

    while (hasNext) {
        let apiUrl = "https://www.zettruyen.africa/api/comics/" + slug + "/chapters?page=" + page + "&per_page=50&order=desc";
        
        let response = fetch(apiUrl, {
            headers: {
                "x-requested-with": "XMLHttpRequest",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
            }
        });

        if (response.ok) {
            // Dùng .text() thay vì .string() để lấy nội dung
            let content = response.text(); 
            
            // Tìm mảng chapters trong chuỗi bằng cách cắt chuỗi
            if (content.indexOf('"chapters":[') !== -1) {
                let jsonPart = content.split('"chapters":[')[1].split('],"total"')[0];
                let chapterBlocks = jsonPart.split('},{');

                for (let i = 0; i < chapterBlocks.length; i++) {
                    let block = chapterBlocks[i];
                    
                    // Trích xuất chapter_name
                    let name = block.split('"chapter_name":"')[1].split('"')[0];
                    // Trích xuất chapter_slug
                    let cSlug = block.split('"chapter_slug":"')[1].split('"')[0];

                    list.push({
                        name: name,
                        url: "https://www.zettruyen.africa/truyen-tranh/" + slug + "/" + cSlug,
                        host: "https://www.zettruyen.africa"
                    });
                }

                // Kiểm tra xem còn trang kế tiếp không bằng cách so sánh current_page và last_page trong chuỗi
                let currentPage = content.split('"current_page":')[1].split(',')[0];
                let lastPage = content.split('"last_page":')[1].split('}')[0].replace('}', '');
                
                if (parseInt(currentPage) < parseInt(lastPage)) {
                    page++;
                } else {
                    hasNext = false;
                }
            } else {
                hasNext = false;
            }
        } else {
            hasNext = false;
        }
    }

    // Đảo ngược để Chapter 1 lên đầu và trả về kết quả
    return Response.success(list.reverse());
}