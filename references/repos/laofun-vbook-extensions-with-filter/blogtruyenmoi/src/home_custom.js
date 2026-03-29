load("config.js");
function execute(url, page) {
  let next = null;
  let novelList = [];

  novelList.push({
    name: "Detective Conan",
    link: "https://blogtruyenmoi.com/118/conan",
    cover: "https://i7.xem-truyen.com/manga/0/118/5aa9edad51fb8ca9b7bc2df7c37be433.thumb_500x.jpg",
    host: BASE_URL,
  });
  novelList.push({
    name: "Doremon (1992)",
    link: "https://blogtruyenmoi.com/34266/doremon-1992",
    cover: "https://i7.xem-truyen.com/manga/34/34266/doraemon1.thumb_500x.jpg",
    host: BASE_URL,
  });
  novelList.push({
    name: "Đôrêmon Truyện Dài",
    link: "https://blogtruyenmoi.com/3533/doremon-truyen-dai",
    cover: "https://i7.xem-truyen.com/manga/3/3533/biatruyen.thumb_500x.jpg",
    host: BASE_URL,
  });
  
  novelList.push({
    name: "Dragon Ball Bản Đẹp",
    link: "https://blogtruyenmoi.com/41/dragon-ball-original",
    cover: "https://i7.xem-truyen.com/manga/0/41/990700-beautiful-dragon-ball-z-kai-wallpaper-1920x1080-windows-10.thumb_500x.jpg",
    host: BASE_URL,
  });
  novelList.push({
    name: "Dragon Ball Multiverse",
    link: "https://blogtruyenmoi.com/1190/dragon-ball-multiverse",
    cover: "https://i7.xem-truyen.com/manga/1/1190/biatruyen.thumb_500x.jpg",
    host: BASE_URL,
  });
  novelList.push({
    name: "Dr. Slump",
    link: "https://blogtruyenmoi.com/33185/dr-slump",
    cover: "https://i7.xem-truyen.com/manga/33/33185/slumpvol1p001.thumb_500x.png",
    host: BASE_URL,
  });
  novelList.push({
    name: "YuGi-Oh! Full Color Edition",
    link: "https://blogtruyenmoi.com/16751/yugi-oh-full-color-edition",
    cover: "https://i7.xem-truyen.com/manga/16/16751/0000cover22.thumb_500x.jpg",
    host: BASE_URL,
  });
  novelList.push({
    name: "Naruto",
    link: "https://blogtruyenmoi.com/133/naruto",
    cover: "https://i7.xem-truyen.com/manga/0/133/d7beb32a2ac6f8c8df1b7adbe6a1da75.thumb_500x.jpg",
    host: BASE_URL,
  });
  novelList.push({
    name: "Kattobi Itto [ Đường dẫn đến khung thành bộ 1 FULL]",
    link: "https://blogtruyenmoi.com/195/kattobi-itto",
    cover: "https://i7.xem-truyen.com/manga/0/195/itto-con-loc-san-co-tap-18-800-13567.thumb_500x.jpg",
    host: BASE_URL,
  });
  novelList.push({
    name: "Buttobi Itto",
    link: "https://blogtruyenmoi.com/249/buttobi-itto",
    cover: "https://i7.xem-truyen.com/manga/0/249/01-blogtruyencom.thumb_500x.jpg",
    host: BASE_URL,
  });
  novelList.push({
    name: "Ô Long Viện",
    link: "https://blogtruyenmoi.com/14013/o-long-vien-vc",
    cover: "https://i7.xem-truyen.com/manga/14/14013/biatruyen.thumb_500x.jpg",
    host: BASE_URL,
  });
  novelList.push({
    name: "Ô Long Viện Linh Vật Sống (Truyện dài)",
    link: "https://blogtruyenmoi.com/34021/o-long-vien-linh-vat-song-truyen-dai",
    cover: "https://i7.xem-truyen.com/manga/34/34021/1284.thumb_500x.png",
    host: BASE_URL,
  });
  novelList.push({
    name: "Ô Long Viện Tình Huynh Đệ",
    link: "https://blogtruyenmoi.com/15612/o-long-vien-tinh-huynh-de",
    cover: "https://i7.xem-truyen.com/manga/15/15612/biatruyen.thumb_500x.jpg",
    host: BASE_URL,
  });
  novelList.push({
    name: "Shin cậu bé bút chì",
    link: "https://blogtruyenmoi.com/221/shincau-be-but-chi-the-crayon-shin-chan",
    cover: "https://i7.xem-truyen.com/manga/0/221/00.thumb_500x.jpg",
    host: BASE_URL,
  });
  novelList.push({
    name: "One-Punch Man",
    link: "https://blogtruyenmoi.com/3415/onepunch-man",
    cover: "https://i7.xem-truyen.com/manga/3/3415/cv.thumb_500x.png",
    host: BASE_URL,
  });
  novelList.push({
    name: "Onepunch-Man x Dragon Ball",
    link: "https://blogtruyenmoi.com/16007/onepunch-man-x-dragon-ball",
    cover: "https://i7.xem-truyen.com/manga/16/16007/zrg09sh-je2j.thumb_500x.jpg",
    host: BASE_URL,
  });
  novelList.push({
    name: "Ninja Loạn Thị Bản Đẹp",
    link: "https://blogtruyenmoi.com/4870/ninja-loan-thi-ban-dep",
    cover: "https://i7.xem-truyen.com/manga/4/4870/rakudai-ninja-rantaro-manga1280x720.thumb_500x.png",
    host: BASE_URL,
  });

  novelList.push({
    name: "Dấu ấn rồng thiêng",
    link: "https://blogtruyenmoi.com/507/dau-an-rong-thieng",
    cover: "https://i7.xem-truyen.com/manga/0/507/drgon-quest.thumb_500x.jpg",
    host: BASE_URL,
  });
  novelList.push({
    name: "Siêu Quậy Teppi",
    link: "https://blogtruyenmoi.com/527/teppi",
    cover: "https://i7.xem-truyen.com/manga/0/527/00.thumb_500x.jpg",
    host: BASE_URL,
  });
  novelList.push({
    name: "Đội Quân Nhí nhố",
    link: "https://blogtruyenmoi.com/613/doi-quan-nhi-nho",
    cover: "https://i7.xem-truyen.com/manga/6/6582/00.thumb_500x.jpg",
    host: BASE_URL,
  });
  novelList.push({
    name: "Yaiba",
    link: "https://blogtruyenmoi.com/2635/yaiba-remake",
    cover: "https://i7.xem-truyen.com/manga/2/2635/biatruyen.thumb_500x.jpg",
    host: BASE_URL,
  });
  return Response.success(novelList, next);
}
