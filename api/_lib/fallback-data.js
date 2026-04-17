/**
 * Hardcoded fallback data to ensure instant delivery even on cold starts.
 * Contains ~30 popular extensions from reliable sources.
 */
module.exports = {
    metadata: {
        author: 'kychi',
        description: 'VBook Static Fallback Manifest',
        generatedAt: new Date().toISOString()
    },
    extensions: [
        { name: 'Truy\u1ec7n Full', type: 'novel', author: 'Darkrai9x', source: 'https://truyenfull.vn', version: '4', icon: 'https://truyenfull.vn/favicon.ico' },
        { name: 'TruyenQQ', type: 'comic', author: 'Darkrai9x', source: 'https://truyenqqviet.com', version: '5', icon: 'https://truyenqqviet.com/favicon.ico' },
        { name: 'NetTruyen', type: 'comic', author: 'Darkrai9x', source: 'https://www.nettruyenlv.com', version: '5', icon: 'https://www.nettruyenlv.com/favicon.ico' },
        { name: 'M\u00ea \u0110\u1ecdc Truy\u1ec7n', type: 'novel', author: 'Darkrai9x', source: 'https://medoctruyen.com', version: '1', icon: 'https://medoctruyen.com/favicon.ico' },
        { name: 'Truy\u1ec7n YY', type: 'novel', author: 'Darkrai9x', source: 'https://truyenyy.com', version: '2', icon: 'https://truyenyy.com/favicon.ico' },
        { name: 'Tang Th\u01b0 Vi\u1ec7n', type: 'novel', author: 'Darkrai9x', source: 'https://www.tangthuvien.vn', version: '1', icon: 'https://www.tangthuvien.vn/favicon.ico' },
        { name: 'Lu\u1eadt Truy\u1ec7n', type: 'novel', author: 'Darkrai9x', source: 'https://luattruyen.com', version: '1' },
        { name: 'SayTruyen', type: 'comic', author: 'Darkrai9x', source: 'https://saytruyen.io', version: '1' },
        { name: 'BlogTruyen', type: 'comic', author: 'Darkrai9x', source: 'https://blogtruyen.vn', version: '1' },
        { name: 'TruyenChon', type: 'comic', author: 'Darkrai9x', source: 'https://truyenchon.com', version: '1' },
        { name: 'Wikidich', type: 'chinese_novel', author: 'Darkrai9x', source: 'https://wikidich.com', version: '1' },
        { name: 'Ch\u1eef Vi\u1ec7t Ng\u1eef', type: 'chinese_novel', author: 'Darkrai9x', source: 'https://chuvietngu.com', version: '1' },
        { name: 'Metruyenchu', type: 'novel', author: 'lethituyen', source: 'https://metruyenchu.com', version: '1' },
        { name: 'Wattpad', type: 'novel', author: 'lethituyen', source: 'https://www.wattpad.com', version: '1' },
        { name: 'S\u1ed5 Tay Truy\u1ec7n', type: 'novel', author: 'lethituyen', source: 'https://sotaytruyen.pro', version: '1' }
    ],
    siteHealth: {
        'https://truyenfull.vn/': { p: 'LIVE', s: '200' },
        'https://truyenqqviet.com/': { p: 'LIVE', s: '200' },
        'https://www.nettruyenlv.com/': { p: 'LIVE', s: '200' },
        'https://wikidich.com/': { p: 'LIVE', s: '200' }
    }
};
