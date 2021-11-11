import * as GPU from '../gpu/header.js';
export function Create(points) {
    const colors = new Float32Array(points * 4);
    for (let i = 0; i < 1; i++) {
        colors[i * 4 + 0] = 0.3 + 0.7 * Math.random();
        colors[i * 4 + 1] = 0.3 + 0.7 * Math.random();
        colors[i * 4 + 2] = 0.3 + 0.7 * Math.random();
    }
    return GPU.CreateBuffer(colors, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
}
