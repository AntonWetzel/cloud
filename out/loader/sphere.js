import { Cloud } from '../gpu/cloud.js';
export async function CreateSphere(points, r, g, b, radius) {
    const vertices = new Float32Array(points * 3);
    const colors = new Float32Array(vertices.length);
    for (let i = 0; i < points; i++) {
        const long = Math.acos(Math.random() * 2 - 1); //less points near the poles
        const lat = Math.random() * 2 * Math.PI;
        vertices[i * 3 + 0] = Math.sin(lat) * Math.sin(long);
        vertices[i * 3 + 1] = Math.cos(long);
        vertices[i * 3 + 2] = Math.cos(lat) * Math.sin(long);
        colors[i * 3 + 0] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
    }
    return {
        node: new Cloud(vertices, colors, radius),
        name: 'sphere',
    };
}
