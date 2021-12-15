import { CreateBuffer, device, NewModule } from './gpu.js';
const pipelines = {
    cleanDang: undefined,
    cleanLong: undefined,
    kNearestList: undefined,
    kNearestIter: undefined,
    kNearestIterSorted: undefined,
    kNearestListSorted: undefined,
    normalLinear: undefined,
    normalTriang: undefined,
    curvaturePoints: undefined,
    curvatureNormal: undefined,
    triangulateAll: undefined,
    triangulateNearest: undefined,
    reduceLow: undefined,
    reduceAnomaly: undefined,
    sort: undefined,
    noise: undefined,
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
    const paramU32 = new Uint32Array(1 + parameter[0].length + parameter[1].length);
    const paramF32 = new Float32Array(paramU32.buffer);
    paramU32[0] = length;
    for (let i = 0; i < parameter[0].length; i++) {
        paramU32[i + 1] = parameter[0][i];
    }
    for (let i = 0; i < parameter[1].length; i++) {
        paramF32[parameter[0].length + i + 1] = parameter[1][i];
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
    const encoder = device.createCommandEncoder();
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
