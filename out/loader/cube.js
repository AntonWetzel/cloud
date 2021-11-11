import * as GPU from '../gpu/header.js';
export function Create(points, noise = 0.001) {
    const vertices = new Float32Array(points * 4);
    for (let i = 0; i < points; i++) {
        switch (Math.floor(Math.random() * 6)) {
            case 0:
                vertices[i * 4 + 0] = Math.random() * 2 - 1;
                vertices[i * 4 + 1] = Math.random() * 2 - 1;
                vertices[i * 4 + 2] = -1;
                break;
            case 1:
                vertices[i * 4 + 0] = Math.random() * 2 - 1;
                vertices[i * 4 + 1] = Math.random() * 2 - 1;
                vertices[i * 4 + 2] = 1;
                break;
            case 2:
                vertices[i * 4 + 0] = Math.random() * 2 - 1;
                vertices[i * 4 + 1] = -1;
                vertices[i * 4 + 2] = Math.random() * 2 - 1;
                break;
            case 3:
                vertices[i * 4 + 0] = Math.random() * 2 - 1;
                vertices[i * 4 + 1] = 1;
                vertices[i * 4 + 2] = Math.random() * 2 - 1;
                break;
            case 4:
                vertices[i * 4 + 0] = -1;
                vertices[i * 4 + 1] = Math.random() * 2 - 1;
                vertices[i * 4 + 2] = Math.random() * 2 - 1;
                break;
            case 5:
                vertices[i * 4 + 0] = 1;
                vertices[i * 4 + 1] = Math.random() * 2 - 1;
                vertices[i * 4 + 2] = Math.random() * 2 - 1;
                break;
        }
        vertices[i * 4 + 0] += noise * Math.random();
        vertices[i * 4 + 1] += noise * Math.random();
        vertices[i * 4 + 2] += noise * Math.random();
    }
    return GPU.CreateBuffer(vertices, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
}
