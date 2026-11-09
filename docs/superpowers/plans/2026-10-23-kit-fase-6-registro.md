# SDD ledger — plan: docs/superpowers/plans/2026-10-23-kit-fase-6.md
Spec: docs/superpowers/specs/2026-10-23-edilpro-design.md
Branch: kit-fase-6 (from main 4f01018). No push.

## Pre-flight scan
| Tasks | Shared file/interface | Finding |
|---|---|---|
| 0 | branch creation | branch already created by controller → step skipped |
| 1↔2 | Admin.astro nav | T1 adds Richieste, T2 reorders full nav incl. Richieste: consistent |
| 1↔11 | Admin.astro nav, middleware | T11 filters nav by role: consistent |
| 2↔3 | content types, publicUrl, RESERVED | T3 consumes T2 exports: consistent |
| 2↔4 | form.ts video field / uploadVideo | T2 placeholder until T4: consistent |
| 2↔12 | seed.ts | importSeed iterates COLLECTIONS: T2 must add empty seed arrays for new collections or "copy examples" crashes → Ruling R2 |
| 3↔4 | PageView/CategoryPage, Booking product optional | consistent |
| 4↔5 | media-keys img/ keys | T4 regex already accepts img/<uuid>/(full|1280|640|blur): consistent |
| 4↔8 | Policy block | T4 empty placeholder, T8 fills: consistent |
| 6↔9 | applySlugChange for posts | T9 extends Kind with posts: consistent |
| 7↔9↔10 | seo.ts, Base.astro, sitemap | sequential extensions: consistent |
| 3↔9 | resolve/View | T9 extends union: consistent |
| 5↔9 | variantsOf in renderDoc | consistent |
| 9 self | rss route file path ambiguous | Ruling R3 |
| 11↔5 | autore allowed /api/admin/upload* | T5 keeps endpoint under /api/admin/upload: consistent |
| each task self | tests vs code | no contradictions found |

Ruling R1: Task 0 step "git checkout -b" skipped, branch exists — costs nothing.
Ruling R2: Task 2 adds `categories: [], projects: [], pages: []` to seed (T9 adds `posts: []`); T12 fills them — keeps "Copia gli esempi" working between tasks — if wrong, seed import fails until T12.
Ruling R3: RSS served by dedicated route `src/pages/[blog]/rss.xml.ts` returning 404 unless param equals blog segment — more specific than [...path] so wins — if wrong, rss handled inside [...path] instead.

## Tasks
Task 0: complete (commits 4f01018..5e791fb, review clean)
Task 0: minor (deferred): vitest alias relative path; vitest pinned with ^ instead of exact version
Ruling R4: reviewer's ⚠️ on trailer "Opus vs Sonnet" dismissed — session attribution instructs "Claude Opus 5.5" — costs nothing if wrong (trailer text only).
Task 1: review → 1 Important (hardcoded Europe/Rome in richieste.astro); fix round 1 dispatched to original implementer
Task 1: minor (deferred): setLeadStatus unknown id returns ok; mailStaffLead/sourceLabel duplicated with mailStaff (wording differs); "+" phone prefixed with ' in CSV (plan-mandated); rate-limit count+insert not atomic (matches bookings)
Task 1: fix round 1/5 (1 addressed, 0 open; commits 077489f..d9cbb10) — `booking` export from brand.ts confirmed by controller
Task 1: complete (commits 5e791fb..d9cbb10, review clean)
Task 2: complete (commits d9cbb10..fe82d35, review clean)
Task 2: minor (deferred): clash test names same title for both items (weak assertion); no test for product dropping unknown category nor validateBlocks dropping dead category; home page still slug-checked on its own unused slug (validate.ts ~845) — candidate fix; cleanCta/cleanBlock return error as string; duplicate .list CSS rule; empty optional titles stored as {}
Task 3: complete (commits fe82d35..ba0d08f, review clean)
Task 3: minor (deferred): aria-label "Percorso" hardcoded IT in ProductPage; Base.astro + ProductPage do extra list() queries per request (no request cache); menu stubs products/projects; no test page+category same slug
Ruling R5: menu() excludes home even if inMenu (logo links to /) — accepted, deviates from literal brief — if wrong, home appears twice in nav (trivial to change).
Task 3→4 carry: mobile nav may overflow with many categories (Base.astro menu) — Task 4 owns public CSS, handle there.
Task 4: review → Needs fixes: 1 Important (opening hours hide lunch break); fix round 1 dispatched incl. cheap minors (reduced-motion no-JS autoplay, upload try/catch, nosniff, slider role, drop textPhoto focus, lightbox src)
Task 4: minor (deferred): Range malformed→416 instead of 200, head+get double R2 op; mobile nav-panel fixed inside backdrop-filter header (fragile); CLAUDE.md /media rule stale (→Task 12); "Indicazioni stradali" vs "Indicazioni" (accepted)
Ruling R6: hero video has no autoplay attribute; script starts it only when not reduced-motion — satisfies spec 'niente autoplay con reduced motion' robustly; cost if wrong: no-JS visitors see poster only (acceptable).
Task 4: fix round 1/5 (7 addressed, 0 open; commits 2c2b9a1..ee5fe35)
Task 4: complete (commits ba0d08f..ee5fe35, review clean)
Task 4: minor (deferred): dayHours tie-break may over-split irregular schedules
Task 5: complete (commits ee5fe35..5f4eefa, review clean) — reviewer's "step 5 not done" resolved by controller: report documents 4 R2 objects, 640 at 390px, legacy foto/ OK; only hero/slider/gallery visual check missing (deferred to final review)
Task 5: minor (deferred): PHOTO_TYPES plain-object lookup (use Object.hasOwn); Img.astro inline background + onload background:none wipes .sl-track surface backing; blur removal needs JS; full always 2400w (plan-mandated); no test for upload 4-part validation; visual check of hero/slider/galleries with Img not done
Task 6: review → 1 Important (backslash open redirect in normalizePath); fix round 1 dispatched incl. applySlugChange single batch
Task 6: minor (deferred): published→draft→slug edit→published loses redirect; manual A→B + B→A loops allowed, no check that destination exists; takenPaths counts drafts; DELETE doesn't normalise from
Ruling R7: redirect whose origin equals an existing page is rejected (error) instead of a warning — a redirect from a live URL never fires, so an error is clearer — cost if wrong: admin must delete/rename page first.
Task 6: fix round 1/5 (2 addressed, 0 open; commits b22f8fb..d9fe713)
Task 6: complete (commits 5f4eefa..d9fe713, review clean) — legacy-row revalidation N/A: no deployed DB exists yet
Task 7: complete (commits d9fe713..a2875d6, review clean)
Task 7: minor (deferred): empty telephone/email emitted in LocalBusiness; showrooms share url, no @id/image; Product no offers; closed dates ignored; 404 has canonical/og:url to home; no tests for sitemap dedupe/hreflang gating/24:00 mapping; JSON-LD with a real showroom not seen in rendered HTML (verify in final check)
Task 8: complete (commits a2875d6..a28f002, review clean) — ⚠️ admin form serialization verified by controller (generic FormData, inputs named iubendaSiteId/iubendaPolicyId/gtmId)
Task 8: minor (deferred): readSettings() per public render (+ again in Blocks for policy) loads secrets into memory — use narrow consent read; iubenda.js loader injected twice if two policy blocks; only one iubenda id set → silently off, no save warning; GTM id case-sensitive
Task 9: complete (commits a28f002..c8b5d34, review clean)
Task 9: minor (deferred, PRIORITY for final): SAFE_HREF in richtext.ts:28 (+admin richtext.ts:14) lets "/\evil.com" and "/\t/evil.com" through → protocol-relative external link; same class as Task 6 fix — also check validate.ts SAFE_HREF for CTA (Task 2) and normalizePath reuse
Task 9: minor (deferred): RSS esc doesn't strip XML-forbidden control chars; renderDoc crashes on uncleaned doc (comment claims tolerance); pasted external images silently dropped on save; no size cap on post body; sitemap lastmod UTC day; blog list not in public menu; "Vedi sul sito" for scheduled posts; alt/caption via prompt()
Ruling R8: project breadcrumb Home › Realizzazione (no /realizzazioni/ index page exists, so no link to a 404) — deviates from brief's literal trail — cost if wrong: one breadcrumb level missing in rich results.
Task 10: complete (commits c8b5d34..dceacfb, review clean)
Task 10: minor (deferred): duplicate routes import in PageView; no tests for blocksSummary/clip; gallery captions counted as alt (verify Img alt usage)
Task 11: review → Needs fixes: 1 Important (redattore can change cta.href/limit via mergeTexts); fix round 1 dispatched incl. slug-from-title preservation
Ruling R9: spec "solo i testi … niente indirizzi" overrides brief's "copia solo i campi text" — href/limit excluded from redattore merge — cost if wrong: redattore cannot fix a broken button link (admin must).
Task 11: minor (deferred): autore/redattore can upload video/.glb (brief upload*); setRole unknown id shows last-admin message; redattore cannot edit photo captions (consistent with spec); autore can edit/delete all articles (no ownership in spec)
Task 11: fix round 1/5 (2 addressed, 0 open; commits e8144c8..7715928)
Task 11: complete (commits dceacfb..7715928, review clean)
Task 11: minor (deferred): redattore rename colliding title → spurious slug-clash 400 (validate before keepSlug); legacy item without slug gets slug {}
Ruling R10: seed product "piscina" with demo:piscina 3D model kept — it predates this plan and the kit's only demo 3D model (src/scripts/models/piscina-demo.ts) is a pool; renaming text alone would mismatch the 3D demo, replacing the model is out of scope — cost if wrong: the generic kit's example product stays pool-themed until a neutral demo model exists.
Task 12: complete (commits 7715928..84eeac7, 0 fix rounds; Important finding resolved by Ruling R10)
Task 12: minor (deferred): seed.test picks collection from id string; magic date 2030-01-01 in test
Final review: With fixes — 1 Important (safe-href backslash/control chars in richtext, editor, CTA, src()) + visual pass; ONE fix wave dispatched with cheap fixes 3-9
Final fix wave: 9/9 addressed (commits 84eeac7..162bd27), re-review clean
Ruling R11: accept implementer's extra slider CSS fix (minmax(0,1fr)) — it restores "foto sempre intere" on desktop — cost if wrong: slider row height changes.
Ruling R12: reverse manual chain (existing C→A + new A→B = 2 hops) left open — not a loop, followed by browsers/Google, automatic path already repoints — cost if wrong: one extra redirect hop for manually-entered rules.
