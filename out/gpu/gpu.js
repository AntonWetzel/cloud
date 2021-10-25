export let adapter;
export let device;
export const clearColor = { r: 0.0, g: 0.01, b: 0.05, a: 1.0 };
export let format;
export let sampler;
export let canvas;
export let context;
export let global;
export let depth;
export async function Setup(width, height) {
    if (window.navigator.gpu == undefined) {
        return undefined;
    }
    adapter = (await window.navigator.gpu.requestAdapter());
    device = (await adapter.requestDevice());
    canvas = document.createElement('canvas');
    context = canvas.getContext('webgpu');
    format = context.getPreferredFormat(adapter);
    global = {
        aspect: undefined,
    };
    sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });
    Resize(width, height);
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
export let cameraBuffer;
export let renderPass;
let encoder;
export function StartRender(camera) {
    encoder = device.createCommandEncoder();
    renderPass = encoder.beginRenderPass({
        colorAttachments: [
            {
                loadValue: clearColor,
                storeOp: 'store',
                view: context.getCurrentTexture().createView(),
            },
        ],
        depthStencilAttachment: {
            depthLoadValue: 1.0,
            depthStoreOp: 'store',
            stencilLoadValue: 0,
            stencilStoreOp: 'store',
            view: depth.createView(),
        },
    });
    cameraBuffer = camera.Buffer();
}
export function FinishRender() {
    renderPass.endPass();
    device.queue.submit([encoder.finish()]);
}
export function CreateBuffer(data, usage) {
    const buffer = device.createBuffer({
        size: data.byteLength,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | usage,
        mappedAtCreation: true,
    });
    if (data.byteLength > 200) {
        console.log('buffer', data.byteLength);
    }
    new Uint8Array(buffer.getMappedRange()).set(new Uint8Array(data.buffer));
    buffer.unmap();
    return buffer;
}
export function CreateEmptyBuffer(length, usage) {
    const buffer = device.createBuffer({
        size: length,
        usage: usage,
        mappedAtCreation: false,
    });
    return buffer;
}
export async function ReadBuffer(buffer, size) {
    const temp = CreateEmptyBuffer(size, GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST);
    // Encode commands for copying buffer to buffer.
    const copyEncoder = device.createCommandEncoder();
    copyEncoder.copyBufferToBuffer(buffer /* source buffer */, 0 /* source offset */, temp /* destination buffer */, 0 /* destination offset */, size /* size */);
    const copyCommands = copyEncoder.finish();
    device.queue.submit([copyCommands]);
    await temp.mapAsync(GPUMapMode.READ);
    const copyArrayBuffer = temp.getMappedRange();
    return copyArrayBuffer;
}
