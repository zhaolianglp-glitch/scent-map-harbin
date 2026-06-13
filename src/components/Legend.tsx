// 图例组件 - 显示当前可见的气味类型
import { SMELL_PALETTE, oklchToCss } from '../utils/colorPalette';

export function Legend() {
  return (
    <div className="absolute bottom-0 left-0 z-20 p-8 pointer-events-none select-none">
      <div className="text-ink/55 font-serif" style={{ fontSize: '0.7rem', letterSpacing: '0.1em' }}>
        ATLAS OF INVISIBLE CITIES
      </div>
      <div className="mt-4 space-y-1.5 max-w-[260px]">
        {SMELL_PALETTE.slice(0, 8).map((item) => (
          <div
            key={item.keyword}
            className="flex items-center gap-2.5 text-ink/70"
            style={{ fontSize: '0.72rem' }}
          >
            <span
              className="inline-block rounded-full"
              style={{
                width: 10,
                height: 10,
                background: oklchToCss(item.oklch, 0.85),
                boxShadow: `0 0 12px ${oklchToCss(item.oklch, 0.4)}`,
              }}
            />
            <span className="font-serif">{item.keyword}</span>
            <span className="text-ink/35 font-mono text-[0.62rem] ml-auto">
              {item.enKeyword}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
