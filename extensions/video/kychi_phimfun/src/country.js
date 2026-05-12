load('config.js');

function execute() {
    return Response.success([
        { title: "Âu - Mỹ", input: BASE_URL + "/quoc-gia/au-my-1", script: "gen.js" },
        { title: "Trung Quốc - Hồng Kông", input: BASE_URL + "/quoc-gia/trung-quoc-hong-kong-1", script: "gen.js" },
        { title: "Hàn Quốc", input: BASE_URL + "/quoc-gia/han-quoc-1", script: "gen.js" },
        { title: "Nhật Bản", input: BASE_URL + "/quoc-gia/nhat-ban-1", script: "gen.js" },
        { title: "Ấn Độ", input: BASE_URL + "/quoc-gia/an-do-1", script: "gen.js" },
        { title: "Việt Nam", input: BASE_URL + "/quoc-gia/viet-nam-1", script: "gen.js" },
        { title: "Tổng hợp", input: BASE_URL + "/quoc-gia/tong-hop-1", script: "gen.js" }
    ]);
}
