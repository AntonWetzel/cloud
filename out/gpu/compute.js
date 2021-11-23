import { CreateBuffer, device, NewModule } from './gpu.js';
const pipelines = {
    filterDang: undefined,
    filterDist: undefined,
    kNearestList: undefined,
    kNearestIter: undefined,
    normalLinear: undefined,
    normalTriang: undefined,
    curvatureDist: undefined,
    curvatureAngle: undefined,
    triangulateAll: undefined,
    triangulateNearest: undefined,
    reduceP1: undefined,
    reduceP2: undefined,
    sort: undefined,
    kNearestSorted: undefined,
};
export async function Setup() {
    for (const name in pipelines) {
        pipelines[name] = device.createComputePipeline({
            compute: {
                module: NewModule(await (await fetch('./compute/' + name + '.wgsl')).text()),
                entryPoint: 'main',
            },
        });
    }
}
export function Compute(name, length, parameter, buffers, result = false) {
    const paramU32 = new Uint32Array(parameter.length + 1);
    paramU32[0] = length;
    for (let i = 0; i < parameter.length; i++) {
        paramU32[i + 1] = parameter[i];
    }
    const buffer = CreateBuffer(paramU32, GPUBufferUsage.STORAGE);
    const x = [];
    x.push({
        binding: 0,
        resource: { buffer: buffer },
    });
    for (let i = 0; i < buffers.length; i++) {
        x.push({
            binding: i + 1,
            resource: { buffer: buffers[i] }
        });
    }
    const pipeline = pipelines[name];
    const group = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: x,
    });
    const encoder = device.createCommandEncoder({
        measureExecutionTime: true
    });
    const compute = encoder.beginComputePass({});
    compute.setPipeline(pipeline);
    compute.setBindGroup(0, group);
    compute.dispatch(Math.ceil(length / 256));
    compute.endPass();
    const commands = encoder.finish();
    device.queue.submit([commands]);
    if (result) {
        return buffer;
    }
    else {
        buffer.destroy();
        return undefined;
    }
}
