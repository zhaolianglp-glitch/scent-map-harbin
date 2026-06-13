// Simplex noise 2D — 用于气味边缘扰动和流场
// 基于 Stefan Gustavson 的实现

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;

const grad3: [number, number][] = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

const perm = new Uint8Array(512);
const p = new Uint8Array(256);

// 初始化排列表
(function initPerm() {
  for (let i = 0; i < 256; i++) p[i] = i;
  // Fisher-Yates shuffle
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
})();

export function simplex2(x: number, y: number): number {
  const s = (x + y) * F2;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const t = (i + j) * G2;
  const X0 = i - t;
  const Y0 = j - t;
  const x0 = x - X0;
  const y0 = y - Y0;

  const i1 = x0 > y0 ? 1 : 0;
  const j1 = x0 > y0 ? 0 : 1;

  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2;
  const y2 = y0 - 1 + 2 * G2;

  const ii = i & 255;
  const jj = j & 255;

  let n0 = 0, n1 = 0, n2 = 0;

  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 >= 0) {
    t0 *= t0;
    const gi = perm[ii + perm[jj]] % 8;
    n0 = t0 * t0 * (grad3[gi][0] * x0 + grad3[gi][1] * y0);
  }

  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 >= 0) {
    t1 *= t1;
    const gi = perm[ii + i1 + perm[jj + j1]] % 8;
    n1 = t1 * t1 * (grad3[gi][0] * x1 + grad3[gi][1] * y1);
  }

  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 >= 0) {
    t2 *= t2;
    const gi = perm[ii + 1 + perm[jj + 1]] % 8;
    n2 = t2 * t2 * (grad3[gi][0] * x2 + grad3[gi][1] * y2);
  }

  return 70 * (n0 + n1 + n2);
}

/**
 * 生成 Curl Noise 流场向量
 * 无散度场，模拟自然气流
 */
export function curlNoise(x: number, y: number): [number, number] {
  const eps = 0.1;
  const scale = 0.008;
  const nx = simplex2(x * scale, y * scale);
  const ny = simplex2(x * scale + 100, y * scale + 50);
  // 有限差分求 curl: (∂ψ/∂y, -∂ψ/∂x)
  const dx = (simplex2((x + eps) * scale, y * scale) - nx) / eps;
  const dy = (simplex2(x * scale, (y + eps) * scale) - ny) / eps;
  return [dy, -dx];
}
