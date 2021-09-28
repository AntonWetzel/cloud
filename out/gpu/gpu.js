import { Lines } from './lines.js';
import { Colored } from './colored.js';
import { Light } from './light.js';
import { Cloud } from './cloud.js';
export let adapter;
export let device;
export const clearColor = { r: 0.0, g: 0.01, b: 0.05, a: 1.0 };
export let format;
export let sampler;
export let canvas;
export let context;
export let global;
export let depth;
export async function Setup(width, height, ambient) {
    adapter = (await window.navigator.gpu.requestAdapter());
    device = (await adapter.requestDevice());
    canvas = document.createElement('canvas');
    context = canvas.getContext('webgpu');
    format = context.getPreferredFormat(adapter);
    global = {
        ambient: ambient,
        aspect: undefined,
    };
    sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });
    Resize(width, height);
    await Lines.Setup();
    await Colored.Setup();
    await Light.Setup();
    await Cloud.Setup();
    return canvas;
}
export function Resize(width, height) {
    context.configure({
        device: device,
        format: format,
        size: { width: width, height: height },
    });
    canvas.width = width;
    canvas.height = height;
    depth = device.createTexture({
        size: {
            width: canvas.width,
            height: canvas.height,
        },
        format: 'depth32float',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    global.aspect = canvas.width / canvas.height;
}
export function CreateBuffer(data, usage) {
    const buffer = device.createBuffer({
        size: Math.floor((data.byteLength + 3) / 4) * 4,
        usage: GPUBufferUsage.COPY_DST | usage,
        mappedAtCreation: true,
    });
    new Uint8Array(buffer.getMappedRange()).set(new Uint8Array(data.buffer));
    buffer.unmap();
    return buffer;
}
export function CreateEmptyBuffer(length, usage) {
    const buffer = device.createBuffer({
        size: length,
        usage: GPUBufferUsage.COPY_DST | usage,
        mappedAtCreation: false,
    });
    return buffer;
}
