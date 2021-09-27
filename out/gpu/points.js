import * as GPU from './gpu.js';
import * as Module from './module.js';
import * as Object from './node.js';
import { GetServerFile } from '../helper/file.js';
export class Points extends Object.Node {
    static pipeline;
    static quadBuffer;
    static async Setup() {
        const src = await GetServerFile('../shaders/point.wgsl');
        const module = Module.New(src);
        Points.pipeline = GPU.device.createRenderPipeline({
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
        Points.quadBuffer = GPU.CreateBuffer(new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]), GPUBufferUsage.VERTEX);
    }
    uniform;
    buffer;
    constructor(points, colors, radius) {
        super();
        this.uniform = {
            radius: radius,
            aspect: undefined,
        };
        this.buffer = {};
        this.SetPoints(points);
        this.SetColor(colors);
    }
    SetPoints(points) {
        this.buffer.length = points.length / 3;
        this.buffer.points = GPU.CreateBuffer(points, GPUBufferUsage.VERTEX);
    }
    SetColor(colors) {
        this.buffer.colors = GPU.CreateBuffer(colors, GPUBufferUsage.VERTEX);
    }
    Draw(vp) {
        const mvp = vp.Multiply(this.model);
        const array = new Float32Array(20);
        array.set([this.uniform.radius, GPU.uniform.aspect, 0, 0], 0);
        mvp.Save(array, 4);
        const buffer = GPU.CreateBuffer(array, GPUBufferUsage.UNIFORM);
        GPU.renderPass.setPipeline(Points.pipeline);
        const group = GPU.device.createBindGroup({
            layout: Points.pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: { buffer: buffer },
                },
            ],
        });
        GPU.renderPass.setBindGroup(0, group);
        GPU.renderPass.setVertexBuffer(0, Points.quadBuffer);
        GPU.renderPass.setVertexBuffer(1, this.buffer.points);
        GPU.renderPass.setVertexBuffer(2, this.buffer.colors);
        GPU.renderPass.draw(4, this.buffer.length);
    }
    DrawShadow(vp) {
        //pass
    }
    SetRadius(radius) {
        this.uniform.radius = radius;
    }
    GetRadius() {
        return this.uniform.radius;
    }
    GetPipeline() {
        return Points.pipeline;
    }
}
