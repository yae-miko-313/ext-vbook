load("voice_list.js");

// sleep(ms) là hàm native của vBook JSBridge

function isValidVoice(voiceId) {
    var i;
    for (i = 0; i < voices.length; i++) {
        if (voices[i].id === voiceId) {
            return true;
        }
    }
    return false;
}

/**
 * Parse danh sách token từ chuỗi api_keys (mỗi dòng 1 token).
 * Lọc bỏ dòng trống và khoảng trắng thừa.
 */
function parseTokenList() {
    if (typeof api_keys === "undefined" || !api_keys) {
        return [];
    }
    var raw = String(api_keys);
    var lines = raw.split(/[\r\n]+/);
    var result = [];
    var i;
    for (i = 0; i < lines.length; i++) {
        var token = lines[i].trim();
        if (token) {
            result.push(token);
        }
    }
    return result;
}

/**
 * Lấy index token hiện tại từ cache, tăng round-robin cho lần sau.
 */
function pickTokenIndex(totalTokens) {
    var CACHE_KEY = "viettelai_tts_token_index";
    var idx = 0;
    try {
        var cached = cacheStorage.getItem(CACHE_KEY);
        if (cached !== null && cached !== undefined) {
            idx = parseInt(cached, 10) || 0;
        }
    } catch (e) {
        idx = 0;
    }
    if (idx < 0 || idx >= totalTokens) {
        idx = 0;
    }
    var next = (idx + 1) % totalTokens;
    try {
        cacheStorage.setItem(CACHE_KEY, String(next));
    } catch (e) {
    }
    return idx;
}

function cleanInput(text) {
    return (text || "")
        .replace(/[@^*()\\/\-_+=><"'\u201c\u201d\u3010\u3011]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Gọi Viettel AI TTS API với 1 token cụ thể.
 * Response thành công: binary audio → dùng .base64() ngay, không cần poll.
 * Response thất bại: JSON { code, vi_message, en_message }.
 * Trả về base64 string nếu thành công, null nếu thất bại.
 */
function callViettelApi(token, cleanText, voice) {
    try {
        var bodyObj = {
            "text": cleanText,
            "voice": voice,
            "speed": 1.0,
            "tts_return_option": 3,
            "token": token,
            "without_filter": false
        };

        var ttsResponse = fetch("https://viettelai.vn/tts/speech_synthesis", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "accept": "*/*"
            },
            body: JSON.stringify(bodyObj)
        });

        if (!ttsResponse.ok) {
            // Thử parse lỗi JSON từ server
            return null;
        }

        // Response thành công trả binary audio trực tiếp
        var base64Data = ttsResponse.base64();
        if (base64Data && base64Data.length > 100) {
            return base64Data;
        }
    } catch (e) {
    }
    return null;
}

function execute(text, voice) {
    var cleanText = cleanInput(text);

    if (!cleanText) {
        return Response.error("Nội dung văn bản trống");
    }

    var tokenList = parseTokenList();
    if (tokenList.length === 0) {
        return Response.error("Thiếu token Viettel AI. Vui lòng nhập token tại viettelai.vn/dashboard/token vào cài đặt extension.");
    }

    var selectedVoice = isValidVoice(voice) ? voice : "hn-quynhanh";

    // Chọn token theo round-robin, thử tất cả nếu token đầu thất bại
    var startIdx = pickTokenIndex(tokenList.length);
    var base64Audio = null;
    var i;
    for (i = 0; i < tokenList.length; i++) {
        var tokenIdx = (startIdx + i) % tokenList.length;
        base64Audio = callViettelApi(tokenList[tokenIdx], cleanText, selectedVoice);
        if (base64Audio) {
            break;
        }
    }

    if (!base64Audio) {
        return Response.error("Không lấy được audio từ Viettel AI. Kiểm tra token và kết nối mạng.");
    }

    return Response.success(base64Audio);
}
