# EDIMAGE WORLD 运行手册

## 1. 当前生产依赖

- 应用托管：Render `edimage-world`
- 持久化数据库：Supabase（项目 ID: `vjnwjjzysudhwqbxuwji`）
- 大模型：OpenRouter

## 2. 关键环境变量清单

```env
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=deepseek/deepseek-chat
SUPABASE_URL=https://vjnwjjzysudhwqbxuwji.supabase.co
SUPABASE_ANON_KEY=...
APP_BASE_URL=https://edimage.art
PORT=10000
DATA_DIR=.
INVITE_CODE=edimage-world
DEVELOPER_CODE=edithfish
INVITE_LIMIT=10
```

## 3. 上线后快速巡检（每次部署后 2 分钟内）

1. 打开 `https://edimage.art/api/health`，确认 `ok: true`。
2. 打开首页确认 `PATH` 正常显示（不是固定文案）。
3. 上传一条“记忆共同体”文本，确认刷新后仍可见。
4. 走完一条完整互动文本，确认 `PATH` 递增 1。

## 4. 每周备份（免费版必做）

项目包含脚本：
[backup-supabase.sh](/Users/wengbiyu/Desktop/website-edimage/scripts/backup-supabase.sh)

执行方式：

```bash
cd /Users/wengbiyu/Desktop/website-edimage
chmod +x ./scripts/backup-supabase.sh
SUPABASE_URL="https://vjnwjjzysudhwqbxuwji.supabase.co" \
SUPABASE_ANON_KEY="你的anon_key" \
./scripts/backup-supabase.sh
```

默认输出目录：

```txt
./backups/supabase-YYYYMMDD-HHMMSS/
```

包含：

- `knowledge_entries.json`
- `world_stats.json`

## 5. 常见异常与处理

### A. 知识库上传后不显示

1. 检查 Render 环境变量 `SUPABASE_URL` / `SUPABASE_ANON_KEY` 是否为空。
2. 在 Supabase 确认 `knowledge_entries` 表存在、RLS 策略已创建。
3. 访问 `https://edimage.art/api/knowledge` 看是否返回 `entries`。

### B. PATH 回到 0000

1. 先看 `https://edimage.art/api/stats` 返回值。
2. 若返回 0，检查 Supabase `world_stats` 是否有 `key=access_state`。
3. 在 Supabase 重新执行 [supabase-init.sql](/Users/wengbiyu/Desktop/website-edimage/supabase-init.sql)（不会覆盖已有数据，除非手动清空）。

### C. 邀请码规则异常

1. 检查 `INVITE_CODE`、`DEVELOPER_CODE`、`INVITE_LIMIT`。
2. 检查 `world_stats.value_json` 中 `inviteCompletions` 与 `issuedInviteSessions` 字段。

## 6. 变更纪律（建议）

1. 涉及 `server.mjs` 的改动必须先在本地验证 `api/health`、`api/knowledge`、`api/stats`。
2. 每次上线前打一个备份快照（执行第 4 节脚本）。
3. 每次上线后执行第 3 节巡检。
