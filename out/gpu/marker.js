import * as GPU from './gpu.js';
import * as Module from './module.js';
import { GetServerFile } from '../helper/file.js';
let pipeline;
let positions;
let colors;
export async function Setup() {
    const src = await GetServerFile('../shaders/flat.wgsl');
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
                            format: 'float32x3',
                        },
                        {
                            shaderLocation: 1,
                            offset: 3 * 4,
                            format: 'float32x3',
                        },
                    ],
                    arrayStride: 6 * 4,
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
            topology: 'triangle-list',
            cullMode: 'none',
        },
    });
    positions = GPU.CreateBuffer(new Float32Array([
        /*eslint-disable*/
        -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0
        /*eslint-enable*/
    ]), GPUBufferUsage.VERTEX);
}
export async function Draw(view, renderPass) {
    renderPass.setPipeline(pipeline);
    const group = GPU.device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: GPU.sampler,
            },
            {
                binding: 1,
                resource: view,
            },
        ],
    });
    renderPass.setBindGroup(0, group);
    renderPass.setVertexBuffer(0, quadBuffer);
    renderPass.draw(4);
}
