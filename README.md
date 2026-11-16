# Jeven 个人主页

单页静态站点，无需构建。默认英文，可切换中文，面向国际招聘读者。整页是电影感的 Matrix 视觉：可见的多层代码雨、终端等宽字体、大号扫描线标题；金色只保留在 “Talk with Jeven” 粒子邀请。

“Talk with Jeven” 由香槟金粒子组成文字：首次从右侧流入并在约 4–5 秒内聚合成形；指针靠近会推开并带一点旋动，离开后约 1 秒内重新聚拢。点击后打开预设的中英文说明，并提供返回，不是实时聊天。尊重 `prefers-reduced-motion`（静态标题，跳过开场与雨滴）。代码雨也可在页头手动暂停。

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
| `styles.css` | 电影感 Matrix 视觉与排版 |
| `talk.js` | Talk with Jeven 粒子字与预设对话 |
| `matrix.js` | 全页、可暂停的多层 Matrix 雨 |
| `lang.js` | 全站 EN / 中文切换（默认英文，可记住选择） |
| `intro.js` | 可跳过的开机序列（同一标签页内刷新不重播） |
| `qa/check.mjs` | 内容与粒子辅助函数检查 |

## 字体（Google Fonts CDN）

- **Chakra Petch** — 显示标题（姓名、章节）
- **Noto Sans SC** — 导航与正文，中文标题
- **Share Tech Mono** / **IBM Plex Mono** — 终端标签、坐标与开机序列
- **Playfair Display** — 仅用于 “Talk with Jeven” 粒子字形

## 部署

推送到 `master` 后，`.github/workflows/publish.yml` 会把静态文件强制发布到 `gh-pages`。线上地址为 [https://jevenzh.github.io](https://jevenzh.github.io)。没有自定义域名。联系区仅展示已经公开的邮箱与站点；LinkedIn / X 链接尚未补全。
