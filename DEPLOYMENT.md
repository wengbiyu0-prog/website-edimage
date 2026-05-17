# EDIMAGE WORLD 部署说明

## 推荐方案

当前版本最适合先接入 Supabase 免费数据库，再部署到 Render 并绑定 `edimage.art`。

原因：

1. 这个项目是一个 Node 服务，不只是纯静态页面。
2. Supabase 免费版提供持久 Postgres，适合保存知识库、邀请码状态和 PATH 累计数。
3. Render 免费版可作为公网入口；应用重启不会再清空世界记忆数据。

## 当前项目的公网运行要求

部署时至少需要设置这些环境变量：

```env
APP_BASE_URL=https://edimage.art
OPENROUTER_API_KEY=你的 OpenRouter key
OPENROUTER_MODEL=deepseek/deepseek-chat
SUPABASE_URL=https://你的项目id.supabase.co
SUPABASE_ANON_KEY=你的 Supabase anon key
INVITE_CODE=edimage-world
DEVELOPER_CODE=edithfish
INVITE_LIMIT=10
```

## Render 上线步骤

1. 把项目放到 GitHub 仓库。
2. 在 Render 新建 `Web Service`。
3. 连接 GitHub 仓库。
4. 让 Render 读取仓库里的 `render.yaml`。
5. 先在 Supabase SQL Editor 运行 [supabase-init.sql](/Users/wengbiyu/Desktop/website-edimage/supabase-init.sql)。
6. 在 Render 后台补上 `OPENROUTER_API_KEY`、`SUPABASE_URL`、`SUPABASE_ANON_KEY` 等环境变量。
7. 首次部署成功后，打开 `https://你的-render-域名/api/health` 检查服务状态。
8. 在 Render 的 `Custom Domains` 中添加：

```txt
edimage.art
www.edimage.art
```

9. 回到域名 DNS 管理后台，按 Render 提示添加记录。
10. 等待 SSL 证书签发完成。

## 免费版注意事项

1. Render 免费版会在空闲时休眠，首次访问可能等待几十秒。
2. Render 免费版会休眠，但数据在 Supabase 里持久化，不会因部署重置。
3. Supabase 免费版如果长期无访问会暂停项目；恢复后数据仍在。
3. 上公网前建议轮换一次 OpenRouter API key，并把旧 key 作废。
