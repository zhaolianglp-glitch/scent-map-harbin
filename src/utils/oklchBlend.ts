// OKLCH 加权混合
// 核心算法：用 (cos, sin) 向量化处理色相角度，避免 350°→10° 绕远路问题
import type { OKLCH } from './oklch';

export interface WeightedSmell {
  oklch: OKLCH;
  weight: number;
}

/**
 * 多气味 OKLCH 加权混合
 * 返回混合后的颜色；总权重过低时返回 null
 */
export function blendOKLCH(smells: WeightedSmell[]): OKLCH | null {
  if (smells.length === 0) return null;

  let totalWeight = 0;
  let L_acc = 0;
  let a_acc = 0; // C * cos(H) 加权和
  let b_acc = 0; // C * sin(H) 加权和

  for (const { oklch, weight } of smells) {
    if (weight <= 0) continue;
    const hRad = (oklch.H * Math.PI) / 180;
    a_acc += oklch.C * Math.cos(hRad) * weight;
    b_acc += oklch.C * Math.sin(hRad) * weight;
    L_acc += oklch.L * weight;
    totalWeight += weight;
  }

  if (totalWeight < 0.001) return null;

  // 还原 C 和 H
  const C = Math.sqrt(a_acc * a_acc + b_acc * b_acc) / totalWeight;
  const H = (Math.atan2(b_acc, a_acc) * 180) / Math.PI;
  const H_normalized = H < 0 ? H + 360 : H;

  // 略微提升混合后的 L，让重叠区看起来更亮（视觉补偿）
  const L = Math.min(0.95, L_acc / totalWeight + 0.05);

  return { L, C, H: H_normalized };
}
