import * as GPU from './gpu.js';
import * as Module from './module.js';
let computePipeline = undefined;
let renderPipeline = undefined;
export const K = 16;
export async function Compute(positions, length) {
    if (computePipeline == undefined) {
        computePipeline = GPU.device.createComputePipeline({
            compute: {
                module: Module.New(await (await fetch('/compute/triangulate.wgsl')).text()),
                entryPoint: 'main',
            },
        });
    }
    const nearest = GPU.CreateEmptyBuffer(length * 4 * K, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC);
    const encoder = GPU.device.createCommandEncoder();
    const param = new Uint32Array([length]);
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
    compute.dispatch(Math.ceil(length / 256));
    compute.endPass();
    GPU.device.queue.submit([encoder.finish()]);
    return nearest;
}
export async function Render(position, positions, colors, nearest, k, length) {
    if (renderPipeline == undefined) {
        const src = await (await fetch('/render/triangle.wgsl')).text();
        const module = Module.New(src);
        renderPipeline = GPU.device.createRenderPipeline({
            vertex: {
                module: module,
                entryPoint: 'vertexMain',
                buffers: [],
            },
            fragment: {
                module: module,
                entryPoint: 'fragmentMain',
                targets: [
                    {
                        format: GPU.format,
                    },
                ],
            },
            depthStencil: {
                format: 'depth32float',
                depthWriteEnabled: true,
                depthCompare: 'less',
            },
            primitive: {
                topology: 'triangle-list',
            },
        });
    }
    const array = new Float32Array(16 + 1);
    position.Save(array, 0);
    new Uint32Array(array.buffer)[16] = k;
    const buffer = GPU.CreateBuffer(array, GPUBufferUsage.UNIFORM);
    GPU.renderPass.setPipeline(renderPipeline);
    const group = GPU.device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: { buffer: GPU.cameraBuffer },
            },
            {
                binding: 1,
                resource: { buffer: buffer },
            },
            {
                binding: 2,
                resource: { buffer: positions },
            },
            {
                binding: 3,
                resource: { buffer: colors },
            },
            {
                binding: 4,
                resource: { buffer: nearest },
            },
        ],
    });
    GPU.renderPass.setBindGroup(0, group);
    GPU.renderPass.draw(length * k * 3);
}
