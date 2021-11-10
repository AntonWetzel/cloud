let adapter;
export let device;
export const clearColor = { r: 0.0, g: 0.1, b: 0.2, a: 1.0 };
export let format;
let canvas;
let context;
let depth;
export let cameraBuffer;
export let renderPass;
let encoder;
export function aspect() {
    return canvas.width / canvas.height;
}
export async function Setup(width, height) {
    if (window.navigator.gpu == undefined) {
        return undefined;
    }
    adapter = await window.navigator.gpu.requestAdapter({
        powerPreference: 'high-performance',
    });
    device = await adapter.requestDevice();
    canvas = document.createElement('canvas');
    context = canvas.getContext('webgpu');
    format = context.getPreferredFormat(adapter);
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
}
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