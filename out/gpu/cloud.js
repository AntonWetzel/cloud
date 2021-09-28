import * as GPU from './gpu.js';
import * as Module from './module.js';
import { GetServerFile } from '../helper/file.js';
import { Node } from './node.js';
export class Cloud extends Node {
    static pipeline;
    static kNearest;
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
                        arrayStride: 3 * 4,
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
                        arrayStride: 3 * 4,
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
    }
    radius;
    buffer;
    constructor(points, colors, radius) {
        super();
        this.radius = radius;
        this.buffer = {};
        this.SetPoints(points);
        this.SetColor(colors);
    }
    SetPoints(points) {
        this.buffer.length = points.length / 3;
        this.buffer.positions = GPU.CreateBuffer(points, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
    }
    SetColor(colors) {
        this.buffer.colors = GPU.CreateBuffer(colors, GPUBufferUsage.VERTEX);
    }
    SubRender(projection, view, model, renderPass, lights) {
        const array = new Float32Array(16 * 3 + 3);
        projection.Save(array, 0);
        view.Save(array, 16);
        model.Save(array, 32);
        array[48] = GPU.global.ambient;
        array[49] = this.radius;
        array[50] = GPU.global.aspect;
        const buffer = GPU.CreateBuffer(array, GPUBufferUsage.UNIFORM);
        renderPass.setPipeline(Cloud.pipeline);
        const group = GPU.device.createBindGroup({
            layout: Cloud.pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: { buffer: buffer },
                },
                {
                    binding: 1,
                    resource: { buffer: lights },
                },
            ],
        });
        renderPass.setBindGroup(0, group);
        renderPass.setVertexBuffer(0, Cloud.quadBuffer);
        renderPass.setVertexBuffer(1, this.buffer.positions);
        renderPass.setVertexBuffer(2, this.buffer.colors);
        renderPass.draw(4, this.buffer.length);
    }
    kNearest(k, r, g, b) {
        const size = this.buffer.length * 4 * 3 * 2 * k; // bytePerFloat * floatPerPoint * PointsPerLine * k
        const lines = GPU.CreateEmptyBuffer(size, GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX);
        const color = GPU.CreateEmptyBuffer(size, GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX);
        const param = new Float32Array(8);
        new Uint32Array(param.buffer).set([this.buffer.length, k], 0);
        param[4] = r;
        param[5] = g;
        param[6] = b;
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
                    binding: 2,
                    resource: { buffer: lines },
                },
                {
                    binding: 3,
                    resource: { buffer: color },
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
        return {
            positions: lines,
            colors: color,
        };
    }
}
