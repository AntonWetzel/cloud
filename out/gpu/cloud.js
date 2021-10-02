import * as GPU from './gpu.js';
import * as Module from './module.js';
import { GetServerFile } from '../helper/file.js';
export class Cloud {
    static pipeline;
    static kNearest;
    static importance;
    static smooth;
    static quadBuffer;
    static async Setup() {
        const src = await GetServerFile('../shaders/render/cloud.wgsl');
        const module = Module.New(src);
        Cloud.pipeline = GPU.device.createRenderPipeline({
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
                    {
                        attributes: [
                            {
                                shaderLocation: 1,
                                offset: 0 * 4,
                                format: 'float32x3',
                            },
                        ],
                        arrayStride: 4 * 4,
                        stepMode: 'instance',
                    },
                    {
                        attributes: [
                            {
                                shaderLocation: 2,
                                offset: 0 * 4,
                                format: 'float32x3',
                            },
                        ],
                        arrayStride: 4 * 4,
                        stepMode: 'instance',
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
                topology: 'triangle-strip',
                stripIndexFormat: 'uint32',
                cullMode: 'back',
            },
        });
        Cloud.quadBuffer = GPU.CreateBuffer(new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]), GPUBufferUsage.VERTEX);
        Cloud.kNearest = GPU.device.createComputePipeline({
            compute: {
                module: Module.New(await GetServerFile('../shaders/compute/kNearest.wgsl')),
                entryPoint: 'main',
            },
        });
        Cloud.importance = GPU.device.createComputePipeline({
            compute: {
                module: Module.New(await GetServerFile('../shaders/compute/importance.wgsl')),
                entryPoint: 'main',
            },
        });
        Cloud.smooth = GPU.device.createComputePipeline({
            compute: {
                module: Module.New(await GetServerFile('../shaders/compute/smooth.wgsl')),
                entryPoint: 'main',
            },
        });
    }
    static Render(position, radius, length, positions, colors) {
        const array = new Float32Array(16 + 3);
        position.Save(array, 0);
        array[16] = radius;
        array[17] = GPU.global.aspect;
        const buffer = GPU.CreateBuffer(array, GPUBufferUsage.UNIFORM);
        GPU.renderPass.setPipeline(Cloud.pipeline);
        const group = GPU.device.createBindGroup({
            layout: Cloud.pipeline.getBindGroupLayout(0),
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
        GPU.renderPass.setVertexBuffer(0, Cloud.quadBuffer);
        GPU.renderPass.setVertexBuffer(1, positions);
        GPU.renderPass.setVertexBuffer(2, colors);
        GPU.renderPass.draw(4, length);
    }
    kNearest(k) {
        const nearest = GPU.CreateEmptyBuffer(this.buffer.length * 4 + k, GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX);
        const param = new Float32Array(4);
        new Uint32Array(param.buffer).set([this.buffer.length, k], 0);
        const buffer = GPU.CreateBuffer(param, GPUBufferUsage.STORAGE);
        const group = GPU.device.createBindGroup({
            layout: Cloud.kNearest.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: { buffer: buffer },
                },
                {
                    binding: 1,
                    resource: { buffer: this.buffer.positions },
                },
                {
                    binding: 3,
                    resource: { buffer: nearest },
                },
            ],
        });
        const encoder = GPU.device.createCommandEncoder();
        const compute = encoder.beginComputePass({});
        compute.setPipeline(Cloud.kNearest);
        compute.setBindGroup(0, group);
        compute.dispatch(Math.ceil(this.buffer.length / 256));
        compute.endPass();
        GPU.device.queue.submit([encoder.finish()]);
        return nearest;
    }
    importance(threshhold) {
        const param = new Float32Array(4);
        new Uint32Array(param.buffer).set([this.buffer.length], 0);
        param[1] = threshhold;
        const buffer = GPU.CreateBuffer(param, GPUBufferUsage.STORAGE);
        const group = GPU.device.createBindGroup({
            layout: Cloud.importance.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: { buffer: buffer },
                },
                {
                    binding: 1,
                    resource: { buffer: this.buffer.positions },
                },
                {
                    binding: 2,
                    resource: { buffer: this.buffer.colors },
                },
            ],
        });
        const encoder = GPU.device.createCommandEncoder();
        const compute = encoder.beginComputePass({});
        compute.setPipeline(Cloud.importance);
        compute.setBindGroup(0, group);
        compute.dispatch(Math.ceil(this.buffer.length / 256));
        compute.endPass();
        GPU.device.queue.submit([encoder.finish()]);
    }
    smooth(amount) {
        const param = new Float32Array(4);
        new Uint32Array(param.buffer).set([this.buffer.length], 0);
        param[1] = amount;
        const buffer = GPU.CreateBuffer(param, GPUBufferUsage.STORAGE);
        const group = GPU.device.createBindGroup({
            layout: Cloud.smooth.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: { buffer: buffer },
                },
                {
                    binding: 1,
                    resource: { buffer: this.buffer.positions },
                },
            ],
        });
        const encoder = GPU.device.createCommandEncoder();
        const compute = encoder.beginComputePass({});
        compute.setPipeline(Cloud.smooth);
        compute.setBindGroup(0, group);
        compute.dispatch(Math.ceil(this.buffer.length / 256));
        compute.endPass();
        GPU.device.queue.submit([encoder.finish()]);
    }
}
