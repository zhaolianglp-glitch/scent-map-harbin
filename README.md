# 气味地图 · 七维地图

> 基于真实地图的社交化气味标记与视觉联觉平台 —— 以哈尔滨市为起点

## 🎯 一句话

像发朋友圈一样，在地图上标记你闻到的气味（或心情），让它变成彩色光晕扩散出去。

## 🗺️ 看板 & 进度

- **GitHub Project 看板**: https://github.com/users/zhaolianglp-glitch/projects/1
- **Issues 列表**: https://github.com/zhaolianglp-glitch/scent-map-harbin/issues

## 📋 开发阶段

| 阶段 | 内容 | Issues | 难度 |
|------|------|--------|------|
| Phase 1 | MapLibre 底图 + 点击标记 + 径向渐变光点 + 时间消散 | #1 #2 #3 #4 | ⭐ |
| Phase 2 | AI 文字→颜色映射 + 缓存 | #5 #6 | ⭐⭐ |
| Phase 3 | 自定义 Shader 双层光晕 + Simplex 噪声 + 呼吸动画 | #7 #8 | ⭐⭐⭐ |
| Phase 4 | 颜色混合 + 缩放适配 | #9 #10 | ⭐⭐ |
| Phase 5 | 多用户 + 实时数据库 + 用户系统 | #11 #12 | ⭐⭐⭐ |

## 🛠 技术栈

- **地图**: MapLibre GL JS
- **光点渲染**: deck.gl + 自定义 GLSL Shader
- **颜色生成**: OpenAI API (GPT-4o-mini)
- **后端**: Firebase / Supabase（Phase 5）

## 🚀 快速开始

```bash
# 直接用浏览器打开
open index.html

# 或启动本地服务器
npx serve .
```
