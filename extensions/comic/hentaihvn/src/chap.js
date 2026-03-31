load('config.js');

function execute(url) {
    var browser = null;
    
    try {
        // Khởi tạo browser và load trang
        browser = Engine.newBrowser();
        browser.setUserAgent(UserAgent.android());
        
        // Launch trang với timeout 5 giây
        browser.launch(url, 5);
        
        // Cho trang có thời gian chạy JavaScript (5 giây)
        browser.callJs("", 5000);
        
        // Lấy HTML sau khi JavaScript đã render
        let doc = browser.html();
        var imgs = [];
        
        // Extract images from the reading-detail box_doc section
        let imgElements = doc.select(".reading-detail.box_doc .page-chapter img");
        
        // Nếu không tìm thấy, thử selector khác
        if (!imgElements || imgElements.size() === 0) {
            imgElements = doc.select("#image img");
        }
        
        // Nếu vẫn không có, lấy tất cả img
        if (!imgElements || imgElements.size() === 0) {
            imgElements = doc.select("img");
        }

        // Tìm tất cả img tags và lấy src
        imgElements.forEach(img => {
            let imageUrl = img.attr("src");
            
            // Nếu không có src, thử data-src
            if (!imageUrl || imageUrl.trim() === "") {
                imageUrl = img.attr("data-src");
            }
            
            // Kiểm tra xem URL có phải ảnh hợp lệ không
            if (imageUrl && imageUrl.trim() !== "") {
                // Lọc bỏ logo và ảnh không phải content
                if (imageUrl.indexOf("logo") < 0 && 
                    imageUrl.indexOf("avatar") < 0 &&
                    imageUrl.indexOf("icon") < 0) {
                    
                    imageUrl = normalizeImageUrl(imageUrl);
                    
                    if (!imgs.includes(imageUrl)) {
                        imgs.push(imageUrl);
                    }
                }
            }
        });
        
        // Nếu không tìm thấy ảnh từ HTML, thử extract từ script
        if (imgs.length === 0) {
            let scriptText = doc.html();
            let cdn1Match = scriptText.match(/var cdn1 = '(.+?)';/);
            if (cdn1Match) {
                try {
                    let imageUrls = JSON.parse(cdn1Match[1]);
                    if (Array.isArray(imageUrls)) {
                        imgs = imageUrls.map(url => normalizeImageUrl(url));
                    }
                } catch (e) {
                    // Ignore JSON parsing errors
                }
            }
        }
        
        // Sắp xếp ảnh theo số thứ tự
        if (imgs.length > 1) {
            imgs.sort((a, b) => {
                let aNum = extractImageNumber(a);
                let bNum = extractImageNumber(b);
                return aNum - bNum;
            });
        }
        
        // Đóng browser
        browser.close();
        
        // Trả về kết quả
        if (imgs.length > 0) {
            return Response.success(imgs);
        } else {
            return Response.error("Không tìm thấy ảnh tại: " + url);
        }
        
    } catch (e) {
        // Đảm bảo đóng browser nếu có lỗi
        if (browser) {
            try {
                browser.close();
            } catch (closeError) {
                // Ignore
            }
        }
        return Response.error("Lỗi: " + e.message);
    }
}

function normalizeImageUrl(imageUrl) {
    // Ensure full URL for images
    if (imageUrl.startsWith("//")) {
        return "https:" + imageUrl;
    } else if (imageUrl.startsWith("/")) {
        return BASE_URL.replace(/\/$/, '') + imageUrl;
    } else if (!imageUrl.startsWith("http")) {
        return BASE_URL + imageUrl;
    }
    return imageUrl;
}

function extractImageNumber(url) {
    // Extract number from URL for sorting (e.g., /0.png -> 0, /15.png -> 15)
    let match = url.match(/\/(\d+)\.(?:jpg|jpeg|png|gif|webp)/i);
    return match ? parseInt(match[1]) : 999999;
}