load('config.js');

function execute() {
  return Response.success([
    {
      title: "Latest",
      input: "/",
      script: "gen.js",
    },
    {
      input: "/24-hours",
      title: "Top View 1 Day",
      script: "top-view.js",
    },
    {
      input: "/3-day",
      title: "Top View 3 Day",
      script: "top-view.js",
    },
    {
      input: "/7-day",
      title: "Top View 7 Day",
      script: "top-view.js",
    },
    {
      input: "/15-day",
      title: "Top View 15 Day",
      script: "top-view.js",
    },
  ]);
}
