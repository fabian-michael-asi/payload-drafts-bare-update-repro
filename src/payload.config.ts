import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'posts',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'price', type: 'number' },
      ],
      versions: { drafts: true },
    },
  ],
  db: sqliteAdapter({ client: { url: 'file:./repro.db' } }),
  globals: [
    {
      slug: 'settings',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'price', type: 'number' },
      ],
      versions: { drafts: true },
    },
  ],
  secret: 'repro-secret',
  telemetry: false,
})
