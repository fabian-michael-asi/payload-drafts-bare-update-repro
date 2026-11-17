import { getPayload } from 'payload'

import config from './payload.config.js'

const payload = await getPayload({ config })

const variants = [
  { label: 'update without draft', args: {} },
  { label: 'update with draft: false', args: { draft: false } },
]

const expected = { _status: 'published', price: 120, title: 'published title' }

for (const { label, args } of variants) {
  const { id } = await payload.create({
    collection: 'posts',
    data: { _status: 'published', price: 100, title: 'published title' },
  })

  await payload.update({
    id,
    collection: 'posts',
    data: { title: 'pending draft title' },
    draft: true,
  })

  const before = await payload.findByID({ id, collection: 'posts' })

  await payload.update({ id, collection: 'posts', data: { price: 120 }, ...args })

  const after = await payload.findByID({ id, collection: 'posts' })
  const publishedOnly = await payload.find({
    collection: 'posts',
    where: { and: [{ id: { equals: id } }, { _status: { equals: 'published' } }] },
  })

  console.log(`\n${label}`)
  console.log('  live document before:', pick(before))
  console.log('  live document after: ', pick(after))
  console.log('  expected:            ', expected)
  console.log('  found by a `_status: published` query after:', publishedOnly.totalDocs === 1)
}

for (const { label, args } of variants) {
  await payload.updateGlobal({
    slug: 'settings',
    data: { _status: 'published', price: 100, title: 'published title' },
  })

  await payload.updateGlobal({
    slug: 'settings',
    data: { title: 'pending draft title' },
    draft: true,
  })

  const before = await payload.findGlobal({ slug: 'settings' })

  await payload.updateGlobal({ slug: 'settings', data: { price: 120 }, ...args })

  const after = await payload.findGlobal({ slug: 'settings' })

  console.log(`\nglobal, ${label}`)
  console.log('  live global before:', pick(before))
  console.log('  live global after: ', pick(after))
  console.log('  expected:          ', expected)
  console.log('  still published after:', after._status === 'published')
}

for (const { label, args } of variants) {
  const { id } = await payload.create({
    collection: 'posts',
    data: { _status: 'published', price: 100, title: 'published title' },
  })

  await payload.update({
    id,
    collection: 'posts',
    data: { title: 'pending draft title' },
    draft: true,
  })

  const before = await payload.findByID({ id, collection: 'posts' })
  const draftBefore = await payload.findByID({ id, collection: 'posts', draft: true })

  await payload.update({
    collection: 'posts',
    data: { price: 120 },
    where: { id: { equals: id } },
    ...args,
  })

  const after = await payload.findByID({ id, collection: 'posts' })
  const draftAfter = await payload.findByID({ id, collection: 'posts', draft: true })

  console.log(`\nbulk update by where, ${label}`)
  console.log('live document before:', pick(before))
  console.log('live document after: ', pick(after))
  console.log('draft: true read before:', pick(draftBefore))
  console.log('draft: true read after: ', pick(draftAfter))
}

{
  const { id } = await payload.create({
    collection: 'capped-posts',
    data: { _status: 'published', price: 100, title: 'published title' },
  })

  for (const n of [1, 2, 3]) {
    await payload.update({
      id,
      collection: 'capped-posts',
      data: { title: `draft save ${n}` },
      draft: true,
    })
  }

  const versions = await payload.findVersions({
    collection: 'capped-posts',
    sort: 'createdAt',
    where: { parent: { equals: id } },
  })
  const rows = versions.docs
    .map(({ latest, version }) => `[${version._status} '${version.title}'${latest ? ' latest' : ''}]`)
    .join(' ')
  const before = await payload.findByID({ id, collection: 'capped-posts' })

  await payload.update({ id, collection: 'capped-posts', data: { price: 120 } })

  const after = await payload.findByID({ id, collection: 'capped-posts' })

  console.log('\nmaxPerDoc: 2, update by ID without draft')
  console.log('version rows after publish + 3 draft saves:', rows)
  console.log('live document before update:', pick(before))
  console.log('live document after update: ', pick(after))
}

process.exit(0)

function pick({ _status, price, title }: { _status?: null | string; price?: null | number; title?: null | string }) {
  return { _status, price, title }
}
