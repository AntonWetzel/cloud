import { Textured } from './textured.js';
import { Lines } from './lines.js';
import { Colored } from './colored.js';
import * as Quad from './quad.js';
import { Light } from './light.js';
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
        shadows: undefined,
        pointShadows: undefined,
        sampler: device.createSampler({
            compare: 'less-equal',
        }),
    };
    sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });
    Resize(width, height);
    await Quad.Setup();
    await Textured.Setup();
    await Lines.Setup();
    await Colored.Setup();
    await Quad.Setup();
    await Light.Setup();
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
    global.shadows = device.createTexture({
        size: {
            width: canvas.width,
            height: canvas.height,
            depthOrArrayLayers: 10,
        },
        format: 'depth32float',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    global.pointShadows = device.createTexture({
        size: {
            width: 512,
            height: 512,
            depthOrArrayLayers: 10,
        },
        format: 'depth32float',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
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
