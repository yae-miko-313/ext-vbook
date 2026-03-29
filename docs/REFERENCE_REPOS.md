# VBook Extension Reference Repositories

This document catalogs all reference repositories cloned into `/references/repos/` for extension development research and pattern analysis.

## Purpose

These repositories serve as learning resources to:
- Understand real-world extension patterns and implementation variations
- Discover site-specific parsing strategies and selectors
- Identify best practices and common pitfalls
- Reference existing solutions when developing new extensions

**⚠️ Important**: Learn from these repos but **DO NOT blindly copy**. Always:
1. Verify patterns against the live target website
2. Ensure compliance with project rules in [AI_CODE_EXT_VBOOK.md](./AI_CODE_EXT_VBOOK.md) and [vbook_demo.md](./vbook_demo.md)
3. Follow the Rhino/jsoup constraints documented in VBOOK_CTX

---

## Reference Repositories

### Primary Collections

These are comprehensive extension libraries with many implementations:

| Repository | GitHub | Purpose | Extensions Count |
|------------|--------|---------|------------------|
| **darkrai9x-vbook-extensions** | [darkrai9x/vbook-extensions](https://github.com/Darkrai9x/vbook-extensions) | Broad catalog with downstream-style patterns; primary reference for community standards | 50+ |
| **dat-bi-ext-vbook** | [dat-bi/ext-vbook](https://github.com/dat-bi/ext-vbook) | Maintained library with modern patterns and tooling; mirrors community best practices | 30+ |
| **dat-bi-vbook-ext** | [dat-bi/vbook-ext](https://github.com/dat-bi/vbook-ext) | Additional collection; tooling and boilerplate examples | Multiple |

### Regional/Community Contributors

Extensions maintained by individual developers and groups:

| Author | Repository | Focus Areas |
|--------|-----------|------------|
| alexsonxxx | alexsonxxx-vbook | Community extensions variant |
| b3x0m | b3x0m-vbook-ext | Multiple site implementations (520danmei, hiepnu, nhentaione, truyenlh, uuxs, xbanxia, xombot) |
| banquyy | banquyy-vbook | Multiple sources (ddxsfix, plhydp, ttkan, Twfanti) |
| baobao666888 | baobao666888-ext-vbook-w | Wide collection (256wx, dualeotruyen, ixdzs, sanyteam, tushumi.cc, ungtycomics) |
| chanhnh | chanhnh-vbook-ext | fqweb implementations |
| duongden | duongden-vbook | Community collection |
| evamirion | evamirion-vbook-ext | Community extensions |
| hajljnopera | hajljnopera-vbook-ext | Community extensions |
| hienpro00123 | hienpro00123-vbook_meou | Community variants |
| hieu45666 | hieu45666-vbook_ext | Community extensions |
| hishirooo | hishirooo-vbook-ext | Community extensions |
| khoa301020 | khoa301020-vbook-ext | Community extensions |
| laofun | laofun-vbook-extensions-with-filter | Extensions with filtering features |
| lethituyen | lethituyen-vbooks-extension | Community extension library |
| mizhm | mizhm-vbook-extensions | Community extensions |
| moleys | moleys-vbook-ext | Community extensions |
| seyah24 | seyah24-vbook-exts | Community extensions |
| sonzin | sonzin-vbook-extension | Community extension |
| springpeachvinh | springpeachvinh-vbook-ext | Community extensions |
| tamchau | tamchau-vbook-extensions | Community extensions |
| tuanhai03 | tuanhai03-vbook-extensions | Community extensions |

---

## How to Use These References

### Pattern Discovery Workflow

1. **Identify the Target Site**: Note the site name/URL you're working with
2. **Search References**: Look through repos for similar site implementations (search, detail, toc patterns)
3. **Extract Key Logic**: 
   - Examine `home.js` for initial data fetching patterns
   - Check `search.js` for query string construction
   - Review `toc.js` for pagination and chapter iteration
   - Study `chap.js` for content extraction
4. **Verify Against Live Site**: Inspect HTML/XHR to ensure selectors still work
5. **Adapt & Optimize**: Rewrite for clarity and project constraints

### Common Reference Patterns

From the collections above, you'll find:
- **Search URL patterns**: Form action analysis, parameter names
- **Lazy loading strategies**: `data-image`, `data-desk-image` attributes
- **Pagination patterns**: DOM selectors for next page, pagination containers
- **TOC fetching**: Single vs. multi-page chapter listings
- **Encoding handling**: GBK, UTF-8, and mixed character sets
- **Response formatting**: Novel/Chapter object structures for `Response.success()`

---

## Integration with Project

When developing extensions:
- Always cross-reference with [AI_CODE_EXT_VBOOK.md](./AI_CODE_EXT_VBOOK.md) for constraints
- Use helper patterns proven in this repo (e.g., shared `utils.js` parsers)
- Document novel patterns discovered in these repos via PRs/issues for knowledge sharing
- Update `docs/rules/` if a new best practice emerges

---

## Maintaining This Document

When adding new reference repos:
1. Add the repository name to the table above
2. Include the GitHub link and primary focus
3. Run a quick audit: count extensions, identify unique patterns
4. Commit both the cloned repo and this updated documentation

**Last Updated**: 2026-03-29
**Maintainer**: vbook-tool project team
