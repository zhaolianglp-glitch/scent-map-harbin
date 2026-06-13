// Mock 气味数据 - 哈尔滨 20 个手工标注点
import type { OKLCH } from '../utils/oklch';
import { SMELL_PALETTE } from '../utils/colorPalette';

export interface SmellPoint {
  id: string;
  position: [number, number]; // [lng, lat]
  keyword: string;
  oklch: OKLCH;
  intensity: number; // 0-1
  age: number;       // 0-1 (1=新鲜, 0=消散)
  size: number;      // 基础尺寸 px
  phase: number;     // 呼吸相位 0-2π
}

interface MockSpec {
  lng: number;
  lat: number;
  keyword: string;
  intensity?: number;
}

// 哈尔滨 20 个地标气味点（手工设计，覆盖主要区域）
const SPECS: MockSpec[] = [
  // 中央大街沿线
  { lng: 126.6194, lat: 45.7743, keyword: '老面包房', intensity: 0.85 },
  { lng: 126.6201, lat: 45.7751, keyword: '红肠列巴', intensity: 0.8 },
  { lng: 126.6185, lat: 45.7735, keyword: '夜市烧烤', intensity: 0.9 },
  { lng: 126.6208, lat: 45.7758, keyword: '老砖墙', intensity: 0.6 },

  // 索菲亚教堂周边
  { lng: 126.6230, lat: 45.7770, keyword: '老砖墙', intensity: 0.7 },
  { lng: 126.6225, lat: 45.7765, keyword: '雪', intensity: 0.95 },

  // 哈站附近
  { lng: 126.6290, lat: 45.7620, keyword: '煤烟', intensity: 0.7 },
  { lng: 126.6280, lat: 45.7630, keyword: '豆浆油条', intensity: 0.85 },
  { lng: 126.6300, lat: 45.7610, keyword: '地铁', intensity: 0.5 },

  // 松花江畔
  { lng: 126.6100, lat: 45.7800, keyword: '松花江', intensity: 0.75 },
  { lng: 126.6080, lat: 45.7820, keyword: '雨后泥土', intensity: 0.6 },
  { lng: 126.6120, lat: 45.7785, keyword: '松花江', intensity: 0.7 },

  // 哈尔滨工业大学
  { lng: 126.6310, lat: 45.7670, keyword: '落叶', intensity: 0.65 },
  { lng: 126.6320, lat: 45.7680, keyword: '书店', intensity: 0.55 },

  // 哈尔滨工程大学
  { lng: 126.6480, lat: 45.7720, keyword: '落叶', intensity: 0.7 },

  // 南岗秋林
  { lng: 126.6400, lat: 45.7600, keyword: '红肠列巴', intensity: 0.8 },
  { lng: 126.6410, lat: 45.7610, keyword: '豆浆油条', intensity: 0.75 },

  // 道里群力
  { lng: 126.5950, lat: 45.7700, keyword: '雨后泥土', intensity: 0.55 },
  { lng: 126.5960, lat: 45.7685, keyword: '雪', intensity: 0.9 },

  // 太阳岛
  { lng: 126.5850, lat: 45.7900, keyword: '落叶', intensity: 0.6 },
  { lng: 126.5870, lat: 45.7920, keyword: '松花江', intensity: 0.7 },
];

export const MOCK_SMELLS: SmellPoint[] = SPECS.map((spec, i) => {
  const palette = SMELL_PALETTE.find(p => p.keyword === spec.keyword)!;
  return {
    id: `smell-${i}`,
    position: [spec.lng, spec.lat],
    keyword: spec.keyword,
    oklch: palette.oklch,
    intensity: spec.intensity ?? 0.7,
    age: 0.6 + Math.random() * 0.4, // 大多较新鲜
    size: 60 + Math.random() * 40,   // 60-100 像素
    phase: Math.random() * Math.PI * 2,
  };
});

// 哈尔滨中心点（用于地图初始化）
export const HARBIN_CENTER: [number, number] = [126.6200, 45.7750];
export const HARBIN_ZOOM = 12.5;
