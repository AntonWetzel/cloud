import * as GPU from '../gpu/gpu.js';
//https://github.com/PointCloudLibrary/pcl/blob/master/test/lamppost.pcd
const data = [
    /*eslint-disable*/
    -0.8, 1, -0.8,
    -1, 1, 0,
    -0.8, 1, 0.8,
    0, 1, -1,
    0, 1, 0,
    0, 1, 1,
    0.8, 1, -0.8,
    1, 1, 0,
    0.8, 1, 0.8,
    /*eslint-enable*/
];
export function CreateTest() {
    const size = data.length / 3;
    const vertices = new Float32Array(size * 4);
    for (let i = 0; i < size; i++) {
        vertices[i * 4 + 0] = data[i * 3 + 0];
        vertices[i * 4 + 1] = data[i * 3 + 1];
        vertices[i * 4 + 2] = data[i * 3 + 2];
    }
    return [
        GPU.CreateBuffer(vertices, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE),
        vertices.length / 4,
    ];
}
