load('config.js');
function execute() {
    return Response.success([
        {
            title: "Library",
            script: "home_custom.js",
            input: "/home"
        },
    ]);
}
