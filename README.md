# Jeven 个人主页 — 复古工坊版

单页静态站点，无需构建。首屏是近黑的复古工坊：森林绿与香槟金 / 黄铜点缀，绿色仍作为身份色，但不再是满屏终端。向下进入暖象牙色阅读区，用细边框档案卡展示经历与项目。

“Talk with Jeven” 由香槟金粒子组成文字：首次从右侧流入并在约 4–5 秒内聚合成形；指针靠近会推开并带一点旋动，离开后约 1 秒内重新聚拢。点击后打开预设的中英文说明，并提供返回，不是实时聊天。尊重 `prefers-reduced-motion`（静态标题，跳过开场与雨滴）。

## 本地预览

在仓库根目录执行：

```bash
python3 -m http.server 8080
```

浏览器打开：http://localhost:8080

本地检查：

```bash
node qa/check.mjs
```

## 文件

| 文件 | 说明 |
|------|------|
| `index.html` | 结构与既有公开文案 |
| `styles.css` | 工坊首屏 + 象牙色档案卡 |
| `talk.js` | Talk with Jeven 粒子字与预设对话 |
| `matrix.js` | 仅用于首屏的轻量 Matrix 雨（可关） |
| `intro.js` | 可跳过的开机序列（同一标签页内刷新不重播） |
| `qa/check.mjs` | 内容与粒子辅助函数检查 |

## 字体（Google Fonts CDN）

- **Press Start 2P** — 像素标签 / 导航
- **Playfair Display** — Talk 标题
- **Noto Serif SC** — 中文标题
- **Noto Sans SC** — 中文正文
- **VT323** — 开机序列

## 部署

推送到 `master` 后，`.github/workflows/publish.yml` 会把静态文件强制发布到 `gh-pages`。线上地址为 [https://jevenzh.github.io](https://jevenzh.github.io)。没有自定义域名。联系区仅展示已经公开的邮箱与站点；LinkedIn / X 链接尚未补全。
