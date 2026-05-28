// Vẽ lại ảnh nếu site mã hóa ảnh bằng cách trả về object { link: "URL ẢNH" + " " + JSON.stringify(DỮ LIỆU GIẢI MÃ), script: "image.js" }
// function execute(url) {
//     var parts = url.split(" ");
//     var response = fetch(parts[0]);
//     if (response.ok) {
//         var imageb64 = response.base64();
//         var image = Graphics.createImage(imageb64);
//         var imgWidth = image.width;
//         var imgHeight = image.height;
//         var canvas = Graphics.createCanvas(imgWidth, imgHeight);
//         JSON.parse(parts[1]).forEach(function(part) {
//             var sx = part[0];
//             var sy = part[1];
//             var sHeight = part[3];
//             var dx = part[4];
//             var dy = part[5];
//             var dHeight = part[7];
//             canvas.drawImage(image, sx, sy, imgWidth, sHeight, dx, dy, imgWidth, dHeight);
//         });
//         return canvas.capture();
//     }
//     return null;
// }

// Nếu site không mã hóa ảnh mà chỉ có cơ chế chống hotlink (bắt referer) → gán referer khi fetch ảnh
// function execute(url) {
//     var response = fetch(url, {
//         headers: {
//             'referer': 'https://webdemo.com/'
//         }
//     });
//     if (response.ok) {
//         return Graphics.createImage(response.base64());
//     }
//     return null;
// }
