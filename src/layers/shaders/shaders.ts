// GLSL Shader 源码 - Quad 版本
// 用四边形（quads）替代点精灵，绕开 WebGL 2 的 gl_PointSize 限制

export const vertexShader = /* glsl */ `
precision highp float;

// 顶点属性（每顶点 10 floats）
attribute vec2 a_pos;          // 气味点经纬度 [lng, lat]
attribute vec2 a_corner;       // 四边形角点偏移 (-1,1) 范围
attribute vec3 a_oklch;        // 颜色 (L, C, H)
attribute float a_intensity;   // 强度
attribute float a_age;         // 老化 (0-1, 1=新鲜)
attribute float a_phase;       // 呼吸相位偏移

// Uniforms
uniform mat4 u_matrix;         // 地图投影矩阵
uniform float u_time;
uniform float u_zoom;
uniform float u_windSpeed;     // 0-1
uniform vec2 u_windDir;        // 单位向量
uniform vec2 u_canvasSize;     // 画布像素尺寸

// Varyings
varying vec2 v_uv;             // 角点坐标 (-1, 1) 范围
varying vec3 v_oklch;
varying float v_intensity;
varying float v_age;
varying float v_phase;
varying float v_windOffset;

// Simplex noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
       + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  // Curl noise 模拟气流
  float curlScale = 50.0;
  float t = u_time * 0.15;
  vec2 noiseInput = a_pos * curlScale + vec2(t, -t * 0.7);
  float nx = snoise(noiseInput);
  float ny = snoise(noiseInput + vec2(100.0, 50.0));

  vec2 windField = u_windDir * u_windSpeed * 0.02 + vec2(nx, ny) * 0.008;
  vec2 displacedPos = a_pos + windField;

  // 投影到 clip space
  gl_Position = u_matrix * vec4(displacedPos, 0.0, 1.0);

  // 透视除法，得到 NDC
  vec2 ndcCenter = gl_Position.xy / gl_Position.w;

  // 像素大小 → NDC 偏移（绕开 gl_PointSize 限制）
  // 基础尺寸 200px，缩放自适应
  float zoomFactor = 1.0 / pow(2.0, u_zoom - 11.0);
  float breath = 1.0 + 0.15 * sin(u_time * 0.6 + a_phase);
  float pixelSize = 200.0 * a_intensity * (0.5 + 0.5 * a_age) * breath * zoomFactor;
  pixelSize = clamp(pixelSize, 40.0, 350.0);

  // 像素 → NDC：NDC 范围 -1..1 对应 画布宽度的 1 倍
  vec2 ndcOffset = (a_corner * pixelSize * 2.0) / u_canvasSize;

  // 应用偏移（在 NDC 空间）
  gl_Position = vec4((ndcCenter + ndcOffset) * gl_Position.w, gl_Position.z, gl_Position.w);

  // Varyings
  v_uv = a_corner; // -1 到 1
  v_oklch = a_oklch;
  v_intensity = a_intensity;
  v_age = a_age;
  v_phase = a_phase;
  v_windOffset = length(windField);
}
`;

export const fragmentShader = /* glsl */ `
precision highp float;

varying vec2 v_uv;             // 角点坐标 (-1, 1) 范围
varying vec3 v_oklch;
varying float v_intensity;
varying float v_age;
varying float v_phase;
varying float v_windOffset;

uniform float u_time;

// OKLCH → Linear sRGB
vec3 oklchToRgb(float L, float C, float H) {
  float h = H * 3.14159265 / 180.0;
  float a = C * cos(h);
  float b = C * sin(h);

  float l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  float m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  float s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  float l = l_ * l_ * l_;
  float m = m_ * m_ * m_;
  float s = s_ * s_ * s_;

  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

// Simplex noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
       + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  // UV 从 (-1,-1) 到 (1,1)
  float r = length(v_uv);
  if (r > 1.0) discard;

  // === 多层结构（4 层叠加，水墨晕染）===

  // Layer 1: 径向衰减（更柔）
  float radial = 1.0 - smoothstep(0.0, 1.0, r);

  // Layer 2: 噪声扰动边缘
  float n1 = snoise(v_uv * 4.0 + u_time * 0.2);
  float n2 = snoise(v_uv * 8.0 - u_time * 0.15);
  float noiseEdge = 1.0 + 0.5 * n1 + 0.3 * n2;

  // Layer 3: 内核（中心点，更亮更实）
  float core = pow(1.0 - r, 6.0);

  // Layer 4: 外晕
  float halo = pow(1.0 - r, 1.5);

  // 混合各层
  float alpha = radial * noiseEdge * 0.5 + core * 0.8 + halo * 0.3;
  alpha = clamp(alpha, 0.0, 1.0);

  // 老化
  float ageFade = mix(0.4, 1.0, v_age);
  alpha *= ageFade;

  // 总强度
  alpha *= v_intensity;

  // 颜色：OKLCH → RGB
  vec3 color = oklchToRgb(v_oklch.x, v_oklch.y, v_oklch.z);
  color = max(color, vec3(0.0));

  // 中心高光
  color += vec3(0.2) * core;

  // 风的扰动痕迹
  if (v_windOffset > 0.005) {
    float windHighlight = smoothstep(0.5, 0.9, r) * (v_windOffset * 50.0) * 0.3;
    color += color * windHighlight;
  }

  gl_FragColor = vec4(color * alpha, alpha);
}
`;
