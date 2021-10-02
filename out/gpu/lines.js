import * as GPU from './gpu.js';
import * as Module from './module.js';
import { GetServerFile } from '../helper/file.js';
export class Lines {
    static pipeline;
    static async Setup() {
        const src = await GetServerFile('../shaders/render/lines.wgsl');
        const module = Module.New(src);
        Lines.pipeline = GPU.device.createRenderPipeline({
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
                        ],
                        arrayStride: 4 * 4,
                        stepMode: 'vertex',
                    },
                    {
                        attributes: [
                            {
                                shaderLocation: 1,
                                offset: 0 * 4,
                                format: 'float32x3',
                            },
                        ],
                        arrayStride: 4 * 4,
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
            depthStencil: {
                format: 'depth32float',
                depthWriteEnabled: true,
                depthCompare: 'less',
            },
            primitive: {
                topology: 'line-list',
            },
        });
    }
    static Render(position, length, positions, colors) {
        const array = new Float32Array(16);
        position.Save(array, 0);
        const buffer = GPU.CreateBuffer(array, GPUBufferUsage.UNIFORM);
        GPU.renderPass.setPipeline(Lines.pipeline);
        const group = GPU.device.createBindGroup({
            layout: Lines.pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: { buffer: GPU.cameraBuffer },
                },
                {
                    binding: 1,
                    resource: { buffer: buffer },
                },
            ],
        });
        GPU.renderPass.setBindGroup(0, group);
        GPU.renderPass.setVertexBuffer(0, positions);
        GPU.renderPass.setVertexBuffer(1, colors);
        GPU.renderPass.draw(length);
    }
    SubShadow = undefined;
    SubMap = undefined;
    GetPipeline() {
        return Lines.pipeline;
    }
}
