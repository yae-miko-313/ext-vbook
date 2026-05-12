var BASE_URL = "https://v2.czyl.cf";
var FANQIE_URL = "https://fanqienovel.com";
var MOBILE_UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";

var Response = {
    success: function(data, next) {
        return JSON.stringify({ code: 0, data: data, data2: next });
    },
    error: function(data) {
        return JSON.stringify({ code: 1, data: String(data || '') });
    }
};

var Base64 = {
    _chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
    encode: function(str) {
        var out = '', i = 0, len = str.length;
        while (i < len) {
            var c1 = str.charCodeAt(i++) & 0xff;
            if (i == len) {
                out += this._chars.charAt(c1 >> 2);
                out += this._chars.charAt((c1 & 0x3) << 4);
                break;
            }
            var c2 = str.charCodeAt(i++) & 0xff;
            if (i == len) {
                out += this._chars.charAt(c1 >> 2);
                out += this._chars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
                out += this._chars.charAt((c2 & 0xF) << 2);
                break;
            }
            var c3 = str.charCodeAt(i++) & 0xff;
            out += this._chars.charAt(c1 >> 2);
            out += this._chars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
            out += this._chars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
            out += this._chars.charAt(c3 & 0x3F);
        }
        return out;
    },
    decode: function(str) {
        var out = '', i = 0, len = str.length;
        var map = {}; for (var j=0; j<64; j++) map[this._chars.charAt(j)] = j;
        while (i < len) {
            var b1 = map[str.charAt(i++)];
            var b2 = map[str.charAt(i++)];
            var b3 = map[str.charAt(i++)];
            var b4 = map[str.charAt(i++)];
            out += String.fromCharCode((b1 << 2) | (b2 >> 4));
            if (b3 !== undefined) out += String.fromCharCode(((b2 & 0xF) << 4) | (b3 >> 2));
            if (b4 !== undefined) out += String.fromCharCode(((b3 & 0x3) << 6) | b4);
        }
        return out;
    }
};

function getOriginalLink(bookId) {
    if (!bookId) return "";
    var id = String(bookId);
    if (/[a-zA-Z]/.test(id) && id.length > 10) {
        id = Base64.decode(id);
    }
    return FANQIE_URL + "/page/" + id;
}

function extractBookId(url) {
    var str = String(url || '');
    var m = str.match(/(?:book_id=|bookId=|page\/)([a-zA-Z0-9_-]+)/);
    var id = m ? m[1] : "";
    if (!id) return "";
    if (/^\d+$/.test(id)) {
        return Base64.encode(id);
    }
    return id;
}

function replaceCover(u) {
    if (!u) return "";
    var str = String(u);
    if (str.indexOf("http") === 0) return str;
    if (str.indexOf("//") === 0) return "https:" + str;
    return "https://p6-novel.byteimg.com/novel-pic/" + str;
}

function fetchWithUA(url, options) {
    var opt = options || {};
    opt.headers = opt.headers || {};
    opt.headers["User-Agent"] = MOBILE_UA;
    opt.headers["Accept"] = "application/json, text/plain, */*";
    return fetch(url, opt);
}

function getQtCookie() {
    try {
        var ck = String(localCookie.getCookie() || '');
        if (ck && ck.indexOf('qttoken') !== -1) return ck;
    } catch (e) {}
    return '';
}

function SafeJson(response) {
    if (!response) return null;
    try {
        if (typeof response.json === 'function') return response.json();
        if (typeof response.string === 'function') return JSON.parse(response.string());
        return JSON.parse(response);
    } catch (e) { return null; }
}

function decodeText(text) {
    if (!text) return "";
    var str = String(text);
    var CODE_ST = 58344, CODE_ED = 58715;
    var charset = ["体","y","十","现","快","便","话","却","月","物","水","的","放","知","爱","万","","表","风","理","O","老","也","p","常","克","平","几","最","主","她","s","将","法","情","o","光","a","我","呢","J","員","太","每","望","受","教","w","利","军","已","U","人","如","变","得","要","少","斯","门","电","m","男","没","A","K","国","时","中","走","么","何","口","小","向","问","轻","T","d","神","下","间","车","f","G","度","D","又","大","面","远","就","写","j","給","通","起","实","E","","它","去","S","到","道","數","吃","們","加","P","是","無","把","事","西","多","界","","發","新","外","活","解","孩","只","作","前","Y","爾","經","","u","心","告","父","等","Q","民","全","這","9","果","安","","i","母","8","r","說","任","先","和","地","C","張","戰","場","g","像","c","q","你","使","","樣","總","目","x","性","處","音","頭","","應","樂","關","能","花","l","當","名","手","4","重","字","聲","力","友","然","生","代","內","里","本","回","真","入","師","象","","0","點","R","親","V","種","動","英","命","Z","h","X","做","特","邊","高","有","B","為","期","自","年","馬","認","出","接","至","H","正","方","感","所","明","者","稜","F","住","學","還","分","意","更","其","n","但","比","覺","以","由","死","家","讓","失","士","L","2","I","金","叫","身","報","聽","W","再","原","山","海","白","很","見","5","直","位","第","工","個","開","歲","好","用","都","于","可","同","3","次","四","","日","信","与","女","笑","滿","部","什","不","从","或","机","此","","了","記","三","e","些","b","N","夫","會","才","兒","眼","兩","美","被","一","公","來","立","z","長","對","己","看","k","許","因","相","色","後","往","打","結","格","過","世","氣","7","子","條","探","書","之","定","v","拉","成","進","帶","著","東","上","想","天","他","媽","1","文","而","路","那","別","德","6","M","t","行","候","難"];
    var result = "";
    for (var i = 0; i < str.length; i++) {
        var cc = str.charCodeAt(i);
        if (cc >= CODE_ST && cc <= CODE_ED) {
            var bias = cc - CODE_ST;
            if (bias >= 0 && bias < charset.length && charset[bias]) {
                result += charset[bias];
            } else { result += str.charAt(i); }
        } else { result += str.charAt(i); }
    }
    return result;
}
