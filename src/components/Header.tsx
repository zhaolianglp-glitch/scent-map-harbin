// 标题区组件
export function Header() {
  return (
    <header className="absolute top-0 left-0 z-20 p-10 pointer-events-none select-none">
      <h1
        className="text-ink font-display tracking-wide"
        style={{
          fontSize: 'clamp(2.2rem, 3.6vw, 3.2rem)',
          fontWeight: 700,
          letterSpacing: '0.04em',
          lineHeight: 1.1,
        }}
      >
        气味地图
      </h1>
      <p
        className="text-ink/55 font-serif mt-3 max-w-md"
        style={{
          fontSize: 'clamp(0.85rem, 1vw, 1rem)',
          lineHeight: 1.7,
          letterSpacing: '0.02em',
        }}
      >
        一座城市的无意识呼吸。
        <br />
        每个坐标都是某个人，在某个瞬间，闻到的世界。
      </p>
    </header>
  );
}
