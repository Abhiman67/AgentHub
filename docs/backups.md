# Backups & Recovery (spec Phase 9)

## SQLite (local dev)
```bash
# backup (stop writes first or copy with SQLite backup API)
cp prisma/dev.db /backups/backoff-$(date +%F).db
# restore
cp /backups/backoff-<date>.db prisma/dev.db
# verify
bunx prisma migrate status
```

## PostgreSQL (staging/prod)
```bash
# nightly logical backup (cron)
pg_dump "$DATABASE_URL" -Fc -f /backups/backoff-$(date +%F).dump
# point-in-time recovery requires WAL archiving; enable on the server:
#   wal_level=replica, archive_mode=on, archive_command='cp %p /wal/%f'
# restore
pg_restore -d "$DATABASE_URL" /backups/backoff-<date>.dump
# verify
psql "$DATABASE_URL" -c "SELECT count(*) FROM \"User\";"
```

## Object storage
- Local driver (`./storage`): include in filesystem backups.
- S3-compatible: enable bucket versioning; lifecycle-expire noncurrent
  versions after 30 days.

## Redis (queue)
No durable state lives only in Redis — JobRecords persist in the database,
so a Redis loss only delays (not loses) jobs. The worker replays repeat
schedules on restart.

## Recovery drill (quarterly)
1. Restore the latest backup to a scratch database.
2. Point a staging build at it; run `bun run test:integration`.
3. Record result + restore duration in docs/staging-validation.md.
