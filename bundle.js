let adapter;
let device;
const clearColor = { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };
//export const clearColor = { r: 0.0, g: 0.1, b: 0.2, a: 1.0 }
let format;
let canvas;
let context;
let depth;
let cameraBuffer;
let renderPass;
let encoder;
function aspect() {
    return canvas.width / canvas.height;
}
async function Setup$3(width, height) {
    if (window.navigator.gpu == undefined) {
        return undefined;
    }
    adapter = await window.navigator.gpu.requestAdapter();
    if (adapter == null) {
        return undefined;
    }
    device = await adapter.requestDevice();
    if (device == null) {
        return undefined;
    }
    canvas = document.createElement('canvas');
    context = canvas.getContext('webgpu');
    format = context.getPreferredFormat(adapter);
    Resize(width, height);
    return canvas;
}
function Resize(width, height) {
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
function StartRender(camera) {
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
function FinishRender() {
    renderPass.endPass();
    device.queue.submit([encoder.finish()]);
}
function CreateBuffer(data, usage) {
    const size = data.byteLength < 80 ? 80 : data.byteLength;
    const buffer = device.createBuffer({
        size: size,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | usage,
        mappedAtCreation: true,
    });
    new Uint8Array(buffer.getMappedRange()).set(new Uint8Array(data.buffer));
    buffer.unmap();
    return buffer;
}
function CreateEmptyBuffer(length, usage) {
    const buffer = device.createBuffer({
        size: length,
        usage: usage,
        mappedAtCreation: false,
    });
    return buffer;
}
async function ReadBuffer(buffer, size) {
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
function NewModule(src) {
    const module = device.createShaderModule({
        code: src,
    });
    return module;
}

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
async function Setup$2() {
    const requests = {};
    for (const name in pipelines) {
        requests[name] = fetch('./compute/' + name + '.wgsl');
    }
    for (const name in pipelines) {
        pipelines[name] = device.createComputePipeline({
            compute: {
                module: NewModule(await (await requests[name]).text()),
                entryPoint: 'main',
            },
        });
    }
}
function Compute(name, length, parameter, buffers, result = false) {
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

const sources = {
    cloud: undefined,
    kNearest: undefined,
    lines: undefined,
    triangle: undefined,
};
async function Setup$1() {
    const requests = {};
    for (const name in sources) {
        requests[name] = fetch('./render/' + name + '.wgsl');
    }
    for (const name in sources) {
        sources[name] = await (await requests[name]).text();
    }
}

class Matrix {
    data;
    constructor(data) {
        this.data = data;
    }
    static Identity() {
        return new Matrix(new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]));
    }
    Save(location, offset) {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                location[offset + i * 4 + j] = this.data[i + j * 4];
            }
        }
    }
    static Translate(x, y, z) {
        return new Matrix(new Float32Array([
            /*eslint-disable*/
            1, 0, 0, x,
            0, 1, 0, y,
            0, 0, 1, z,
            0, 0, 0, 1
            /*eslint-enable*/
        ]));
    }
    static RotateX(rad) {
        return new Matrix(new Float32Array([
            /*eslint-disable*/
            1, 0, 0, 0,
            0, Math.cos(rad), -Math.sin(rad), 0,
            0, Math.sin(rad), Math.cos(rad), 0,
            0, 0, 0, 1,
            /*eslint-enable*/
        ]));
    }
    static Rotate(rad, axis) {
        const sin = Math.sin(rad);
        const cos = Math.cos(rad);
        const cosN = 1 - cos;
        //https://en.wikipedia.org/wiki/Rotation_matrix#Rotation_matrix_from_axis_and_angle
        return new Matrix(new Float32Array([
            /*eslint-disable*/
            axis.x * axis.x * cosN + cos,
            axis.x * axis.y * cosN - axis.z * sin,
            axis.x * axis.z * cosN + axis.y * sin,
            0,
            axis.y * axis.x * cosN + axis.z * sin,
            axis.y * axis.y * cosN + cos,
            axis.y * axis.z * cosN - axis.x * sin,
            0,
            axis.z * axis.x * cosN - axis.y * sin,
            axis.z * axis.y * cosN + axis.x * sin,
            axis.z * axis.z * cosN + cos,
            0,
            0, 0, 0, 1,
            /*eslint-enable*/
        ]));
    }
    static RotateY(rad) {
        return new Matrix(new Float32Array([
            /*eslint-disable*/
            Math.cos(rad), 0, Math.sin(rad), 0,
            0, 1, 0, 0,
            -Math.sin(rad), 0, Math.cos(rad), 0,
            0, 0, 0, 1,
            /*eslint-enable*/
        ]));
    }
    static RotateZ(rad) {
        return new Matrix(new Float32Array([
            /*eslint-disable*/
            Math.cos(rad), -Math.sin(rad), 0, 0,
            Math.sin(rad), Math.cos(rad), 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
            /*eslint-enable*/
        ]));
    }
    static Scale(x, y, z) {
        return new Matrix(new Float32Array([
            /*eslint-disable*/
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1,
            /*eslint-enable*/
        ]));
    }
    Multiply(m) {
        const res = new Float32Array(16);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                for (let c = 0; c < 4; c++) {
                    res[i + j * 4] += this.data[c + j * 4] * m.data[i + c * 4];
                }
            }
        }
        return new Matrix(res);
    }
    MultiplyVector(v) {
        return {
            x: this.data[0] * v.x + this.data[1] * v.y + this.data[2] * v.z,
            y: this.data[4] * v.x + this.data[5] * v.y + this.data[6] * v.z,
            z: this.data[8] * v.x + this.data[9] * v.y + this.data[10] * v.z,
        };
    }
    Position() {
        return {
            x: this.data[3],
            y: this.data[7],
            z: this.data[11],
        };
    }
    static Perspective(fovy, aspect, near, far) {
        const c2 = (far + near) / (near - far);
        const c1 = (2 * far * near) / (near - far);
        const s = 1 / Math.tan(fovy / 2);
        const m = new Float32Array([
            s / aspect, 0, 0, 0,
            0, s, 0, 0,
            0, 0, c2, c1,
            0, 0, -1, 0,
        ]);
        return new Matrix(m);
    }
}

class Position {
    model;
    constructor() {
        this.model = Matrix.Identity();
    }
    Save(location, offset) {
        this.model.Save(location, offset);
    }
    Translate(x, y, z) {
        this.model = Matrix.Translate(x, y, z).Multiply(this.model);
    }
    RotateX(rad) {
        this.model = Matrix.RotateX(rad).Multiply(this.model);
    }
    RotateXLocal(rad) {
        const p = this.model.Position();
        this.model = Matrix.Translate(p.x, p.y, p.z)
            .Multiply(Matrix.RotateX(rad))
            .Multiply(Matrix.Translate(-p.x, -p.y, -p.z))
            .Multiply(this.model);
    }
    RotateY(rad) {
        this.model = Matrix.RotateY(rad).Multiply(this.model);
    }
    RotateYLocal(rad) {
        const p = this.model.Position();
        this.model = Matrix.Translate(p.x, p.y, p.z)
            .Multiply(Matrix.RotateY(rad))
            .Multiply(Matrix.Translate(-p.x, -p.y, -p.z))
            .Multiply(this.model);
    }
    RotateZ(rad) {
        this.model = Matrix.RotateZ(rad).Multiply(this.model);
    }
    RotateZLocal(rad) {
        const p = this.model.Position();
        this.model = Matrix.Translate(p.x, p.y, p.z)
            .Multiply(Matrix.RotateZ(rad))
            .Multiply(Matrix.Translate(-p.x, -p.y, -p.z))
            .Multiply(this.model);
    }
    Scale(x, y, z) {
        this.model = Matrix.Scale(x, y, z).Multiply(this.model);
    }
}

class Camera {
    projection;
    view;
    fov;
    constructor(fieldOfView) {
        this.projection = Matrix.Perspective(fieldOfView, aspect(), 0.1, 1000);
        this.view = Matrix.Identity();
        this.fov = fieldOfView;
    }
    set fieldOfView(val) {
        this.fov = val;
        this.projection = Matrix.Perspective(val, aspect(), 0.1, 100);
    }
    get fieldOfView() {
        return this.fov;
    }
    Buffer() {
        const array = new Float32Array(16 * 2);
        this.projection.Save(array, 0);
        this.view.Save(array, 16);
        return CreateBuffer(array, GPUBufferUsage.UNIFORM);
    }
    UpdateSize() {
        this.projection = Matrix.Perspective(this.fov, aspect(), 1, 1000);
    }
    Translate(x, y, z) {
        this.view = Matrix.Translate(-x, -y, -z).Multiply(this.view);
    }
    RotateX(rad) {
        this.view = Matrix.RotateX(-rad).Multiply(this.view);
    }
    RotateY(rad) {
        this.view = Matrix.RotateY(-rad).Multiply(this.view);
    }
    RotateGlobalY(rad) {
        const axis = this.view.MultiplyVector({ x: 0, y: 1, z: 0 });
        this.view = Matrix.Rotate(-rad, axis).Multiply(this.view);
    }
    RotateZ(rad) {
        this.view = Matrix.RotateZ(-rad).Multiply(this.view);
    }
}

let pipeline$3 = undefined;
function Render$3(position, length, positions, colors) {
    if (pipeline$3 == undefined) {
        const module = NewModule(sources['lines']);
        pipeline$3 = device.createRenderPipeline({
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
    renderPass.setPipeline(pipeline$3);
    const group = device.createBindGroup({
        layout: pipeline$3.getBindGroupLayout(0),
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

let quadBuffer = undefined;
let pipeline$2 = undefined;
function Render$2(position, radius, length, positions, colors) {
    if (pipeline$2 == undefined || quadBuffer == undefined) {
        const module = NewModule(sources['cloud']);
        pipeline$2 = device.createRenderPipeline({
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
                topology: 'triangle-strip',
                stripIndexFormat: 'uint32',
                cullMode: 'back',
            },
        });
        quadBuffer = CreateBuffer(new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]), GPUBufferUsage.VERTEX);
    }
    const array = new Float32Array(16 + 2);
    position.Save(array, 0);
    array[16] = radius;
    array[17] = aspect();
    const buffer = CreateBuffer(array, GPUBufferUsage.UNIFORM);
    renderPass.setPipeline(pipeline$2);
    const group = device.createBindGroup({
        layout: pipeline$2.getBindGroupLayout(0),
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
    renderPass.setVertexBuffer(0, quadBuffer);
    renderPass.setVertexBuffer(1, positions);
    renderPass.setVertexBuffer(2, colors);
    renderPass.draw(4, length);
}

let pipeline$1 = undefined;
function Render$1(position, positions, colors, nearest, k, length) {
    if (pipeline$1 == undefined) {
        const module = NewModule(sources['kNearest']);
        pipeline$1 = device.createRenderPipeline({
            vertex: {
                module: module,
                entryPoint: 'vertexMain',
                buffers: [],
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
    const array = new Float32Array(16 + 1);
    position.Save(array, 0);
    new Uint32Array(array.buffer)[16] = k;
    const buffer = CreateBuffer(array, GPUBufferUsage.UNIFORM);
    renderPass.setPipeline(pipeline$1);
    const group = device.createBindGroup({
        layout: pipeline$1.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: { buffer: cameraBuffer },
            },
            {
                binding: 1,
                resource: { buffer: buffer },
            },
            {
                binding: 2,
                resource: { buffer: positions },
            },
            {
                binding: 3,
                resource: { buffer: colors },
            },
            {
                binding: 4,
                resource: { buffer: nearest },
            },
        ],
    });
    renderPass.setBindGroup(0, group);
    renderPass.draw(length * k * 2);
}

let pipeline = undefined;
const K = 16;
function Render(position, positions, colors, nearest, k, length) {
    if (pipeline == undefined) {
        const module = NewModule(sources['triangle']);
        pipeline = device.createRenderPipeline({
            vertex: {
                module: module,
                entryPoint: 'vertexMain',
                buffers: [],
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
                topology: 'triangle-list',
            },
        });
    }
    const array = new Float32Array(16 + 1);
    position.Save(array, 0);
    new Uint32Array(array.buffer)[16] = k;
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
            {
                binding: 2,
                resource: { buffer: positions },
            },
            {
                binding: 3,
                resource: { buffer: colors },
            },
            {
                binding: 4,
                resource: { buffer: nearest },
            },
        ],
    });
    renderPass.setBindGroup(0, group);
    renderPass.draw(length * k * 3);
}

async function Sort(data, length) {
    const arr = new Float32Array(await ReadBuffer(data, length * 4 * 4));
    quickSort(arr, 0, length - 1);
    for (let i = 0; i < length - 1; i++) {
        if (arr[i * 4] > arr[(i + 1) * 4]) {
            console.log(i);
        }
    }
    device.queue.writeBuffer(data, 0, arr);
}
function quickSort(arr, low, high) {
    if (low < high) {
        const id = Math.floor(Math.random() * high) * 4;
        const pivot = arr[id]; // pivot 
        let i = (low - 1); // Index of smaller element and indicates the right position of pivot found so far
        for (let j = low; j <= high - 1; j++) {
            // If current element is smaller than the pivot 
            if (arr[j * 4] < pivot) {
                i++; // increment index of smaller element
                swap(arr, i, j);
            }
        }
        swap(arr, i + 1, high);
        const pi = (i + 1);
        // Separately sort elements before 
        // partition and after partition 
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}
function swap(arr, a, b) {
    const t0 = arr[a * 4 + 0];
    const t1 = arr[a * 4 + 1];
    const t2 = arr[a * 4 + 2];
    const t3 = arr[a * 4 + 3];
    arr[a * 4 + 0] = arr[b * 4 + 0];
    arr[a * 4 + 1] = arr[b * 4 + 1];
    arr[a * 4 + 2] = arr[b * 4 + 2];
    arr[a * 4 + 3] = arr[b * 4 + 3];
    arr[b * 4 + 0] = t0;
    arr[b * 4 + 1] = t1;
    arr[b * 4 + 2] = t2;
    arr[b * 4 + 3] = t3;
}

async function Setup(width, height) {
    const c = await Setup$3(width, height);
    if (c == undefined) {
        return undefined;
    }
    await Setup$1();
    await Setup$2();
    return c;
}

function Create$5(points) {
    const colors = new Float32Array(points * 4);
    for (let i = 0; i < points; i++) {
        colors[i * 4 + 0] = 0.2 + 0.5 * Math.random();
        colors[i * 4 + 1] = 0.2 + 0.5 * Math.random();
        colors[i * 4 + 2] = 0.2 + 0.5 * Math.random();
        //colors[i * 4 + 0] = 0.2 + 0.5 * i / points
        //colors[i * 4 + 1] = 0.2 + 0.5 * i / points
        //colors[i * 4 + 2] = 0.2 + 0.5 * i / points
    }
    return CreateBuffer(colors, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
}

function Create$4(points, noise = 0.001) {
    const vertices = new Float32Array(points * 4);
    for (let i = 0; i < points; i++) {
        switch (Math.floor(Math.random() * 6)) {
            case 0:
                vertices[i * 4 + 0] = Math.random() * 2 - 1;
                vertices[i * 4 + 1] = Math.random() * 2 - 1;
                vertices[i * 4 + 2] = -1;
                break;
            case 1:
                vertices[i * 4 + 0] = Math.random() * 2 - 1;
                vertices[i * 4 + 1] = Math.random() * 2 - 1;
                vertices[i * 4 + 2] = 1;
                break;
            case 2:
                vertices[i * 4 + 0] = Math.random() * 2 - 1;
                vertices[i * 4 + 1] = -1;
                vertices[i * 4 + 2] = Math.random() * 2 - 1;
                break;
            case 3:
                vertices[i * 4 + 0] = Math.random() * 2 - 1;
                vertices[i * 4 + 1] = 1;
                vertices[i * 4 + 2] = Math.random() * 2 - 1;
                break;
            case 4:
                vertices[i * 4 + 0] = -1;
                vertices[i * 4 + 1] = Math.random() * 2 - 1;
                vertices[i * 4 + 2] = Math.random() * 2 - 1;
                break;
            case 5:
                vertices[i * 4 + 0] = 1;
                vertices[i * 4 + 1] = Math.random() * 2 - 1;
                vertices[i * 4 + 2] = Math.random() * 2 - 1;
                break;
        }
        vertices[i * 4 + 0] += noise * Math.random();
        vertices[i * 4 + 1] += noise * Math.random();
        vertices[i * 4 + 2] += noise * Math.random();
    }
    return CreateBuffer(vertices, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
}

function Create$3(amount) {
    const positions = new Float32Array((amount * 4 + 3) * 8);
    const colors = new Float32Array((amount * 4 + 3) * 8);
    const addLine = (idx, start, end, color, endColor = undefined) => {
        if (endColor == undefined) {
            endColor = color;
        }
        idx *= 8;
        positions[idx + 0] = start.x;
        positions[idx + 1] = start.y;
        positions[idx + 2] = start.z;
        colors[idx + 0] = color.x;
        colors[idx + 1] = color.y;
        colors[idx + 2] = color.z;
        positions[idx + 4] = end.x;
        positions[idx + 5] = end.y;
        positions[idx + 6] = end.z;
        colors[idx + 4] = endColor.x;
        colors[idx + 5] = endColor.y;
        colors[idx + 6] = endColor.z;
    };
    for (let i = -amount; i <= amount; i++) {
        if (i == 0) {
            continue;
        }
        let idx;
        if (i < 0) {
            idx = i;
        }
        else if (i == 0) {
            continue;
        }
        else {
            idx = i - 1;
        }
        addLine(amount * 1 + idx, { x: i, y: 0, z: amount }, { x: i, y: 0, z: -amount }, { x: 0, y: 0, z: 0 });
        addLine(amount * 3 + idx, { x: amount, y: 0, z: i }, { x: -amount, y: 0, z: i }, { x: 0, y: 0, z: 0 });
    }
    //3 main axes
    addLine(amount * 4 + 0, { x: -amount, y: 0, z: 0 }, { x: amount, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
    addLine(amount * 4 + 1, { x: 0, y: -amount, z: 0 }, { x: 0, y: amount, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
    addLine(amount * 4 + 2, { x: 0, y: 0, z: -amount }, { x: 0, y: 0, z: amount }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 });
    return {
        length: (amount * 4 + 3) * 2,
        positions: CreateBuffer(positions, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE),
        colors: CreateBuffer(colors, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE),
    };
}

//edited
//https://gitlab.com/taketwo/three-pcd-loader/-/blob/master/decompress-lzf.js
function LZF(inData, outLength) {
    const inLength = inData.length;
    const outData = new Uint8Array(outLength);
    let inPtr = 0;
    let outPtr = 0;
    do {
        let ctrl = inData[inPtr++];
        if (ctrl < 1 << 5) {
            ctrl++;
            if (outPtr + ctrl > outLength)
                throw new Error('Output buffer is not large enough');
            if (inPtr + ctrl > inLength)
                throw new Error('Invalid compressed data');
            do {
                outData[outPtr++] = inData[inPtr++];
            } while (--ctrl);
        }
        else {
            let len = ctrl >> 5;
            let ref = outPtr - ((ctrl & 0x1f) << 8) - 1;
            if (inPtr >= inLength)
                throw new Error('Invalid compressed data');
            if (len === 7) {
                len += inData[inPtr++];
                if (inPtr >= inLength)
                    throw new Error('Invalid compressed data');
            }
            ref -= inData[inPtr++];
            if (outPtr + len + 2 > outLength)
                throw new Error('Output buffer is not large enough');
            if (ref < 0)
                throw new Error('Invalid compressed data');
            if (ref >= outPtr)
                throw new Error('Invalid compressed data');
            do {
                outData[outPtr++] = outData[ref++];
            } while (--len + 2);
        }
    } while (inPtr < inLength);
    return outData;
}

//edited
/**
 * @author Filipe Caixeta / http://filipecaixeta.com.br
 * @author Sergey Alexandrov
 *
 * Description: A THREE loader for PCD files.
 *
 * Based on the example THREE.PCDLoader written by Filipe Caixeta.
 *
 * Changes:
 *
 *   - added support for compressed binary files
 *   - significantly improved header parsing time
 *   - added support for RGBA color field
 *   - removed support for normals field
 *
 */
const littleEndian = true;
function Create$2(data) {
    const header = parseHeader(data);
    if (header == null) {
        return undefined;
    }
    const offset = header.offset;
    let position = undefined;
    if (offset.x !== undefined && offset.y !== undefined && offset.z !== undefined) {
        position = new Float32Array(header.points * 4);
    }
    let color = undefined;
    let color_offset = undefined;
    if (offset.rgb !== undefined || offset.rgba !== undefined) {
        color = new Float32Array(header.points * 4);
        color_offset = offset.rgb === undefined ? offset.rgba : offset.rgb;
    }
    if (header.data === 'ascii') {
        const charArrayView = new Uint8Array(data);
        let dataString = '';
        for (let j = header.headerLen; j < data.byteLength; j++) {
            dataString += String.fromCharCode(charArrayView[j]);
        }
        const lines = dataString.split('\n');
        let i3 = 0;
        for (let i = 0; i < lines.length; i++, i3 += 4) {
            const line = lines[i].split(' ');
            if (position !== undefined) {
                position[i3 + 0] = parseFloat(line[offset.x]);
                position[i3 + 1] = parseFloat(line[offset.y]);
                position[i3 + 2] = parseFloat(line[offset.z]);
            }
            if (color !== undefined) {
                let c = undefined;
                if (offset.rgba !== undefined) {
                    c = new Uint32Array([parseInt(line[offset.rgba])]);
                }
                else if (offset.rgb !== undefined) {
                    c = new Float32Array([parseFloat(line[offset.rgb])]);
                }
                const dataview = new Uint8Array(c.buffer, 0);
                color[i3 + 2] = dataview[0] / 255.0;
                color[i3 + 1] = dataview[1] / 255.0;
                color[i3 + 0] = dataview[2] / 255.0;
            }
        }
    }
    else if (header.data === 'binary') {
        let row = 0;
        const dataArrayView = new DataView(data, header.headerLen);
        for (let p = 0; p < header.points; row += header.rowSize, p++) {
            if (position !== undefined) {
                position[p * 4 + 0] = dataArrayView.getFloat32(row + offset.x, littleEndian);
                position[p * 4 + 1] = dataArrayView.getFloat32(row + offset.y, littleEndian);
                position[p * 4 + 2] = dataArrayView.getFloat32(row + offset.z, littleEndian);
            }
            if (color !== undefined) {
                color[p * 4 + 2] = dataArrayView.getUint8(row + color_offset + 0) / 255.0;
                color[p * 4 + 1] = dataArrayView.getUint8(row + color_offset + 1) / 255.0;
                color[p * 4 + 0] = dataArrayView.getUint8(row + color_offset + 2) / 255.0;
            }
        }
    }
    else if (header.data === 'binary_compressed') {
        const sizes = new Uint32Array(data.slice(header.headerLen, header.headerLen + 8));
        const compressedSize = sizes[0];
        const decompressedSize = sizes[1];
        const decompressed = LZF(new Uint8Array(data, header.headerLen + 8, compressedSize), decompressedSize);
        const dataArrayView = new DataView(decompressed.buffer);
        for (let p = 0; p < header.points; p++) {
            if (position !== undefined) {
                position[p * 4 + 0] = dataArrayView.getFloat32(offset.x + p * 4, littleEndian);
                position[p * 4 + 1] = dataArrayView.getFloat32(offset.y + p * 4, littleEndian);
                position[p * 4 + 2] = dataArrayView.getFloat32(offset.z + p * 4, littleEndian);
            }
            if (color !== undefined) {
                color[p * 4 + 2] = dataArrayView.getUint8(color_offset + p * 4 + 0) / 255.0;
                color[p * 4 + 1] = dataArrayView.getUint8(color_offset + p * 4 + 1) / 255.0;
                color[p * 4 + 0] = dataArrayView.getUint8(color_offset + p * 4 + 2) / 255.0;
            }
        }
    }
    if (position == undefined) {
        return undefined;
    }
    let x = 0;
    let y = 0;
    let z = 0;
    for (let i = 0; i < position.length; i += 4) {
        x += position[i + 0];
        y += position[i + 1];
        z += position[i + 2];
    }
    x /= position.length / 4;
    y /= position.length / 4;
    z /= position.length / 4;
    for (let i = 0; i < position.length; i += 4) {
        position[i + 0] -= x;
        position[i + 1] -= y;
        position[i + 2] -= z;
    }
    console.log('Size:', position.length / 4);
    return [
        CreateBuffer(position, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE),
        header.points,
    ];
}
function parseHeader(binaryData) {
    let headerText = '';
    const charArray = new Uint8Array(binaryData);
    let i = 0;
    const max = charArray.length;
    while (i < max && headerText.search(/[\r\n]DATA\s(\S*)\s/i) === -1) {
        headerText += String.fromCharCode(charArray[i++]);
    }
    const result1 = headerText.search(/[\r\n]DATA\s(\S*)\s/i);
    const result2 = /[\r\n]DATA\s(\S*)\s/i.exec(headerText.substr(result1 - 1));
    if (result1 == undefined || result2 == undefined) {
        return null;
    }
    const header = {};
    header.data = result2[1];
    header.headerLen = result2[0].length + result1;
    header.str = headerText.substr(0, header.headerLen);
    // Remove comments
    header.str = header.str.replace(/#.*/gi, '');
    const version = /VERSION (.*)/i.exec(header.str);
    if (version !== null) {
        header.version = parseFloat(version[1]);
    }
    const fields = /FIELDS (.*)/i.exec(header.str);
    if (fields !== null) {
        header.fields = fields[1].split(' ');
    }
    const size = /SIZE (.*)/i.exec(header.str);
    if (size !== null) {
        header.size = size[1].split(' ').map(function (x) {
            return parseInt(x, 10);
        });
    }
    const type = /TYPE (.*)/i.exec(header.str);
    if (type !== null) {
        header.type = type[1].split(' ');
    }
    const count = /COUNT (.*)/i.exec(header.str);
    if (count !== null) {
        header.count = count[1].split(' ').map(function (x) {
            return parseInt(x, 10);
        });
    }
    const width = /WIDTH (.*)/i.exec(header.str);
    if (width !== null) {
        header.width = parseInt(width[1]);
    }
    const height = /HEIGHT (.*)/i.exec(header.str);
    if (height !== null) {
        header.height = parseInt(height[1]);
    }
    const viewpoint = /VIEWPOINT (.*)/i.exec(header.str);
    if (viewpoint !== null) {
        header.viewpoint = viewpoint[1];
    }
    const points = /POINTS (.*)/i.exec(header.str);
    if (points !== null) {
        header.points = parseInt(points[1], 10);
    }
    if (header.points === null) {
        header.points = header.width * header.height;
    }
    if (header.count == undefined) {
        header.count = [];
        for (i = 0; i < header.fields.length; i++) {
            header.count.push(1);
        }
    }
    header.offset = {};
    let sizeSum = 0;
    for (let j = 0; j < header.fields.length; j++) {
        if (header.data === 'ascii') {
            header.offset[header.fields[j]] = j;
        }
        else if (header.data === 'binary') {
            header.offset[header.fields[j]] = sizeSum;
            sizeSum += header.size[j];
        }
        else if (header.data === 'binary_compressed') {
            header.offset[header.fields[j]] = sizeSum;
            sizeSum += header.size[j] * header.points;
        }
    }
    // For binary only
    header.rowSize = sizeSum;
    return header;
}

function Create$1(points) {
    const vertices = new Float32Array(points * 4);
    for (let i = 0; i < points; i++) {
        const long = Math.acos(Math.random() * 2 - 1); //less points near the poles
        const lat = Math.random() * 2 * Math.PI;
        vertices[i * 4 + 0] = Math.sin(lat) * Math.sin(long);
        vertices[i * 4 + 1] = Math.cos(long);
        vertices[i * 4 + 2] = Math.cos(lat) * Math.sin(long);
    }
    return CreateBuffer(vertices, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
}

//https://github.com/jwagner/simplex-noise.js/blob/main/simplex-noise.ts
/*
 * A fast javascript implementation of simplex noise by Jonas Wagner
Based on a speed-improved simplex noise algorithm for 2D, 3D and 4D in Java.
Which is based on example code by Stefan Gustavson (stegu@itn.liu.se).
With Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
Better rank ordering method by Stefan Gustavson in 2012.
 Copyright (c) 2021 Jonas Wagner
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
const F3 = 1.0 / 3.0;
const G3 = 1.0 / 6.0;
const F4 = (Math.sqrt(5.0) - 1.0) / 4.0;
const G4 = (5.0 - Math.sqrt(5.0)) / 20.0;
const grad3 = new Float32Array([1, 1, 0,
    -1, 1, 0,
    1, -1, 0,
    -1, -1, 0,
    1, 0, 1,
    -1, 0, 1,
    1, 0, -1,
    -1, 0, -1,
    0, 1, 1,
    0, -1, 1,
    0, 1, -1,
    0, -1, -1]);
const grad4 = new Float32Array([0, 1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, -1,
    0, -1, 1, 1, 0, -1, 1, -1, 0, -1, -1, 1, 0, -1, -1, -1,
    1, 0, 1, 1, 1, 0, 1, -1, 1, 0, -1, 1, 1, 0, -1, -1,
    -1, 0, 1, 1, -1, 0, 1, -1, -1, 0, -1, 1, -1, 0, -1, -1,
    1, 1, 0, 1, 1, 1, 0, -1, 1, -1, 0, 1, 1, -1, 0, -1,
    -1, 1, 0, 1, -1, 1, 0, -1, -1, -1, 0, 1, -1, -1, 0, -1,
    1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, -1, 0,
    -1, 1, 1, 0, -1, 1, -1, 0, -1, -1, 1, 0, -1, -1, -1, 0]);
/** Deterministic simplex noise generator suitable for 2D, 3D and 4D spaces. */
class SimplexNoise {
    p;
    perm;
    permMod12;
    /**
   * Creates a new `SimplexNoise` instance.
   * This involves some setup. You can save a few cpu cycles by reusing the same instance.
   * @param randomOrSeed A random number generator or a seed (string|number).
   * Defaults to Math.random (random irreproducible initialization).
   */
    constructor(randomOrSeed = Math.random) {
        const random = typeof randomOrSeed == 'function' ? randomOrSeed : alea(randomOrSeed);
        this.p = buildPermutationTable(random);
        this.perm = new Uint8Array(512);
        this.permMod12 = new Uint8Array(512);
        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
            this.permMod12[i] = this.perm[i] % 12;
        }
    }
    /**
   * Samples the noise field in 2 dimensions
   * @param x
   * @param y
   * @returns a number in the interval [-1, 1]
   */
    noise2D(x, y) {
        const permMod12 = this.permMod12;
        const perm = this.perm;
        let n0 = 0; // Noise contributions from the three corners
        let n1 = 0;
        let n2 = 0;
        // Skew the input space to determine which simplex cell we're in
        const s = (x + y) * F2; // Hairy factor for 2D
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        const t = (i + j) * G2;
        const X0 = i - t; // Unskew the cell origin back to (x,y) space
        const Y0 = j - t;
        const x0 = x - X0; // The x,y distances from the cell origin
        const y0 = y - Y0;
        // For the 2D case, the simplex shape is an equilateral triangle.
        // Determine which simplex we are in.
        let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
        if (x0 > y0) {
            i1 = 1;
            j1 = 0;
        } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        else {
            i1 = 0;
            j1 = 1;
        } // upper triangle, YX order: (0,0)->(0,1)->(1,1)
        // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
        // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
        // c = (3-sqrt(3))/6
        const x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
        const y2 = y0 - 1.0 + 2.0 * G2;
        // Work out the hashed gradient indices of the three simplex corners
        const ii = i & 255;
        const jj = j & 255;
        // Calculate the contribution from the three corners
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 >= 0) {
            const gi0 = permMod12[ii + perm[jj]] * 3;
            t0 *= t0;
            n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0); // (x,y) of grad3 used for 2D gradient
        }
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 >= 0) {
            const gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
            t1 *= t1;
            n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
        }
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 >= 0) {
            const gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
            t2 *= t2;
            n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 70.0 * (n0 + n1 + n2);
    }
    /**
   * Samples the noise field in 3 dimensions
   * @param x
   * @param y
   * @param z
   * @returns a number in the interval [-1, 1]
   */
    noise3D(x, y, z) {
        const permMod12 = this.permMod12;
        const perm = this.perm;
        let n0, n1, n2, n3; // Noise contributions from the four corners
        // Skew the input space to determine which simplex cell we're in
        const s = (x + y + z) * F3; // Very nice and simple skew factor for 3D
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        const k = Math.floor(z + s);
        const t = (i + j + k) * G3;
        const X0 = i - t; // Unskew the cell origin back to (x,y,z) space
        const Y0 = j - t;
        const Z0 = k - t;
        const x0 = x - X0; // The x,y,z distances from the cell origin
        const y0 = y - Y0;
        const z0 = z - Z0;
        // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
        // Determine which simplex we are in.
        let i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
        let i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
        if (x0 >= y0) {
            if (y0 >= z0) {
                i1 = 1;
                j1 = 0;
                k1 = 0;
                i2 = 1;
                j2 = 1;
                k2 = 0;
            } // X Y Z order
            else if (x0 >= z0) {
                i1 = 1;
                j1 = 0;
                k1 = 0;
                i2 = 1;
                j2 = 0;
                k2 = 1;
            } // X Z Y order
            else {
                i1 = 0;
                j1 = 0;
                k1 = 1;
                i2 = 1;
                j2 = 0;
                k2 = 1;
            } // Z X Y order
        }
        else { // x0<y0
            if (y0 < z0) {
                i1 = 0;
                j1 = 0;
                k1 = 1;
                i2 = 0;
                j2 = 1;
                k2 = 1;
            } // Z Y X order
            else if (x0 < z0) {
                i1 = 0;
                j1 = 1;
                k1 = 0;
                i2 = 0;
                j2 = 1;
                k2 = 1;
            } // Y Z X order
            else {
                i1 = 0;
                j1 = 1;
                k1 = 0;
                i2 = 1;
                j2 = 1;
                k2 = 0;
            } // Y X Z order
        }
        // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
        // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
        // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
        // c = 1/6.
        const x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
        const y1 = y0 - j1 + G3;
        const z1 = z0 - k1 + G3;
        const x2 = x0 - i2 + 2.0 * G3; // Offsets for third corner in (x,y,z) coords
        const y2 = y0 - j2 + 2.0 * G3;
        const z2 = z0 - k2 + 2.0 * G3;
        const x3 = x0 - 1.0 + 3.0 * G3; // Offsets for last corner in (x,y,z) coords
        const y3 = y0 - 1.0 + 3.0 * G3;
        const z3 = z0 - 1.0 + 3.0 * G3;
        // Work out the hashed gradient indices of the four simplex corners
        const ii = i & 255;
        const jj = j & 255;
        const kk = k & 255;
        // Calculate the contribution from the four corners
        let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
        if (t0 < 0)
            n0 = 0.0;
        else {
            const gi0 = permMod12[ii + perm[jj + perm[kk]]] * 3;
            t0 *= t0;
            n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0 + grad3[gi0 + 2] * z0);
        }
        let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
        if (t1 < 0)
            n1 = 0.0;
        else {
            const gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
            t1 *= t1;
            n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1 + grad3[gi1 + 2] * z1);
        }
        let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
        if (t2 < 0)
            n2 = 0.0;
        else {
            const gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
            t2 *= t2;
            n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2 + grad3[gi2 + 2] * z2);
        }
        let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
        if (t3 < 0)
            n3 = 0.0;
        else {
            const gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
            t3 *= t3;
            n3 = t3 * t3 * (grad3[gi3] * x3 + grad3[gi3 + 1] * y3 + grad3[gi3 + 2] * z3);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to stay just inside [-1,1]
        return 32.0 * (n0 + n1 + n2 + n3);
    }
    /**
   * Samples the noise field in 4 dimensions
   * @param x
   * @param y
   * @param z
   * @returns a number in the interval [-1, 1]
   */
    noise4D(x, y, z, w) {
        const perm = this.perm;
        let n0, n1, n2, n3, n4; // Noise contributions from the five corners
        // Skew the (x,y,z,w) space to determine which cell of 24 simplices we're in
        const s = (x + y + z + w) * F4; // Factor for 4D skewing
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        const k = Math.floor(z + s);
        const l = Math.floor(w + s);
        const t = (i + j + k + l) * G4; // Factor for 4D unskewing
        const X0 = i - t; // Unskew the cell origin back to (x,y,z,w) space
        const Y0 = j - t;
        const Z0 = k - t;
        const W0 = l - t;
        const x0 = x - X0; // The x,y,z,w distances from the cell origin
        const y0 = y - Y0;
        const z0 = z - Z0;
        const w0 = w - W0;
        // For the 4D case, the simplex is a 4D shape I won't even try to describe.
        // To find out which of the 24 possible simplices we're in, we need to
        // determine the magnitude ordering of x0, y0, z0 and w0.
        // Six pair-wise comparisons are performed between each possible pair
        // of the four coordinates, and the results are used to rank the numbers.
        let rankx = 0;
        let ranky = 0;
        let rankz = 0;
        let rankw = 0;
        if (x0 > y0)
            rankx++;
        else
            ranky++;
        if (x0 > z0)
            rankx++;
        else
            rankz++;
        if (x0 > w0)
            rankx++;
        else
            rankw++;
        if (y0 > z0)
            ranky++;
        else
            rankz++;
        if (y0 > w0)
            ranky++;
        else
            rankw++;
        if (z0 > w0)
            rankz++;
        else
            rankw++;
        // simplex[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
        // Many values of c will never occur, since e.g. x>y>z>w makes x<z, y<w and x<w
        // impossible. Only the 24 indices which have non-zero entries make any sense.
        // We use a thresholding to set the coordinates in turn from the largest magnitude.
        // Rank 3 denotes the largest coordinate.
        // Rank 2 denotes the second largest coordinate.
        // Rank 1 denotes the second smallest coordinate.
        // The integer offsets for the second simplex corner
        const i1 = rankx >= 3 ? 1 : 0;
        const j1 = ranky >= 3 ? 1 : 0;
        const k1 = rankz >= 3 ? 1 : 0;
        const l1 = rankw >= 3 ? 1 : 0;
        // The integer offsets for the third simplex corner
        const i2 = rankx >= 2 ? 1 : 0;
        const j2 = ranky >= 2 ? 1 : 0;
        const k2 = rankz >= 2 ? 1 : 0;
        const l2 = rankw >= 2 ? 1 : 0;
        // The integer offsets for the fourth simplex corner
        const i3 = rankx >= 1 ? 1 : 0;
        const j3 = ranky >= 1 ? 1 : 0;
        const k3 = rankz >= 1 ? 1 : 0;
        const l3 = rankw >= 1 ? 1 : 0;
        // The fifth corner has all coordinate offsets = 1, so no need to compute that.
        const x1 = x0 - i1 + G4; // Offsets for second corner in (x,y,z,w) coords
        const y1 = y0 - j1 + G4;
        const z1 = z0 - k1 + G4;
        const w1 = w0 - l1 + G4;
        const x2 = x0 - i2 + 2.0 * G4; // Offsets for third corner in (x,y,z,w) coords
        const y2 = y0 - j2 + 2.0 * G4;
        const z2 = z0 - k2 + 2.0 * G4;
        const w2 = w0 - l2 + 2.0 * G4;
        const x3 = x0 - i3 + 3.0 * G4; // Offsets for fourth corner in (x,y,z,w) coords
        const y3 = y0 - j3 + 3.0 * G4;
        const z3 = z0 - k3 + 3.0 * G4;
        const w3 = w0 - l3 + 3.0 * G4;
        const x4 = x0 - 1.0 + 4.0 * G4; // Offsets for last corner in (x,y,z,w) coords
        const y4 = y0 - 1.0 + 4.0 * G4;
        const z4 = z0 - 1.0 + 4.0 * G4;
        const w4 = w0 - 1.0 + 4.0 * G4;
        // Work out the hashed gradient indices of the five simplex corners
        const ii = i & 255;
        const jj = j & 255;
        const kk = k & 255;
        const ll = l & 255;
        // Calculate the contribution from the five corners
        let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0;
        if (t0 < 0)
            n0 = 0.0;
        else {
            const gi0 = (perm[ii + perm[jj + perm[kk + perm[ll]]]] % 32) * 4;
            t0 *= t0;
            n0 = t0 * t0 * (grad4[gi0] * x0 + grad4[gi0 + 1] * y0 + grad4[gi0 + 2] * z0 + grad4[gi0 + 3] * w0);
        }
        let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1;
        if (t1 < 0)
            n1 = 0.0;
        else {
            const gi1 = (perm[ii + i1 + perm[jj + j1 + perm[kk + k1 + perm[ll + l1]]]] % 32) * 4;
            t1 *= t1;
            n1 = t1 * t1 * (grad4[gi1] * x1 + grad4[gi1 + 1] * y1 + grad4[gi1 + 2] * z1 + grad4[gi1 + 3] * w1);
        }
        let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2;
        if (t2 < 0)
            n2 = 0.0;
        else {
            const gi2 = (perm[ii + i2 + perm[jj + j2 + perm[kk + k2 + perm[ll + l2]]]] % 32) * 4;
            t2 *= t2;
            n2 = t2 * t2 * (grad4[gi2] * x2 + grad4[gi2 + 1] * y2 + grad4[gi2 + 2] * z2 + grad4[gi2 + 3] * w2);
        }
        let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3;
        if (t3 < 0)
            n3 = 0.0;
        else {
            const gi3 = (perm[ii + i3 + perm[jj + j3 + perm[kk + k3 + perm[ll + l3]]]] % 32) * 4;
            t3 *= t3;
            n3 = t3 * t3 * (grad4[gi3] * x3 + grad4[gi3 + 1] * y3 + grad4[gi3 + 2] * z3 + grad4[gi3 + 3] * w3);
        }
        let t4 = 0.6 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4;
        if (t4 < 0)
            n4 = 0.0;
        else {
            const gi4 = (perm[ii + 1 + perm[jj + 1 + perm[kk + 1 + perm[ll + 1]]]] % 32) * 4;
            t4 *= t4;
            n4 = t4 * t4 * (grad4[gi4] * x4 + grad4[gi4 + 1] * y4 + grad4[gi4 + 2] * z4 + grad4[gi4 + 3] * w4);
        }
        // Sum up and scale the result to cover the range [-1,1]
        return 27.0 * (n0 + n1 + n2 + n3 + n4);
    }
}
/**
 * Builds a random permutation table.
 * This is exported only for (internal) testing purposes.
 * Do not rely on this export.
 * @private
 */
function buildPermutationTable(random) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
        p[i] = i;
    }
    for (let i = 0; i < 255; i++) {
        const r = i + ~~(random() * (256 - i));
        const aux = p[i];
        p[i] = p[r];
        p[r] = aux;
    }
    return p;
}
/*
The ALEA PRNG and masher code used by simplex-noise.js
is based on code by Johannes Baagøe, modified by Jonas Wagner.
See alea.md for the full license.
*/
function alea(seed) {
    let s0 = 0;
    let s1 = 0;
    let s2 = 0;
    let c = 1;
    const mash = masher();
    s0 = mash(' ');
    s1 = mash(' ');
    s2 = mash(' ');
    s0 -= mash(seed);
    if (s0 < 0) {
        s0 += 1;
    }
    s1 -= mash(seed);
    if (s1 < 0) {
        s1 += 1;
    }
    s2 -= mash(seed);
    if (s2 < 0) {
        s2 += 1;
    }
    return function () {
        const t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
        s0 = s1;
        s1 = s2;
        return s2 = t - (c = t | 0);
    };
}
function masher() {
    let n = 0xefc8249d;
    return function (data) {
        data = data.toString();
        for (let i = 0; i < data.length; i++) {
            n += data.charCodeAt(i);
            let h = 0.02519603282416938 * n;
            n = h >>> 0;
            h -= n;
            h *= n;
            n = h >>> 0;
            h -= n;
            n += h * 0x100000000; // 2^32
        }
        return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
    };
}

function Create(points) {
    const count = Math.floor(Math.sqrt(points));
    const vertices = new Float32Array(count * count * 4);
    const noise = new SimplexNoise();
    for (let i = 0; i < count; i++) {
        for (let j = 0; j < count; j++) {
            vertices[(i * count + j) * 4 + 0] = i / count - 0.5;
            vertices[(i * count + j) * 4 + 1] = noise.noise2D(i * 0.01, j * 0.01) / count * 25;
            vertices[(i * count + j) * 4 + 2] = j / count - 0.5;
            if (Math.random() <= 0.03) {
                vertices[(i * count + j) * 4 + 1] += (0.5 + Math.random()) / count * 5;
            }
        }
    }
    return [
        CreateBuffer(vertices, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE),
        count * count
    ];
}

document.body.onload = async () => {
    const mode = document.getElementById('mode');
    const color = document.getElementById('color');
    const gridCheckbox = document.getElementById('grid');
    const display = document.getElementById('display');
    const canvas = await Setup(display.clientWidth, display.clientHeight);
    if (canvas == undefined) {
        display.remove();
        const error = document.createElement('div');
        error.className = 'error';
        const topLine = document.createElement('div');
        topLine.className = 'large';
        topLine.innerHTML = 'WebGPU not available';
        error.append(topLine);
        const botLine = document.createElement('div');
        botLine.className = 'normal';
        botLine.innerHTML =
            'Only tested with <a href="https://www.google.com/chrome">Google Chrome</a>';
        error.append(botLine);
        document.body.append(error);
        return;
    }
    //await Time.MeasureTimes()
    //return
    display.append(canvas);
    const cam = new Camera(Math.PI / 4);
    cam.Translate(0, 5, 30);
    const increase = new Position();
    increase.Scale(5, 5, 5);
    const normal = new Position();
    const grid = Create$3(10);
    let k = 64;
    let length = 50_000;
    let cloud = Create$1(length);
    let colors = Create$5(length);
    let nearest = undefined;
    let normals = undefined;
    let curvature = undefined;
    let valid = true;
    window.CreateForm = async (name) => {
        const size = document.getElementById('size');
        length = parseInt(size.value);
        cloud.destroy();
        colors.destroy();
        valid = false;
        switch (name) {
            case 'sphere':
                cloud = Create$1(length);
                valid = true;
                break;
            case 'cube':
                cloud = Create$4(length);
                valid = true;
                break;
            case 'map':
                [cloud, length] = Create(length);
                valid = true;
                break;
            case 'bunny': {
                const response = await fetch('https://raw.githubusercontent.com/PointCloudLibrary/pcl/master/test/bunny.pcd');
                const content = await (await response.blob()).arrayBuffer();
                const result = Create$2(content);
                if (result != undefined) {
                    [cloud, length] = result;
                    valid = true;
                }
                else {
                    alert('pcd error');
                }
                break;
            }
            case 'statue':
                const response = await fetch('https://raw.githubusercontent.com/PointCloudLibrary/pcl/master/test/rops_cloud.pcd');
                const content = await (await response.blob()).arrayBuffer();
                const result = Create$2(content);
                if (result != undefined) {
                    [cloud, length] = result;
                    valid = true;
                }
                else {
                    alert('pcd error');
                }
                break;
            case 'upload':
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pcd';
                input.multiple = false;
                input.onchange = async () => {
                    if (input.files.length == 0) {
                        alert('please select file');
                        return;
                    }
                    const file = input.files[0];
                    const result = Create$2(await file.arrayBuffer());
                    if (result != undefined) {
                        [cloud, length] = result;
                        valid = true;
                    }
                    else {
                        alert('pcd error');
                    }
                };
                input.click();
        }
        colors = Create$5(length);
        if (nearest != undefined) {
            nearest.destroy();
            nearest = undefined;
        }
        if (normals != undefined) {
            normals.destroy();
            normals = undefined;
        }
        if (curvature != undefined) {
            curvature.destroy();
            curvature = undefined;
        }
        mode.value = 'points';
        color.value = 'color';
    };
    window.ShowText = (text) => {
        const hint = document.createElement('div');
        hint.textContent = text;
        hint.className = 'hint';
        document.body.append(hint);
        setTimeout(() => {
            hint.remove();
        }, 5000);
    };
    window.Compute = async (name) => {
        switch (name) {
            case 'kNearestList':
            case 'kNearestIter':
            case 'kNearestListSorted':
            case 'kNearestIterSorted':
                if (nearest != undefined) {
                    nearest.destroy();
                }
                const kDiv = document.getElementById('k');
                k = parseInt(kDiv.value);
                nearest = CreateEmptyBuffer(length * k * 4, GPUBufferUsage.STORAGE);
                switch (name) {
                    case 'kNearestList':
                    case 'kNearestIter':
                        Compute(name, length, [[k], []], [cloud, nearest]);
                        break;
                    case 'kNearestListSorted':
                    case 'kNearestIterSorted':
                        //const newCloud = GPU.CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE)
                        //const newColor = GPU.CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE)
                        //GPU.Compute('sort', length, [[],[]], [cloud, colors, newCloud, newColor])
                        //cloud.destroy()
                        //colors.destroy()
                        //cloud = newCloud
                        //colors = newColor
                        await Sort(cloud, length);
                        Compute(name, length, [[k], []], [cloud, nearest]);
                        break;
                }
                mode.value = 'connections';
                break;
            case 'triangulateAll':
                k = K;
                if (nearest != undefined) {
                    nearest.destroy();
                }
                nearest = CreateEmptyBuffer(length * k * 4, GPUBufferUsage.STORAGE);
                Compute('triangulateAll', length, [[], []], [cloud, nearest]);
                mode.value = 'connections';
                break;
            case 'triangulateNear':
                if (nearest == undefined) {
                    alert('please calculate nearest first');
                }
                else {
                    const copy = CreateEmptyBuffer(length * K * 4, GPUBufferUsage.STORAGE);
                    Compute('triangulateNearest', length, [[k], []], [cloud, nearest, copy]);
                    nearest.destroy();
                    nearest = copy;
                    k = K;
                    mode.value = 'connections';
                    break;
                }
                break;
            case 'cleanDang':
            case 'cleanLong':
                if (nearest == undefined) {
                    alert('please calculate the connections first');
                    break;
                }
                const newNearest = CreateEmptyBuffer(length * k * 4, GPUBufferUsage.STORAGE);
                switch (name) {
                    case 'cleanDang':
                        Compute('cleanDang', length, [[k], []], [nearest, newNearest]);
                        break;
                    case 'cleanLong':
                        Compute('cleanLong', length, [[k], []], [cloud, nearest, newNearest]);
                        break;
                }
                nearest.destroy();
                nearest = newNearest;
                mode.value = 'connections';
                break;
            case 'normalPlane':
            case 'normalTriang':
                if (nearest == undefined) {
                    alert('please calculate the connections first');
                    break;
                }
                if (normals == undefined) {
                    normals = CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
                }
                switch (name) {
                    case 'normalPlane':
                        Compute('normalLinear', length, [[k], []], [cloud, nearest, normals]);
                        break;
                    case 'normalTriang':
                        Compute('normalTriang', length, [[k], []], [cloud, nearest, normals]);
                        break;
                }
                color.value = 'normal';
                break;
            case 'curvaturePoints':
            case 'curvatureNormal':
                if (normals == undefined) {
                    alert('please calculate the normals first');
                    break;
                }
                if (curvature == undefined) {
                    curvature = CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC);
                }
                switch (name) {
                    case 'curvatureNormal':
                        Compute('curvatureNormal', length, [[k], []], [cloud, nearest, normals, curvature]);
                        break;
                    case 'curvaturePoints':
                        Compute('curvaturePoints', length, [[k], []], [cloud, nearest, normals, curvature]);
                        break;
                }
                color.value = 'curve';
                break;
            case 'filterCurve':
            case 'filterAnomaly':
                if (curvature == undefined) {
                    alert('please calculate curvature first');
                    break;
                }
                const tDiv = document.getElementById('threshhold');
                const t = parseFloat(tDiv.value);
                const newCloud = CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
                const newColor = CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
                let com;
                switch (name) {
                    case 'filterCurve':
                        com = 'reduceLow';
                        break;
                    case 'filterAnomaly':
                        com = 'reduceAnomaly';
                        break;
                }
                const result = Compute(com, length, [[0], [t]], [cloud, colors, curvature, newCloud, newColor], true);
                length = new Uint32Array(await ReadBuffer(result, 3 * 4))[1];
                console.log('length:', length);
                result.destroy();
                cloud.destroy();
                colors.destroy();
                nearest.destroy();
                normals.destroy();
                curvature.destroy();
                cloud = newCloud;
                colors = newColor;
                nearest = undefined;
                normals = undefined;
                curvature = undefined;
                color.value = 'color';
                mode.value = 'points';
                break;
            case 'noise':
                if (curvature == undefined) {
                    alert('please calculate the curvature first');
                    break;
                }
                const copy = CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
                Compute('noise', length, [[k], [1.0]], [cloud, normals, curvature, copy]);
                cloud.destroy();
                cloud = copy;
                break;
            default:
                alert('wrong name: ' + name);
        }
    };
    display.onwheel = (ev) => {
        const scale = 1 + ev.deltaY / 1000;
        increase.Scale(scale, scale, scale);
        ev.preventDefault();
        ev.stopImmediatePropagation();
    };
    document.body.onresize = () => {
        Resize(display.clientWidth, display.clientHeight);
        cam.UpdateSize();
    };
    const keys = {};
    document.body.onkeydown = (ev) => {
        keys[ev.code] = true;
    };
    document.body.onkeyup = (ev) => {
        delete keys[ev.code];
    };
    display.onmousemove = (ev) => {
        if ((ev.buttons & 1) != 0) {
            cam.RotateX(-ev.movementY / 200);
            cam.RotateGlobalY(-ev.movementX / 200);
        }
    };
    let last = await new Promise(requestAnimationFrame);
    const run = true;
    const radDiv = document.getElementById('radius');
    while (run) {
        const time = await new Promise(requestAnimationFrame);
        const delta = time - last;
        if (delta < 50) {
            const dist = delta / 50;
            const move = (key, x, y, z) => {
                if (keys[key] != undefined) {
                    cam.Translate(x * dist, y * dist, z * dist);
                }
            };
            move('KeyW', 0, 0, -1);
            move('KeyA', -1, 0, 0);
            move('KeyS', 0, 0, 1);
            move('KeyD', 1, 0, 0);
        }
        let c = undefined;
        switch (color.value) {
            case 'color':
                c = colors;
                break;
            case 'normal':
                if (normals == undefined) {
                    c = colors;
                    color.value = 'color';
                    alert('normals not calculated');
                }
                else {
                    c = normals;
                }
                break;
            case 'curve':
                if (curvature == undefined) {
                    c = colors;
                    color.value = 'color';
                    alert('curvature not calculated');
                }
                else {
                    c = curvature;
                }
                break;
        }
        const rad = parseFloat(radDiv.value);
        StartRender(cam);
        if (gridCheckbox.checked) {
            Render$3(normal, grid.length, grid.positions, grid.colors);
        }
        if (valid) {
            switch (mode.value) {
                case 'points':
                    Render$2(increase, rad, length, cloud, c);
                    break;
                case 'connections':
                    if (nearest == undefined) {
                        mode.value = 'points';
                        Render$2(increase, rad, length, cloud, c);
                        alert('connections not calculated');
                    }
                    else {
                        Render$1(increase, cloud, c, nearest, k, length);
                    }
                    break;
                case 'polygons':
                    if (nearest == undefined) {
                        mode.value = 'points';
                        Render$2(increase, rad, length, cloud, c);
                        alert('connections not calculated');
                    }
                    else {
                        Render(increase, cloud, c, nearest, k, length);
                    }
                    break;
            }
        }
        FinishRender();
        last = time;
        if (keys['KeyP'] != undefined) {
            const name = prompt('Please enter file name', 'cloud');
            if (name != null && name.length > 0) {
                const link = document.createElement('a');
                link.download = name + '.png';
                link.href = canvas.toDataURL();
                link.click();
            }
            delete keys['KeyP'];
        }
    }
};
