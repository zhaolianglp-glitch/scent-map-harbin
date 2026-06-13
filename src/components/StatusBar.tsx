// 状态栏组件 - 显示风速风向、城市、时间
import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useMapStore';

function angleToCompass(deg: number): string {
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  const idx = Math.round(((deg % 360) / 45)) % 8;
  return dirs[idx];
}

function beaufortLevel(speed: number): string {
  // speed is 0-1, map to 0-12 级
  const level = Math.round(speed * 6); // 0-6 级，温和
  const labels = ['无风', '软风', '轻风', '微风', '和风', '清劲风', '强风'];
  return `${level}级 · ${labels[level]}`;
}

export function StatusBar() {
  const { windSpeed, windDirAngle } = useAppStore();
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = time.toLocaleTimeString('zh-CN', { hour12: false });
  const dateStr = time.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className="absolute bottom-0 right-0 z-20 p-8 pointer-events-none select-none">
      <div className="text-right text-ink/60 font-mono space-y-1.5" style={{ fontSize: '0.78rem' }}>
        <div className="text-ink/85" style={{ fontSize: '0.9rem' }}>
          {timeStr}
        </div>
        <div className="text-ink/45 text-xs">{dateStr}</div>

        <div className="pt-3 border-t border-ink/10 mt-3 space-y-0.5">
          <div>哈尔滨 · 45.75°N 126.62°E</div>
          <div className="flex items-center justify-end gap-1.5">
            <span
              className="inline-block"
              style={{
                transform: `rotate(${windDirAngle}deg)`,
                transition: 'transform 0.6s ease',
              }}
            >
              ↑
            </span>
            <span>
              {angleToCompass(windDirAngle)}风 · {beaufortLevel(windSpeed)}
            </span>
          </div>
          <div className="text-ink/40">-12°C · 雪 · 湿度 78%</div>
        </div>
      </div>
    </div>
  );
}
