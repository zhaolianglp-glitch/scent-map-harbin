// SmellLayer: MapLibre Custom Layer
// 使用四边形（quads）而非点精灵，绕开 WebGL 2 的 gl_PointSize 限制
import type { CustomLayerInterface, Map as MapLibreMap } from 'maplibre-gl';
import type { SmellPoint } from '../data/mockSmells';
import { vertexShader, fragmentShader } from './shaders/shaders';

interface SmellLayerOptions {
  smells: SmellPoint[];
  windSpeed?: number;
  windDir?: [number, number];
}

// 6 个顶点构成一个四边形（2 个三角形）
// 顺序：左下、右下、左上、右上、左上'、右上'（实际上是 6 个）
// 简化：BL, BR, TL, TR, TR', BL' 模式
const QUAD_CORNERS: [number, number][] = [
  [-1, -1], // BL
  [ 1, -1], // BR
  [-1,  1], // TL
  [ 1, -1], // BR
  [ 1,  1], // TR
  [-1,  1], // TL
];

export class SmellLayer implements CustomLayerInterface {
  id = 'smell-layer';
  type = 'custom' as const;
  renderingMode = '2d' as const;

  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private buffer: WebGLBuffer | null = null;
  private aPosLoc = 0;
  private aCornerLoc = 0;
  private aOklchLoc = 0;
  private aIntensityLoc = 0;
  private aAgeLoc = 0;
  private aPhaseLoc = 0;
  private uMatrixLoc: WebGLUniformLocation | null = null;
  private uTimeLoc: WebGLUniformLocation | null = null;
  private uZoomLoc: WebGLUniformLocation | null = null;
  private uWindSpeedLoc: WebGLUniformLocation | null = null;
  private uWindDirLoc: WebGLUniformLocation | null = null;
  private uCanvasSizeLoc: WebGLUniformLocation | null = null;
  private smellsCount: number;
  private smellsRef: SmellPoint[];

  private startTime = performance.now();
  private currentZoom = 12;
  private canvasWidth = 1;
  private canvasHeight = 1;
  private renderCount = 0;
  private currentWindSpeed: number;
  private currentWindDir: [number, number];

  constructor(options: SmellLayerOptions) {
    this.smellsRef = options.smells;
    this.smellsCount = options.smells.length;
    this.currentWindSpeed = options.windSpeed ?? 0.4;
    this.currentWindDir = options.windDir ?? [1, 0];
  }

  setWind(speed: number, dir: [number, number]) {
    this.currentWindSpeed = speed;
    this.currentWindDir = dir;
  }

  onAdd(map: MapLibreMap, gl: WebGLRenderingContext) {
    console.log('[SmellLayer] onAdd, smells count:', this.smellsCount);
    this.gl = gl;
    this.program = this.createProgram(gl, vertexShader, fragmentShader);
    if (!this.program) {
      console.error('[SmellLayer] Failed to create program');
      return;
    }

    this.aPosLoc = gl.getAttribLocation(this.program, 'a_pos');
    this.aCornerLoc = gl.getAttribLocation(this.program, 'a_corner');
    this.aOklchLoc = gl.getAttribLocation(this.program, 'a_oklch');
    this.aIntensityLoc = gl.getAttribLocation(this.program, 'a_intensity');
    this.aAgeLoc = gl.getAttribLocation(this.program, 'a_age');
    this.aPhaseLoc = gl.getAttribLocation(this.program, 'a_phase');

    this.uMatrixLoc = gl.getUniformLocation(this.program, 'u_matrix');
    this.uTimeLoc = gl.getUniformLocation(this.program, 'u_time');
    this.uZoomLoc = gl.getUniformLocation(this.program, 'u_zoom');
    this.uWindSpeedLoc = gl.getUniformLocation(this.program, 'u_windSpeed');
    this.uWindDirLoc = gl.getUniformLocation(this.program, 'u_windDir');
    this.uCanvasSizeLoc = gl.getUniformLocation(this.program, 'u_canvasSize');

    console.log('[SmellLayer] Attribute locations:', {
      pos: this.aPosLoc,
      corner: this.aCornerLoc,
      oklch: this.aOklchLoc,
      intensity: this.aIntensityLoc,
      age: this.aAgeLoc,
      phase: this.aPhaseLoc,
    });

    // 构造顶点数据：每个气味点 6 个顶点（一个 quad）
    const data: number[] = [];
    for (const s of this.smellsRef) {
      for (const [cx, cy] of QUAD_CORNERS) {
        data.push(
          s.position[0], s.position[1], // lng, lat
          cx, cy,                        // corner offset
          s.oklch.L, s.oklch.C, s.oklch.H, // OKLCH color
          s.intensity,                    // intensity
          s.age,                          // age
          s.phase,                        // phase
        );
      }
    }

    console.log('[SmellLayer] Buffer data length:', data.length, 'expected:', this.smellsCount * 6 * 10);

    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

    this.currentZoom = map.getZoom();
    this.canvasWidth = gl.canvas.width;
    this.canvasHeight = gl.canvas.height;
    console.log('[SmellLayer] Canvas size:', this.canvasWidth, 'x', this.canvasHeight);

    map.on('move', () => {
      this.currentZoom = map.getZoom();
    });
    map.on('resize', () => {
      this.canvasWidth = gl.canvas.width;
      this.canvasHeight = gl.canvas.height;
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render(gl: WebGLRenderingContext, matrix: any) {
    if (!this.program || !this.buffer) return;

    if (this.renderCount === 0) {
      console.log('[SmellLayer] First render call');
    }
    this.renderCount++;

    gl.useProgram(this.program);

    // 上传 uniforms
    if (this.uMatrixLoc) gl.uniformMatrix4fv(this.uMatrixLoc, false, matrix);
    const elapsed = (performance.now() - this.startTime) / 1000;
    if (this.uTimeLoc) gl.uniform1f(this.uTimeLoc, elapsed);
    if (this.uZoomLoc) gl.uniform1f(this.uZoomLoc, this.currentZoom);
    if (this.uWindSpeedLoc) gl.uniform1f(this.uWindSpeedLoc, this.currentWindSpeed);
    if (this.uWindDirLoc) gl.uniform2f(this.uWindDirLoc, this.currentWindDir[0], this.currentWindDir[1]);
    if (this.uCanvasSizeLoc) gl.uniform2f(this.uCanvasSizeLoc, this.canvasWidth, this.canvasHeight);

    // 绑定属性：10 floats per vertex
    const stride = 10 * 4;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    if (this.aPosLoc >= 0) {
      gl.enableVertexAttribArray(this.aPosLoc);
      gl.vertexAttribPointer(this.aPosLoc, 2, gl.FLOAT, false, stride, 0);
    }
    if (this.aCornerLoc >= 0) {
      gl.enableVertexAttribArray(this.aCornerLoc);
      gl.vertexAttribPointer(this.aCornerLoc, 2, gl.FLOAT, false, stride, 2 * 4);
    }
    if (this.aOklchLoc >= 0) {
      gl.enableVertexAttribArray(this.aOklchLoc);
      gl.vertexAttribPointer(this.aOklchLoc, 3, gl.FLOAT, false, stride, 4 * 4);
    }
    if (this.aIntensityLoc >= 0) {
      gl.enableVertexAttribArray(this.aIntensityLoc);
      gl.vertexAttribPointer(this.aIntensityLoc, 1, gl.FLOAT, false, stride, 7 * 4);
    }
    if (this.aAgeLoc >= 0) {
      gl.enableVertexAttribArray(this.aAgeLoc);
      gl.vertexAttribPointer(this.aAgeLoc, 1, gl.FLOAT, false, stride, 8 * 4);
    }
    if (this.aPhaseLoc >= 0) {
      gl.enableVertexAttribArray(this.aPhaseLoc);
      gl.vertexAttribPointer(this.aPhaseLoc, 1, gl.FLOAT, false, stride, 9 * 4);
    }

    // 加法混合
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.depthMask(false);

    gl.drawArrays(gl.TRIANGLES, 0, this.smellsCount * 6);

    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }

  onRemove(map: MapLibreMap, gl: WebGLRenderingContext) {
    console.log('[SmellLayer] onRemove');
    if (this.buffer) gl.deleteBuffer(this.buffer);
    if (this.program) gl.deleteProgram(this.program);
  }

  private compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      console.error('[SmellLayer] Shader compile error:', info);
      console.error('[SmellLayer] Source:', source);
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private createProgram(gl: WebGLRenderingContext, vertSrc: string, fragSrc: string): WebGLProgram | null {
    const vert = this.compileShader(gl, gl.VERTEX_SHADER, vertSrc);
    const frag = this.compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
    if (!vert || !frag) return null;
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      console.error('[SmellLayer] Program link error:', info);
      return null;
    }
    return program;
  }
}
