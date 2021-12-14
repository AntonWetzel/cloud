import * as GPU from '../gpu/header.js';
import SimplexNoise from './noise.js';
export function Create(points) {
    const count = Math.floor(Math.sqrt(points));
    const vertices = new Float32Array(count * count * 4);
    const noise = new SimplexNoise();
    for (let i = 0; i < count; i++) {
        for (let j = 0; j < count; j++) {
            vertices[(i * count + j) * 4 + 0] = i / count - 0.5;
            vertices[(i * count + j) * 4 + 1] = noise.noise2D(i * 0.01, j * 0.01) / count * 25;
            vertices[(i * count + j) * 4 + 2] = j / count - 0.5;
            if (Math.random() <= 0.03) {
                vertices[(i * count + j) * 4 + 1] += (0.5 + Math.random()) / count * 5;
            }
        }
    }
    return [
        GPU.CreateBuffer(vertices, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE),
        count * count
    ];
}
