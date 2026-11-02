# Shared BaseLinker cache on Vercel

The server uses Upstash Redis over its REST API. This works with Vercel Functions
without a persistent TCP connection or local disk. Set these server-only Vercel
environment variables in Production, Preview, and Development as appropriate:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN` (standard read/write token; never expose with `NEXT_PUBLIC_`)

When either variable is absent in local development, the existing Next.js and
process caches remain usable. On Vercel, catalog reads fail closed if Redis is
not configured or unavailable, instead of sending every cache miss straight to
BaseLinker. Checkout's final product price and stock validation deliberately
continues to call BaseLinker directly.

| BaseLinker response | Shared fresh TTL | Last-known-good fallback |
| --- | ---: | ---: |
| Categories | 15 min | 24 h |
| Product list pages | 5 min | 1 h |
| Product details used for browsing | 2 min | 15 min |
| Stock pages used for catalog filters | 30 sec | 5 min |

Concurrent Vercel instances requesting the same BaseLinker operation share a
Redis lock. A lock owner refreshes the response; other instances use the last
valid response or wait briefly for the refresh. They do not create a parallel
BaseLinker request for that same cache key. Incomplete responses are not cached.

## Vercel scheduling

This cache is populated on demand and does not require a scheduled job to serve
the shop. A future scheduled catalog warm-up should be configured only after
checking the Vercel plan: Hobby Cron supports one run per day, while more
frequent schedules require Pro or Enterprise. Do not add a frequent Cron
expression to `vercel.json` on Hobby because Vercel rejects it during deploy.

The Redis cache reduces repeat requests for identical operations across
instances. It does not make distinct category/page/search queries identical;
the existing catalog query and pagination paths can still create separate cache
keys on their first request. Checkout reads remain intentionally fresh and are
not protected by the browsing cache.
