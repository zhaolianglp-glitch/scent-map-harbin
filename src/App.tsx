// App 根组件
import { MapContainer } from './components/MapContainer';
import { Header } from './components/Header';
import { StatusBar } from './components/StatusBar';
import { Legend } from './components/Legend';
import { ScentInputModal } from './components/ScentInputModal';

export default function App() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-paper">
      {/* 地图层 */}
      <MapContainer />

      {/* 气味输入模态框 */}
      <ScentInputModal />

      {/* UI 层 */}
      <Header />
      <StatusBar />
      <Legend />

      {/* 顶部渐变：标题区背景，从浅米色到透明 */}
      <div
        className="absolute top-0 left-0 right-0 h-48 pointer-events-none z-10"
        style={{
          background:
            'linear-gradient(180deg, oklch(0.97 0.01 80 / 0.85) 0%, oklch(0.97 0.01 80 / 0) 100%)',
        }}
      />

      {/* 底部渐变：图例区背景 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-72 pointer-events-none z-10"
        style={{
          background:
            'linear-gradient(0deg, oklch(0.97 0.01 80 / 0.7) 0%, oklch(0.97 0.01 80 / 0) 100%)',
        }}
      />
    </div>
  );
}
