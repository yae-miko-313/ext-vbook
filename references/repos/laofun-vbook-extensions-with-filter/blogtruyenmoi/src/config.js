// 45: 18+
// 2: Adult
// 48: Ecchi
// 12: Harem
// 14: Horror
// 20: Mature
// 62: NTR
// 24: Psychological
// 28: Seinen
// 34: Smut
// 35: Soft Yaoi
// 36: Soft Yuri
// 40: Tragedy
// 59: Yuri
// 58: Trap (Crossdressing)
var excludedIds = [45, 2, 48, 12, 14, 20, 62, 24, 28, 34, 35, 36, 40, 59, 58];
// Danh sách các tên thể loại không phù hợp cho trẻ em
var excludedCategories = {
    "18+": true,
    "Adult": true,
    "Ecchi": true,
    "Harem": true,
    "Horror": true,
    "Mature": true,
    "NTR": true,
    "Psychological": true,
    "Seinen": true,
    "Smut": true,
    "Soft Yaoi": true,
    "Soft Yuri": true,
    "Tragedy": true,
    "Yuri": true,
    "Trap (Crossdressing)": true,
};
let BASE_URL = 'https://blogtruyenmoi.com';
try {
    if (CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    }
} catch (error) {
}