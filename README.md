# HECOTH 纯前端静态外贸站（7页）

## 页面
- `index.html` 首页  
- `categories.html` 产品分类页  
- `product.html` 产品详情页（通过 `?id=xxx` 切换产品）  
- `solutions.html` 解决方案  
- `about.html` 关于我们  
- `news.html` 行业新闻  
- `contact.html` 联系询盘

## 多语言（6语种 + 阿语 RTL）
- 语言字典：`assets/js/i18n.js`（可直接改文案）
- 语言切换脚本：`assets/js/site.js`（已封装、无后端）
- 阿拉伯语会自动启用 RTL（从右向左）

## 产品内容（零基础可改，可新增产品）
产品数据集中在：`assets/js/products.js`

你可以在这里直接改：
- 图片链接 `images: []`（可用相对路径或在线 URL）
- 产品名称 `name`
- 简介 `short`
- 卖点 `points`
- 参数表 `specs`（表格结构固定，只改值）

新增产品：复制一个产品对象 → 改 `id` 和内容 → 粘贴进 `window.PRODUCTS` 数组即可。

## 图片素材
已从附件 PDF 中提取部分图片到：`assets/img/extracted/`  
你也可以把图片换成在线 URL（更符合“打开 HTML 直接换链接”的操作习惯）。

## 询盘表单（无后端）
`contact.html` 使用 FormSubmit（免费邮件转发）：
- 收件人：`zoe@annet.com`
- 你可以在 `<form action="...">` 里改成你的邮箱

## 部署
这是纯静态站点，可直接部署到：
- GitHub Pages
- Vercel（Static）
- Cloudflare Pages

本地预览（任选一种）：
1. 直接双击打开 `index.html`
2. 或用任意静态服务器（例如 VSCode Live Server）

