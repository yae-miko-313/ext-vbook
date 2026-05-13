load('config.js');

function execute() {
    return Response.success([
        { title: "Trung Quốc", input: BASE_URL + "/quoc-gia/trung-quoc", script: "gen.js" },
        { title: "Hàn Quốc", input: BASE_URL + "/quoc-gia/han-quoc", script: "gen.js" },
        { title: "Nhật Bản", input: BASE_URL + "/quoc-gia/nhat-ban", script: "gen.js" },
        { title: "Âu - Mỹ", input: BASE_URL + "/quoc-gia/au-my", script: "gen.js" },
        { title: "Thái Lan", input: BASE_URL + "/quoc-gia/thai-lan", script: "gen.js" },
        { title: "Chính kịch", input: BASE_URL + "/the-loai/chinh-kich", script: "gen.js" },
        { title: "Cổ trang", input: BASE_URL + "/the-loai/co-trang", script: "gen.js" },
        { title: "Hành động", input: BASE_URL + "/the-loai/hanh-dong", script: "gen.js" },
        { title: "Tình cảm", input: BASE_URL + "/the-loai/tinh-cam", script: "gen.js" },
        { title: "Hoạt hình", input: BASE_URL + "/the-loai/hoat-hinh", script: "gen.js" },
        { title: "Kinh dị", input: BASE_URL + "/the-loai/kinh-di", script: "gen.js" },
        { title: "Hài hước", input: BASE_URL + "/the-loai/hai-huoc", script: "gen.js" }
    ]);
}
