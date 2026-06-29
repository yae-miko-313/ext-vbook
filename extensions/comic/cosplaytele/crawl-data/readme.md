Link homepage: https://cosplaytele.com
Home.js trả về 4 trang

- Mặc định: https://cosplaytele.com
- Video cosplay: https://cosplaytele.com/category/video-cosplay

detail.html -> detail.js, toc.js, chap.js

- detail.js ảnh cover lấy first pic
- toc.js chỉ có 1 chương tên: Gallery
- Chap.js lấy content ảnh trong thẻ div có class gallery

search.html -> search.js
url search: https://cosplaytele.com/?s=rina (tham khảo buondua search.js)

Về chuyển trang, mọi page đều sẽ dạng
.../page/2
(trang 1 vẫn có thể sử dụng điều đó, nên dùng luôn .../page/${page})

tags.html -> genre.js
thay vì fetch url, tạo 1 array sẵn render các tag, ví dụ
[
...
{
title: Wuthering Waves
url:https://cosplaytele.com/tag/wuthering-waves/
script: gen.js
}
]
ngoài các tag có sẵn trong tags.html
có thêm: Level cosplay, Video Cosplay
level cosplay có 3 sub tag: Cosplay Nude, Cosplay Ero, Cosplay
