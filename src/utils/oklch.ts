// OKLCH ↔ RGB 色彩空间转换
// 参考: https://bottosson.github.io/posts/oklab/
// 和 https://www.w3.org/TR/css-color-4/#color-notation-oklch

export interface OKLCH {
  L: number; // 0-1, 感知亮度
  C: number; // 0-0.4+, 色度
  H: number; // 0-360, 色相角度
}

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/**
 * OKLCH → sRGB
 * 返回 0-1 范围的浮点 RGB
 */
export function oklchToLinearRgb(L: number, C: number, H: number): [number, number, number] {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // Oklab → LMS (cone response)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  // LMS → Linear sRGB
  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  return [r, g, bl];
}

/**
 * OKLCH → 0-255 sRGB
 */
export function oklchToRgb255(L: number, C: number, H: number): [number, number, number] {
  const [r, g, b] = oklchToLinearRgb(L, C, H);
  const toSrgb = (c: number) => {
    // 裁剪到有效范围
    c = Math.max(0, Math.min(1, c));
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  };
  return [Math.round(toSrgb(r) * 255), Math.round(toSrgb(g) * 255), Math.round(toSrgb(b) * 255)];
}

/**
 * OKLCH → CSS 颜色字符串
 */
export function oklchToCss(L: number, C: number, H: number, alpha: number = 1): string {
  const Lpct = (L * 100).toFixed(1);
  return `oklch(${Lpct}% ${C.toFixed(3)} ${H.toFixed(1)} / ${alpha})`;
}

/**
 * 验证 OKLCH 颜色是否在 sRGB 色域内
 */
export function isInGamut(L: number, C: number, H: number): boolean {
  const [r, g, b] = oklchToLinearRgb(L, C, H);
  return r >= -0.001 && r <= 1.001 && g >= -0.001 && g <= 1.001 && b >= -0.001 && b <= 1.001;
}

/**
 * 将 OKLCH 颜色投影回 sRGB 色域（简单二分查找降低 chroma）
 */
export function clampToGamut(L: number, C: number, H: number): OKLCH {
  if (isInGamut(L, C, H)) return { L, C, H };
  let lo = 0;
  let hi = C;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (isInGamut(L, mid, H)) lo = mid;
    else hi = mid;
  }
  return { L, C: lo, H };
}
