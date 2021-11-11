import { cameraBuffer, CreateBuffer, device, format, NewModule, renderPass } from './gpu.js';
import { sources } from './sources.js';
let pipeline = undefined;
export function Render(position, length, positions, colors) {
    if (pipeline == undefined) {
        const module = NewModule(sources['lines']);
        pipeline = device.createRenderPipeline({
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
                        format: format,
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
    const array = new Float32Array(16);
    position.Save(array, 0);
    const buffer = CreateBuffer(array, GPUBufferUsage.UNIFORM);
    renderPass.setPipeline(pipeline);
    const group = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: { buffer: cameraBuffer },
            },
            {
                binding: 1,
                resource: { buffer: buffer },
            },
        ],
    });
    renderPass.setBindGroup(0, group);
    renderPass.setVertexBuffer(0, positions);
    renderPass.setVertexBuffer(1, colors);
    renderPass.draw(length);
}
