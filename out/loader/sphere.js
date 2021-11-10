import * as GPU from '../gpu/gpu.js';
export function CreateSphere(points) {
    const vertices = new Float32Array(points * 4);
    for (let i = 0; i < points; i++) {
        const long = Math.acos(Math.random() * 2 - 1); //less points near the poles
        const lat = Math.random() * 2 * Math.PI;
        vertices[i * 4 + 0] = Math.sin(lat) * Math.sin(long);
        vertices[i * 4 + 1] = Math.cos(long);
        vertices[i * 4 + 2] = Math.cos(lat) * Math.sin(long);
    }
    return GPU.CreateBuffer(vertices, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
}
