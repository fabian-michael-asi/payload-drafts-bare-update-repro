import { getPayload } from 'payload'

import config from './payload.config.js'

const payload = await getPayload({ config })

const variants = [
  { label: 'update without draft', args: {} },
  { label: 'update with draft: false', args: { draft: false } },
]

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
  console.log('  expected:            ', { _status: 'published', price: 120, title: 'published title' })
  console.log('  found by a `_status: published` query after:', publishedOnly.totalDocs === 1)
}

process.exit(0)

function pick({ _status, price, title }: { _status?: null | string; price?: null | number; title?: null | string }) {
  return { _status, price, title }
}
