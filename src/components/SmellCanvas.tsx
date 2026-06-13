// SmellCanvas: Canvas 2D 覆盖层渲染气味点
// 离屏 Canvas + 加法混合 + Bloom 辉光 + 噪声边缘 + Curl Noise 流场
import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { MOCK_SMELLS, type SmellPoint } from '../data/mockSmells';
import { oklchToRgb255 } from '../utils/oklch';
import { simplex2, curlNoise } from '../utils/simplex';
import { useAppStore } from '../store/useMapStore';

interface SmellCanvasProps {
  map: MapLibreMap | null;
}

export function SmellCanvas({ map }: SmellCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bloomRef = useRef<HTMLCanvasElement>(null);
  const { windSpeed, windDirAngle } = useAppStore();

  useEffect(() => {
    if (!map || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bloomCanvas = bloomRef.current;
    const bloomCtx = bloomCanvas?.getContext('2d');
    if (!ctx || !bloomCtx) return;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = map.getCanvas().getBoundingClientRect();
      const w = Math.floor(rect.width * dpr);
      const h = Math.floor(rect.height * dpr);
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      if (bloomCanvas) {
        bloomCanvas.width = w;
        bloomCanvas.height = h;
        bloomCanvas.style.width = rect.width + 'px';
        bloomCanvas.style.height = rect.height + 'px';
      }
    };
    resize();
    map.on('resize', resize);

    const startTime = performance.now();
    let animId = 0;
    let frameCount = 0;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const t = (performance.now() - startTime) / 1000;
      frameCount++;

      // 调试：第一帧打印信息
      if (frameCount === 1) {
        console.log('[SmellCanvas] draw started, w=', w, 'h=', h, 'MOCK_SMELLS.length=', MOCK_SMELLS.length);
        // 可见调试：画一个红色方块
        ctx.fillStyle = 'red';
        ctx.fillRect(10, 10, 100, 100);
      }

      // 每 60 帧在左上角画一个绿点（可见心跳）
      if (frameCount % 60 === 0) {
        ctx.fillStyle = 'lime';
        ctx.fillRect(0, 0, 8, 8);
      }

      // 合并 mock 数据 + 用户实时添加的气味
      const userSmells = useAppStore.getState().userSmells;
      const allSmells: SmellPoint[] = [...MOCK_SMELLS, ...userSmells];

      // ========== 1. 主画布：加法混合渲染气味点 ==========
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, w, h);

      // 风的单位向量
      const rad = (windDirAngle * Math.PI) / 180;
      const windX = Math.cos(rad);
      const windY = Math.sin(rad);

      // 先绘制到主画布（用加法混合制造发光叠加）
      ctx.globalCompositeOperation = 'lighter';

      for (const s of allSmells) {
        // Curl Noise 流场扰动
        const curl = curlNoise(s.position[0] + t * 0.02, s.position[1] + t * 0.02);
        const curlStrength = 0.0003;
        const windStrength = windSpeed * 0.0004;

        const windOffset = {
          lng: s.position[0] + windX * windStrength * Math.sin(t * 0.3 + s.phase) + curl[0] * curlStrength,
          lat: s.position[1] + windY * windStrength * Math.sin(t * 0.3 + s.phase) + curl[1] * curlStrength,
        };

        const screen = map.project([windOffset.lng, windOffset.lat]);
        const x = screen.x * dpr;
        const y = screen.y * dpr;

        // 离屏检测
        if (x < -300 || x > w + 300 || y < -300 || y > h + 300) continue;

        // 呼吸动画
        const breath = 1 + 0.15 * Math.sin(t * 0.5 + s.phase);
        const baseRadius = 160 * s.intensity * (0.4 + 0.6 * s.age) * breath;
        const radius = baseRadius * dpr;

        // OKLCH → RGB
        const [r, g, b] = oklchToRgb255(s.oklch.L, s.oklch.C, s.oklch.H);
        const ageFade = 0.3 + 0.7 * s.age;
        const baseAlpha = s.intensity * ageFade;

        // === 噪声边缘扰动 ===
        const noiseSeed = s.position[0] * 0.1 + s.position[1] * 0.1;

        // 外层：大光晕（用噪声制造不规则边缘）
        const outerR = radius;
        const outer = ctx.createRadialGradient(x, y, 0, x, y, outerR);
        outer.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${baseAlpha * 0.35})`);
        outer.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${baseAlpha * 0.2})`);
        outer.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${baseAlpha * 0.08})`);
        outer.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = outer;
        ctx.beginPath();
        // 用噪声扰动圆形边缘
        const segments = 32;
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          const noiseVal = simplex2(
            Math.cos(angle) * 3 + noiseSeed + t * 0.15,
            Math.sin(angle) * 3 + noiseSeed + t * 0.1
          );
          const noisyR = outerR * (1 + 0.2 * noiseVal);
          const px = x + Math.cos(angle) * noisyR;
          const py = y + Math.sin(angle) * noisyR;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // 中层：稍锐的色团
        const midR = radius * 0.5;
        const mid = ctx.createRadialGradient(x, y, 0, x, y, midR);
        mid.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${baseAlpha * 0.6})`);
        mid.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${baseAlpha * 0.3})`);
        mid.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = mid;
        ctx.beginPath();
        ctx.arc(x, y, midR, 0, Math.PI * 2);
        ctx.fill();

        // 内核：明亮中心
        const coreR = radius * 0.18;
        const core = ctx.createRadialGradient(x, y, 0, x, y, coreR);
        const brightR = Math.min(255, r + 50);
        const brightG = Math.min(255, g + 50);
        const brightB = Math.min(255, b + 50);
        core.addColorStop(0, `rgba(${brightR}, ${brightG}, ${brightB}, ${Math.min(1, baseAlpha * 1.2)})`);
        core.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(x, y, coreR, 0, Math.PI * 2);
        ctx.fill();
      }

      // ========== 2. Bloom 辉光效果 ==========
      // 用离屏 Canvas 做高斯模糊叠加
      bloomCtx.globalCompositeOperation = 'source-over';
      bloomCtx.clearRect(0, 0, w, h);

      // 把主画布内容复制到 bloom 画布
      bloomCtx.drawImage(canvas, 0, 0);

      // 水平模糊
      bloomCtx.globalCompositeOperation = 'source-over';
      const blurPasses = 3;
      for (let pass = 0; pass < blurPasses; pass++) {
        const imageData = bloomCtx.getImageData(0, 0, w, h);
        const data = imageData.data;
        const temp = new Uint8ClampedArray(data);

        // 水平方向
        const radius_blur = 8;
        for (let y2 = 0; y2 < h; y2++) {
          for (let x2 = 0; x2 < w; x2++) {
            let r_acc = 0, g_acc = 0, b_acc = 0, a_acc = 0;
            let weightSum = 0;
            for (let dx = -radius_blur; dx <= radius_blur; dx++) {
              const sx = x2 + dx;
              if (sx < 0 || sx >= w) continue;
              const idx = (y2 * w + sx) * 4;
              const weight = 1 - Math.abs(dx) / radius_blur;
              r_acc += temp[idx] * weight;
              g_acc += temp[idx + 1] * weight;
              b_acc += temp[idx + 2] * weight;
              a_acc += temp[idx + 3] * weight;
              weightSum += weight;
            }
            const idx = (y2 * w + x2) * 4;
            data[idx] = r_acc / weightSum;
            data[idx + 1] = g_acc / weightSum;
            data[idx + 2] = b_acc / weightSum;
            data[idx + 3] = a_acc / weightSum;
          }
        }

        // 垂直方向
        const temp2 = new Uint8ClampedArray(data);
        for (let x2 = 0; x2 < w; x2++) {
          for (let y2 = 0; y2 < h; y2++) {
            let r_acc = 0, g_acc = 0, b_acc = 0, a_acc = 0;
            let weightSum = 0;
            for (let dy = -radius_blur; dy <= radius_blur; dy++) {
              const sy = y2 + dy;
              if (sy < 0 || sy >= h) continue;
              const idx = (sy * w + x2) * 4;
              const weight = 1 - Math.abs(dy) / radius_blur;
              r_acc += temp2[idx] * weight;
              g_acc += temp2[idx + 1] * weight;
              b_acc += temp2[idx + 2] * weight;
              a_acc += temp2[idx + 3] * weight;
              weightSum += weight;
            }
            const idx = (y2 * w + x2) * 4;
            data[idx] = r_acc / weightSum;
            data[idx + 1] = g_acc / weightSum;
            data[idx + 2] = b_acc / weightSum;
            data[idx + 3] = a_acc / weightSum;
          }
        }

        bloomCtx.putImageData(imageData, 0, 0);
      }

      // ========== 3. 合成：主画布 + Bloom 辉光 ==========
      // 用 lighter 模式叠加辉光到主画布
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(bloomCanvas, 0, 0);
      ctx.globalCompositeOperation = 'source-over';

      // 调试信息
      if (frameCount % 30 === 0) {
        // console.log(`[SmellCanvas] frame=${frameCount} smells=${allSmells.length}`);
      }

      animId = requestAnimationFrame(draw);
    };

    // 等待地图首次渲染完成再开始
    const onLoad = () => {
      console.log('[SmellCanvas] starting render loop, smells:', MOCK_SMELLS.length);
      draw();
    };

    if (map.loaded()) {
      onLoad();
    } else {
      map.once('load', onLoad);
    }

    return () => {
      cancelAnimationFrame(animId);
      map.off('resize', resize);
    };
  }, [map, windSpeed, windDirAngle]);

  return (
    <>
      {/* Bloom 离屏画布（不可见但保持尺寸） */}
      <canvas
        ref={bloomRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 14, opacity: 0, pointerEvents: 'none' }}
      />
      {/* 主渲染画布 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 15 }}
      />
    </>
  );
}
