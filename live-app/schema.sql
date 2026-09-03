-- Cloudflare D1 建表脚本：三位一体辅助系统
-- 在 Cloudflare Dashboard → D1 → 对应数据库 → Console 中执行
-- 或: wrangler d1 execute three_one_db --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS posts (
  id         TEXT PRIMARY KEY,
  content    TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT '疑问',
  aid        TEXT NOT NULL,
  created_at TEXT NOT NULL,
  likes      TEXT NOT NULL DEFAULT '[]',
  replies    TEXT NOT NULL DEFAULT '[]',
  pinned     INTEGER NOT NULL DEFAULT 0,
  reports    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS feedback (
  id          TEXT PRIMARY KEY,
  school_id   TEXT DEFAULT '',
  school_name TEXT DEFAULT '',
  field       TEXT DEFAULT '其他',
  detail      TEXT NOT NULL,
  contact     TEXT DEFAULT '',
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meta (
  id        INTEGER PRIMARY KEY CHECK (id = 1), -- 仅允许单行
  last_anon INTEGER NOT NULL DEFAULT 0
);

-- 初始化 meta 单行（发帖匿名序号 last_anon 原子递增）
INSERT OR IGNORE INTO meta (id, last_anon) VALUES (1, 0);

-- 常用查询示例
-- 列表（置顶优先、插入倒序由应用层保证；此处按创建时间倒序兜底）:
-- SELECT * FROM posts ORDER BY pinned DESC, rowid DESC;
-- 发帖自增匿名序号:
-- UPDATE meta SET last_anon = last_anon + 1 WHERE id = 1;
-- SELECT last_anon FROM meta WHERE id = 1;
