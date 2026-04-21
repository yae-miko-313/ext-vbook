load("config.js");

function execute() {
  // // Build genre list from tags + specific menus (Video Cosplay + Level Cosplay)
  // let res = fetch(BASE_URL + '/explore-categories/', { method: 'GET' });
  // if (!res.ok) {
  //     return Response.error('Failed to load explore-categories');
  // }
  // let doc = res.html();
  // let genres = [];
  // let seen = {};

  // function pushAnchor(a) {
  //     if (!a) return;
  //     let href = a.attr('href');
  //     if (!href) return;
  //     href = href.replace(BASE_URL, '');
  //     if (!href.startsWith('/')) href = '/' + href;
  //     // Only accept tags and the specified categories
  //     if (!(href.indexOf('/tag/') === 0 || href.indexOf('/category/video-cosplay/') === 0 || href.indexOf('/category/cosplay-ero/') === 0 || href.indexOf('/category/nude/') === 0)) {
  //         return;
  //     }
  //     if (seen[href]) return;
  //     seen[href] = true;
  //     // Prefer <strong> text when present (especially for tag links)
  //     let strongEl = a.select('strong').first();
  //     let title = (href.indexOf('/tag/') === 0 && strongEl) ? strongEl.text() : a.text();
  //     if (!title) title = href;
  //     genres.push({ title: title, input: href, script: 'gen.js' });
  // }

  // // From page content (tags)
  // doc.select('a[href*="/tag/"]').forEach(pushAnchor);

  // // From header menus (Video Cosplay + Level Cosplay submenu)
  // // Using broad selection on the same document since header is present
  // doc.select('a[href*="/category/video-cosplay/"]').forEach(pushAnchor);
  // doc.select('a[href*="/category/cosplay-ero/"]').forEach(pushAnchor);
  // doc.select('a[href*="/category/nude/"]').forEach(pushAnchor);

  let genres = [
    {
      input: "/tag/wuthering-waves/",
      title: "Wuthering Waves",
      script: "gen.js",
    },
    {
      input: "/tag/honkai-star-rail/",
      title: "Honkai Star Rail",
      script: "gen.js",
    },
    {
      input: "/tag/nikke/",
      title: "Nikke",
      script: "gen.js",
    },
    {
      input: "/tag/blue-archive/",
      title: "Blue Archive",
      script: "gen.js",
    },
    {
      input: "/tag/league-of-legends/",
      title: "League of Legends",
      script: "gen.js",
    },
    {
      input: "/tag/final-fantasy/",
      title: "Final Fantasy",
      script: "gen.js",
    },
    {
      input: "/tag/arknights/",
      title: "Arknights",
      script: "gen.js",
    },
    {
      input: "/tag/valorant/",
      title: "Valorant",
      script: "gen.js",
    },
    {
      input: "/tag/rezero/",
      title: "Rezero",
      script: "gen.js",
    },
    {
      input: "/tag/nierautomata/",
      title: "NieR Automata",
      script: "gen.js",
    },
    {
      input: "/tag/sono-bisque-doll/",
      title: "Sono Bisque Doll",
      script: "gen.js",
    },
    {
      input: "/tag/spy-x-family/",
      title: "Spy x Family",
      script: "gen.js",
    },
    {
      input: "/tag/dead-or-alive/",
      title: "Dead or Alive",
      script: "gen.js",
    },
    {
      input: "/tag/chainsaw-man/",
      title: "Chainsaw Man",
      script: "gen.js",
    },
    {
      input: "/tag/kimetsu-no-yaiba/",
      title: "Kimetsu no Yaiba",
      script: "gen.js",
    },
    {
      input: "/tag/evangelion/",
      title: "Evangelion",
      script: "gen.js",
    },
    {
      input: "/tag/bocchi-the-rock/",
      title: "Bocchi the Rock",
      script: "gen.js",
    },
    {
      input: "/tag/overlord/",
      title: "Overlord",
      script: "gen.js",
    },
    {
      input: "/tag/maid/",
      title: "Maid",
      script: "gen.js",
    },
    {
      input: "/tag/school-girl/",
      title: "School Girl",
      script: "gen.js",
    },
    {
      input: "/tag/elf/",
      title: "Elf",
      script: "gen.js",
    },
    {
      input: "/tag/nun/",
      title: "Nun",
      script: "gen.js",
    },
    {
      input: "/tag/nurse/",
      title: "Nurse",
      script: "gen.js",
    },
    {
      input: "/tag/miko/",
      title: "Miko",
      script: "gen.js",
    },
    {
      input: "/tag/cheongsam/",
      title: "Cheongsam",
      script: "gen.js",
    },
    {
      input: "/tag/hololive/",
      title: "Hololive",
      script: "gen.js",
    },
    {
      input: "/tag/devil/",
      title: "Devil",
      script: "gen.js",
    },
    {
      input: "/tag/kimono/",
      title: "Kimono",
      script: "gen.js",
    },
    {
      input: "/tag/bunny-girl/",
      title: "Bunny Girl",
      script: "gen.js",
    },
    {
      input: "/tag/hatsune-miku/",
      title: "Hatsune Miku",
      script: "gen.js",
    },
    {
      input: "/category/video-cosplay/",
      title: "Video Cosplay",
      script: "gen.js",
    },
    {
      input: "/category/cosplay-ero/",
      title: "Cosplay Ero",
      script: "gen.js",
    },
    {
      input: "/category/nude/",
      title: "Cosplay Nude",
      script: "gen.js",
    },
  ];
  Console.log(genres.length);

  return Response.success(genres);
}
