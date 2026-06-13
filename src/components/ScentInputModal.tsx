// ScentInputModal — 点击地图后弹出的气味输入框
import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useMapStore';
import { SMELL_PALETTE } from '../utils/colorPalette';

// 文字→颜色映射（简单关键词匹配 + 随机 fallback）
function textToColor(text: string): { L: number; C: number; H: number } {
  const lower = text.toLowerCase();

  // 关键词匹配
  for (const item of SMELL_PALETTE) {
    if (lower.includes(item.keyword)) {
      return { ...item.oklch };
    }
  }

  // 情感/语义启发式映射
  if (/好吃|香|甜|美食|面包|烧烤|肉/.test(lower)) {
    return { L: 0.75, C: 0.15, H: 40 + Math.random() * 30 }; // 暖橙
  }
  if (/臭|垃圾|污|脏/.test(lower)) {
    return { L: 0.4, C: 0.12, H: 60 + Math.random() * 20 }; // 暗黄绿
  }
  if (/花|香|清新|草|树/.test(lower)) {
    return { L: 0.75, C: 0.12, H: 120 + Math.random() * 60 }; // 绿/粉
  }
  if (/雨|水|江|河|海|湿/.test(lower)) {
    return { L: 0.7, C: 0.08, H: 220 + Math.random() * 30 }; // 蓝
  }
  if (/雪|冰|冷|冬/.test(lower)) {
    return { L: 0.9, C: 0.04, H: 230 }; // 冷白
  }
  if (/暖|阳|光|热/.test(lower)) {
    return { L: 0.85, C: 0.14, H: 50 + Math.random() * 20 }; // 金黄
  }
  if (/夜|暗|黑|晚/.test(lower)) {
    return { L: 0.3, C: 0.08, H: 260 + Math.random() * 40 }; // 深紫
  }
  if (/旧|老|古|砖/.test(lower)) {
    return { L: 0.55, C: 0.1, H: 30 + Math.random() * 15 }; // 棕
  }

  // 随机从调色板选一个
  const palette = SMELL_PALETTE[Math.floor(Math.random() * SMELL_PALETTE.length)];
  return { ...palette.oklch };
}

export function ScentInputModal() {
  const { modalOpen, modalPosition, closeModal, addUserSmell } = useAppStore();
  const [text, setText] = useState('');
  const [previewColor, setPreviewColor] = useState({ L: 0.6, C: 0.1, H: 30 });
  const inputRef = useRef<HTMLInputElement>(null);

  // 打开时自动聚焦
  useEffect(() => {
    if (modalOpen) {
      setText('');
      setPreviewColor({ L: 0.6, C: 0.1, H: 30 });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [modalOpen]);

  // 实时预览颜色
  useEffect(() => {
    if (text.trim().length > 0) {
      setPreviewColor(textToColor(text.trim()));
    }
  }, [text]);

  if (!modalOpen || !modalPosition) return null;

  const handleSubmit = () => {
    const keyword = text.trim();
    if (!keyword) return;
    const color = textToColor(keyword);
    addUserSmell(modalPosition.lng, modalPosition.lat, keyword, color);
    closeModal();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') closeModal();
  };

  const previewCss = `oklch(${(previewColor.L * 100).toFixed(0)}% ${previewColor.C.toFixed(2)} ${previewColor.H.toFixed(0)})`;

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center pointer-events-auto"
      style={{ background: 'rgba(0,0,0,0.15)' }}
      onClick={closeModal}
    >
      <div
        className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 w-80"
        style={{
          boxShadow: `0 8px 40px rgba(0,0,0,0.12), 0 0 60px ${previewCss}20`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div
            className="w-12 h-12 rounded-full mx-auto mb-2"
            style={{
              background: previewCss,
              boxShadow: `0 0 30px ${previewCss}60`,
              transition: 'all 0.3s ease',
            }}
          />
          <p className="text-xs text-gray-400 font-mono">
            {text ? previewCss : '输入气味描述'}
          </p>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 20))}
          onKeyDown={handleKeyDown}
          placeholder="你闻到了什么？"
          maxLength={20}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80
                     text-center text-lg font-serif text-gray-800
                     placeholder:text-gray-300
                     focus:outline-none focus:ring-2 focus:ring-gray-300
                     transition-all duration-200"
          style={{
            borderColor: text ? previewCss : '#e5e7eb',
            boxShadow: text ? `0 0 20px ${previewCss}20` : 'none',
          }}
        />

        <p className="text-xs text-gray-400 text-center mt-2 font-mono">
          {text.length}/20 · Enter 确认 · Esc 取消
        </p>

        <div className="flex gap-2 mt-4">
          <button
            onClick={closeModal}
            className="flex-1 py-2 rounded-xl text-sm text-gray-500
                       bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="flex-1 py-2 rounded-xl text-sm text-white font-medium
                       transition-all duration-200 disabled:opacity-30"
            style={{
              background: text.trim() ? previewCss : '#d1d5db',
              boxShadow: text.trim() ? `0 4px 15px ${previewCss}40` : 'none',
            }}
          >
            标记气味
          </button>
        </div>
      </div>
    </div>
  );
}
