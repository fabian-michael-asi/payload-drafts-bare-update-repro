# Payload: an update by ID without `draft: true` puts a pending draft live

Minimal reproduction for Payload 3.93.0. A published document has a newer draft on top. An update by ID that is not a draft save (no `draft`, or `draft: false`) then writes the draft's content to the live document and sets it to `_status: 'draft'`. The same happens to a global with drafts.

## Run it

Needs Node 20.9 or newer and pnpm. The database is a local SQLite file, `repro.db`.

```sh
pnpm install
pnpm repro
```

## What the script does

[`src/repro.ts`](src/repro.ts) runs these steps twice, once with no `draft` argument and once with `draft: false`:

1. Create a published post: title "published title", price 100.
2. Save a draft on top of it: title "pending draft title".
3. Update only the price to 120 by ID, the way an integration or a hook would.
4. Read the live document, and query it with `_status: published`.

It then runs the same steps on a `settings` global with drafts: publish, save a draft, update only the price, read the live global.

## Result

```
update without draft
  live document before: { _status: 'published', price: 100, title: 'published title' }
  live document after:  { _status: 'draft', price: 120, title: 'pending draft title' }
  expected:             { _status: 'published', price: 120, title: 'published title' }
  found by a `_status: published` query after: false
```

The output for `draft: false` is the same, and so is the global's:

```
global, update without draft
  live global before: { _status: 'published', price: 100, title: 'published title' }
  live global after:  { _status: 'draft', price: 120, title: 'pending draft title' }
  expected:           { _status: 'published', price: 120, title: 'published title' }
  still published after: false
```

## Two related cases

The script also prints two cases that matter for a fix.

A bulk update by `where`, without `draft` or with `draft: false`, keeps the live document correct. But it saves a new published version as the latest, so the pending draft is no longer the latest version and a `draft: true` read returns the published content:

```
bulk update by where, update without draft
live document before: { _status: 'published', price: 100, title: 'published title' }
live document after:  { _status: 'published', price: 120, title: 'published title' }
draft: true read before: { _status: 'draft', price: 100, title: 'pending draft title' }
draft: true read after:  { _status: 'published', price: 120, title: 'published title' }
```

On a collection with `versions: { drafts: true, maxPerDoc: 2 }`, the draft saves prune the published version row. The published content then only exists in the main document, and the update by ID overwrites it with the draft:

```
maxPerDoc: 2, update by ID without draft
version rows after publish + 3 draft saves: [draft 'draft save 2'] [draft 'draft save 3' latest]
live document before update: { _status: 'published', price: 100, title: 'published title' }
live document after update:  { _status: 'draft', price: 120, title: 'draft save 3' }
```

To run it again from scratch, delete `repro.db`.
