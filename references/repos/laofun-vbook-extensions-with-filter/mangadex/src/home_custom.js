load("config.js");
function execute(url, page) {
  let next = null;
  let novelList = [];

  novelList.push({
    name: "One Piece [VI]",
    link: "https://mangadex.org/title/a1c7c817-4e59-43b7-9365-09675a149a6f?lang=vi",
    cover: "https://mangadex.org/covers/a1c7c817-4e59-43b7-9365-09675a149a6f/17f8c157-ae5c-4702-a762-11bc2c8b8c64.jpg.512.jpg",
    host: BASE_URL,
  });
  novelList.push({
    name: "One Piece [EN]",
    link: "https://mangadex.org/title/a1c7c817-4e59-43b7-9365-09675a149a6f?lang=en",
    cover: "https://mangadex.org/covers/a1c7c817-4e59-43b7-9365-09675a149a6f/17f8c157-ae5c-4702-a762-11bc2c8b8c64.jpg.512.jpg",
    host: BASE_URL,
  });
  novelList.push({
    name: "Detective Conan",
    link: "https://mangadex.org/title/7f30dfc3-0b80-4dcc-a3b9-0cd746fac005",
    cover: "https://mangadex.org/covers/7f30dfc3-0b80-4dcc-a3b9-0cd746fac005/b65b80fa-217c-4a71-8e8f-5d647990117a.jpg.512.jpg",
    host: BASE_URL,
  });
  novelList.push({
    name: "Doremon",
    link: "https://mangadex.org/title/e36da8b0-feca-46dd-9120-d5dc2f3feae8",
    cover: "https://mangadex.org/covers/e36da8b0-feca-46dd-9120-d5dc2f3feae8/336e7d29-d8dd-4357-b9fb-10b14e2ae933.jpg.512.jpg",
    host: BASE_URL,
  });
  novelList.push({
    name: "Dragon Ball (Official Colored)",
    link: "https://mangadex.org/title/af0527c1-8734-4498-b128-7090340bc10d/dragon-ball",
    cover: "https://mangadex.org/covers/af0527c1-8734-4498-b128-7090340bc10d/74af82cd-d605-4600-a697-64b2cc96d01b.jpg.512.jpg",
    host: BASE_URL,
  });
  novelList.push({
    name: "Dragon Ball (Official Colored)[EN]",
    link: "https://mangadex.org/title/af0527c1-8734-4498-b128-7090340bc10d/dragon-ball?lang=en",
    cover: "https://mangadex.org/covers/af0527c1-8734-4498-b128-7090340bc10d/74af82cd-d605-4600-a697-64b2cc96d01b.jpg.512.jpg",
    host: BASE_URL,
  });
  novelList.push({
    name: "Naruto",
    link: "https://mangadex.org/title/6b1eb93e-473a-4ab3-9922-1a66d2a29a4a/naruto",
    cover: "https://mangadex.org/covers/6b1eb93e-473a-4ab3-9922-1a66d2a29a4a/bb223226-a5ca-457b-8a10-ad3ecaea66be.jpg.512.jpg",
    host: BASE_URL,
  });
  novelList.push({
    name: "One-Punch Man",
    link: "https://mangadex.org/title/d8a959f7-648e-4c8d-8f23-f1f3f8e129f3/one-punch-man",
    cover: "https://mangadex.org/covers/d8a959f7-648e-4c8d-8f23-f1f3f8e129f3/ca1052ff-4fcf-44d2-8020-f66e07cc28ce.jpg.512.jpg",
    host: BASE_URL,
  });
  
  return Response.success(novelList, next);
}
