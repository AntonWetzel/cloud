import * as GPU from './gpu.js';
import * as Module from './module.js';
import { GetServerFile } from '../helper/file.js';
let pipeline;
let quadBuffer;
export async function Setup() {
    const src = await GetServerFile('../shaders/quad.wgsl');
    const module = Module.New(src);
    pipeline = GPU.device.createRenderPipeline({
        vertex: {
            module: module,
            entryPoint: 'vertexMain',
            buffers: [
                {
                    attributes: [
                        {
                            shaderLocation: 0,
                            offset: 0 * 4,
                            format: 'float32x2',
                        },
                    ],
                    arrayStride: 2 * 4,
                    stepMode: 'vertex',
                },
            ],
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
        primitive: {
            topology: 'triangle-strip',
            stripIndexFormat: 'uint32',
            cullMode: 'back',
        },
    });
    quadBuffer = GPU.CreateBuffer(new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]), GPUBufferUsage.VERTEX);
}
export async function Draw(view, renderPass) {
    renderPass.setPipeline(pipeline);
    const array = new Float32Array(1);
    array[0] = GPU.global.aspect;
    const buffer = GPU.CreateBuffer(array, GPUBufferUsage.UNIFORM);
    const group = GPU.device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: { buffer: buffer },
            },
            {
                binding: 1,
                resource: GPU.sampler,
            },
            {
                binding: 2,
                resource: view,
            },
        ],
    });
    renderPass.setBindGroup(0, group);
    renderPass.setVertexBuffer(0, quadBuffer);
    renderPass.draw(4);
}
