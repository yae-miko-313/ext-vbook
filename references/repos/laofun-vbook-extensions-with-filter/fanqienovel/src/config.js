let homepage = "https://fanqienovel.com";
let config_host = homepage;
let config_token = "vbook.app";

if (typeof host !== "undefined") {
  config_host = host;
}
if (typeof token !== "undefined") {
  config_token = token;
}

let replaceCover = (u) => {
  if (u.startsWith("https://")) u = u.substring(8);
  else u = u.substring(7);
  let uArr = u.split("/");
  uArr[0] = "https://i0.wp.com/p6-novel.byteimg.com/origin";
  let uArr2 = [];
  uArr.forEach((x) => {
    if (!x.includes("?") && !x.includes("~")) uArr2.push(x);
    else uArr2.push(x.split("~")[0]);
  });
  u = uArr2.join("/");
  return u;
};
