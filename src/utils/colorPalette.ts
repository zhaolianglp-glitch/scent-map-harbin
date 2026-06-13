// 气味类型 → OKLCH 颜色字典
// 调色板理念：莫奈水彩 + 北国气质，色相间隔 > 30°，饱和度统一
import type { OKLCH } from './oklch';

export interface SmellCategory {
  keyword: string;       // 中文标签
  enKeyword: string;     // 英文标签
  oklch: OKLCH;          // 颜色
  category: string;      // 大类
}

// Phase 1 调色板：12 个核心气味类型
export const SMELL_PALETTE: SmellCategory[] = [
  // === 食物系（暖色）===
  { keyword: '豆浆油条',   enKeyword: 'Soybean & Youtiao', oklch: { L: 0.78, C: 0.13, H: 75 },  category: 'food' },
  { keyword: '老面包房',   enKeyword: 'Bakery',            oklch: { L: 0.80, C: 0.12, H: 60 },  category: 'food' },
  { keyword: '夜市烧烤',   enKeyword: 'BBQ Smoke',         oklch: { L: 0.55, C: 0.18, H: 25 },  category: 'food' },
  { keyword: '红肠列巴',   enKeyword: 'Sausage & Bread',   oklch: { L: 0.65, C: 0.16, H: 40 },  category: 'food' },

  // === 自然系（冷色）===
  { keyword: '松花江',     enKeyword: 'Songhua River',     oklch: { L: 0.72, C: 0.08, H: 230 }, category: 'nature' },
  { keyword: '雪',         enKeyword: 'Snow',              oklch: { L: 0.92, C: 0.04, H: 230 }, category: 'nature' },
  { keyword: '落叶',       enKeyword: 'Fallen Leaves',     oklch: { L: 0.62, C: 0.14, H: 85 },  category: 'nature' },
  { keyword: '雨后泥土',   enKeyword: 'Rain on Soil',      oklch: { L: 0.55, C: 0.10, H: 30 },  category: 'nature' },

  // === 城市系（中性）===
  { keyword: '老砖墙',     enKeyword: 'Old Bricks',        oklch: { L: 0.55, C: 0.10, H: 35 },  category: 'urban' },
  { keyword: '煤烟',       enKeyword: 'Coal Smoke',        oklch: { L: 0.45, C: 0.12, H: 60 },  category: 'urban' },
  { keyword: '书店',       enKeyword: 'Bookstore',         oklch: { L: 0.68, C: 0.08, H: 80 },  category: 'urban' },
  { keyword: '地铁',       enKeyword: 'Subway',            oklch: { L: 0.50, C: 0.06, H: 270 }, category: 'urban' },
];

/**
 * 根据中文关键词模糊匹配颜色
 */
export function getColorByKeyword(keyword: string): OKLCH {
  const match = SMELL_PALETTE.find(p => p.keyword.includes(keyword) || keyword.includes(p.keyword));
  return match ? match.oklch : { L: 0.6, C: 0.1, H: 30 };
}

/**
 * 将 OKLCH 颜色转换为 CSS 字符串（用于 UI 展示）
 */
export function oklchToCss(oklch: OKLCH, alpha: number = 1): string {
  return `oklch(${(oklch.L * 100).toFixed(0)}% ${oklch.C.toFixed(2)} ${oklch.H.toFixed(0)} / ${alpha})`;
}
