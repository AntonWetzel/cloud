import * as GPU from './gpu.js';
import * as Module from './module.js';
import { GetServerFile } from '../helper/file.js';
let computePipeline = undefined;
export const K = 16;
export async function Compute(positions, length) {
    if (computePipeline == undefined) {
        computePipeline = GPU.device.createComputePipeline({
            compute: {
                module: Module.New(await GetServerFile('../shaders/compute/triangulate.wgsl')),
                entryPoint: 'main',
            },
        });
    }
    const nearest = GPU.CreateEmptyBuffer(length * 4 * K, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC);
    const power = 14;
    for (let i = 0; i < length; i += 1 << power) {
        const encoder = GPU.device.createCommandEncoder();
        const param = new Uint32Array([length, i]);
        const buffer = GPU.CreateBuffer(param, GPUBufferUsage.STORAGE);
        const group = GPU.device.createBindGroup({
            layout: computePipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: { buffer: buffer },
                },
                {
                    binding: 1,
                    resource: { buffer: positions },
                },
                {
                    binding: 2,
                    resource: { buffer: nearest },
                },
            ],
        });
        const compute = encoder.beginComputePass();
        compute.setPipeline(computePipeline);
        compute.setBindGroup(0, group);
        const c = Math.min(1 << (power - 8), Math.ceil(length / 256));
        compute.dispatch(c);
        console.log(c);
        compute.endPass();
        GPU.device.queue.submit([encoder.finish()]);
    }
    return nearest;
}
