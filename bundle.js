(function () {
	'use strict';

	let adapter;
	let device;
	const clearColor = { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };
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
	async function Setup$1(width, height) {
	    if (window.navigator.gpu == undefined) {
	        console.log('no navigator gpu');
	        return undefined;
	    }
	    adapter = await window.navigator.gpu.requestAdapter();
	    if (adapter == null) {
	        console.log('no adapter');
	        return undefined;
	    }
	    device = await adapter.requestDevice();
	    if (device == null) {
	        console.log('no device');
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
	        compositingAlphaMode: 'opaque',
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
	                clearValue: clearColor,
	                storeOp: 'store',
	                loadOp: 'clear',
	                loadValue: 'load',
	                view: context.getCurrentTexture().createView(),
	            },
	        ],
	        depthStencilAttachment: {
	            depthLoadOp: 'clear',
	            depthClearValue: 1.0,
	            depthStoreOp: 'store',
	            stencilLoadOp: 'load',
	            stencilStoreOp: 'store',
	            depthLoadValue: 'load',
	            stencilLoadValue: 'load',
	            view: depth.createView(),
	        },
	    });
	    cameraBuffer = camera.Buffer();
	}
	function FinishRender() {
	    renderPass.end();
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
	        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | usage,
	        mappedAtCreation: false,
	    });
	    return buffer;
	}
	function NewModule(src) {
	    const module = device.createShaderModule({
	        code: src,
	    });
	    return module;
	}
	function ConvertURI(uri) {
	    return window.atob(uri.split(',')[1]);
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
	            1, 0, 0, x,
	            0, 1, 0, y,
	            0, 0, 1, z,
	            0, 0, 0, 1
	        ]));
	    }
	    static RotateX(rad) {
	        return new Matrix(new Float32Array([
	            1, 0, 0, 0,
	            0, Math.cos(rad), -Math.sin(rad), 0,
	            0, Math.sin(rad), Math.cos(rad), 0,
	            0, 0, 0, 1,
	        ]));
	    }
	    static Rotate(rad, axis) {
	        const sin = Math.sin(rad);
	        const cos = Math.cos(rad);
	        const cosN = 1 - cos;
	        return new Matrix(new Float32Array([
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
	        ]));
	    }
	    static RotateY(rad) {
	        return new Matrix(new Float32Array([
	            Math.cos(rad), 0, Math.sin(rad), 0,
	            0, 1, 0, 0,
	            -Math.sin(rad), 0, Math.cos(rad), 0,
	            0, 0, 0, 1,
	        ]));
	    }
	    static RotateZ(rad) {
	        return new Matrix(new Float32Array([
	            Math.cos(rad), -Math.sin(rad), 0, 0,
	            Math.sin(rad), Math.cos(rad), 0, 0,
	            0, 0, 1, 0,
	            0, 0, 0, 1,
	        ]));
	    }
	    static Scale(x, y, z) {
	        return new Matrix(new Float32Array([
	            x, 0, 0, 0,
	            0, y, 0, 0,
	            0, 0, z, 0,
	            0, 0, 0, 1,
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

	var srcURI$3 = "data:null;base64,c3RydWN0IENhbWVyYSB7DQoJcHJvamVjdGlvbjogbWF0NHg0PGYzMj47DQoJdmlldzogbWF0NHg0PGYzMj47DQp9Ow0KDQoNCnN0cnVjdCBQYXJhbWV0ZXIgew0KCW1vZGVsOiBtYXQ0eDQ8ZjMyPjsNCn07DQoNCkBncm91cCgwKSBAYmluZGluZygwKSB2YXI8dW5pZm9ybT4gY2FtZXJhOiBDYW1lcmE7DQpAZ3JvdXAoMCkgQGJpbmRpbmcoMSkgdmFyPHVuaWZvcm0+IHBhcmFtZXRlcjogUGFyYW1ldGVyOw0KDQpzdHJ1Y3QgVHJhbnNmZXIgew0KCUBidWlsdGluKHBvc2l0aW9uKSBwb3NpdGlvbiA6IHZlYzQ8ZjMyPjsNCglAbG9jYXRpb24oMCkgY29sb3I6IHZlYzM8ZjMyPjsNCn07DQoNCkBzdGFnZSh2ZXJ0ZXgpDQpmbiB2ZXJ0ZXhNYWluKA0KCUBsb2NhdGlvbigwKSB2ZXJ0ZXg6IHZlYzM8ZjMyPiwNCglAbG9jYXRpb24oMSkgY29sb3I6IHZlYzM8ZjMyPiwNCikgLT4gVHJhbnNmZXIgew0KCXZhciBvdXRwdXQgOiBUcmFuc2ZlcjsNCglvdXRwdXQucG9zaXRpb24gPSBjYW1lcmEucHJvamVjdGlvbiAqIGNhbWVyYS52aWV3ICogcGFyYW1ldGVyLm1vZGVsICogdmVjNDxmMzI+KHZlcnRleCwgMS4wKTsNCglvdXRwdXQuY29sb3IgPSBjb2xvcjsNCglyZXR1cm4gb3V0cHV0Ow0KfQ0KDQpAc3RhZ2UoZnJhZ21lbnQpDQpmbiBmcmFnbWVudE1haW4oZGF0YTogVHJhbnNmZXIpIC0+IEBsb2NhdGlvbigwKSB2ZWM0PGYzMj4gew0KCXJldHVybiB2ZWM0PGYzMj4oZGF0YS5jb2xvciwgMS4wKTsNCn0NCg==";

	let pipeline$3 = undefined;
	function Render$3(position, length, positions, colors) {
	    if (pipeline$3 == undefined) {
	        const module = NewModule(ConvertURI(srcURI$3));
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

	var srcURI$2 = "data:null;base64,c3RydWN0IENhbWVyYSB7DQoJcHJvamVjdGlvbjogbWF0NHg0PGYzMj47DQoJdmlldzogbWF0NHg0PGYzMj47DQp9Ow0KDQpzdHJ1Y3QgUGFyYW1ldGVyIHsNCgltb2RlbDogbWF0NHg0PGYzMj47DQoJcmFkaXVzOiBmMzI7DQoJYXNwZWN0OiBmMzI7DQp9Ow0KDQoNCi8vW1tncm91cCgwKSwgYmluZGluZygwKV1dIHZhcjx1bmlmb3JtPiBjYW1lcmE6IENhbWVyYTsNCkBncm91cCgwKSBAYmluZGluZygwKSB2YXI8dW5pZm9ybT4gY2FtZXJhOiBDYW1lcmE7DQpAZ3JvdXAoMCkgQGJpbmRpbmcoMSkgdmFyPHVuaWZvcm0+IHBhcmFtZXRlcjogUGFyYW1ldGVyOw0KDQpzdHJ1Y3QgVHJhbnNmZXIgew0KCUBidWlsdGluKHBvc2l0aW9uKSBwb3NpdGlvbiA6IHZlYzQ8ZjMyPjsNCglAbG9jYXRpb24oMCkgb2Zmc2V0IDogdmVjMjxmMzI+Ow0KCUBsb2NhdGlvbigxKSBjb2xvciA6IHZlYzM8ZjMyPjsNCn07DQoNCkBzdGFnZSh2ZXJ0ZXgpIGZuIHZlcnRleE1haW4oDQoJQGxvY2F0aW9uKDApIG9mZnNldDogdmVjMjxmMzI+LA0KCUBsb2NhdGlvbigxKSBwb3NpdGlvbiA6IHZlYzM8ZjMyPiwNCglAbG9jYXRpb24oMikgY29sb3I6IHZlYzM8ZjMyPiwNCikgLT4gVHJhbnNmZXIgew0KCXZhciBvdXRwdXQgOiBUcmFuc2ZlcjsNCglvdXRwdXQucG9zaXRpb24gPSBjYW1lcmEucHJvamVjdGlvbiAqIGNhbWVyYS52aWV3ICogcGFyYW1ldGVyLm1vZGVsICogdmVjNDxmMzI+KHBvc2l0aW9uLCAxLjApOw0KCW91dHB1dC5wb3NpdGlvbi54ID0gb3V0cHV0LnBvc2l0aW9uLnggKyBvZmZzZXQueCAqIHBhcmFtZXRlci5yYWRpdXM7DQoJb3V0cHV0LnBvc2l0aW9uLnkgPSBvdXRwdXQucG9zaXRpb24ueSArIG9mZnNldC55ICogcGFyYW1ldGVyLnJhZGl1cyAqIHBhcmFtZXRlci5hc3BlY3Q7DQoJb3V0cHV0Lm9mZnNldCA9IG9mZnNldDsNCglvdXRwdXQuY29sb3IgPSBhYnMoY29sb3IpOw0KCXJldHVybiBvdXRwdXQ7DQp9DQoNCkBzdGFnZShmcmFnbWVudCkNCmZuIGZyYWdtZW50TWFpbihpbnB1dCA6IFRyYW5zZmVyKSAtPiBAbG9jYXRpb24oMCkgdmVjNDxmMzI+IHsNCglpZiAobGVuZ3RoKGlucHV0Lm9mZnNldCkgPj0gMS4wKSB7DQoJCWRpc2NhcmQ7DQoJfQ0KCXJldHVybiB2ZWM0PGYzMj4oaW5wdXQuY29sb3IsIDEuMCk7DQp9DQo=";

	let quadBuffer = undefined;
	let pipeline$2 = undefined;
	function Render$2(position, radius, length, positions, colors) {
	    if (pipeline$2 == undefined || quadBuffer == undefined) {
	        const module = NewModule(ConvertURI(srcURI$2));
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

	var srcURI$1 = "data:null;base64,c3RydWN0IENhbWVyYSB7DQoJcHJvamVjdGlvbjogbWF0NHg0PGYzMj47DQoJdmlldzogbWF0NHg0PGYzMj47DQp9Ow0KDQpzdHJ1Y3QgUGFyYW1ldGVyIHsNCgltb2RlbDogbWF0NHg0PGYzMj47DQoJazogdTMyOw0KfTsNCg0Kc3RydWN0IEJ1ZmZlciB7DQoJZGF0YTogYXJyYXk8dmVjMzxmMzI+PjsNCn07DQoNCnN0cnVjdCBJbmRpY2VzIHsNCglkYXRhOiBhcnJheTx1MzI+Ow0KfTsNCg0KDQpAZ3JvdXAoMCkgQGJpbmRpbmcoMCkgdmFyPHVuaWZvcm0+IGNhbWVyYTogQ2FtZXJhOw0KQGdyb3VwKDApIEBiaW5kaW5nKDEpIHZhcjx1bmlmb3JtPiBwYXJhbWV0ZXI6IFBhcmFtZXRlcjsNCkBncm91cCgwKSBAYmluZGluZygyKSB2YXI8c3RvcmFnZSwgcmVhZD4gcG9zaXRpb25zOiBCdWZmZXI7DQpAZ3JvdXAoMCkgQGJpbmRpbmcoMykgdmFyPHN0b3JhZ2UsIHJlYWQ+IGNvbG9yczogQnVmZmVyOw0KQGdyb3VwKDApIEBiaW5kaW5nKDQpIHZhcjxzdG9yYWdlLCByZWFkPiBpbmRpY2VzOiBJbmRpY2VzOw0KDQpzdHJ1Y3QgVHJhbnNmZXIgew0KCUBidWlsdGluKHBvc2l0aW9uKSBwb3NpdGlvbiA6IHZlYzQ8ZjMyPjsNCglAbG9jYXRpb24oMCkgY29sb3I6IHZlYzM8ZjMyPjsNCn07DQoNCkBzdGFnZSh2ZXJ0ZXgpDQpmbiB2ZXJ0ZXhNYWluKA0KCUBidWlsdGluKHZlcnRleF9pbmRleCkgaWQ6IHUzMiwNCikgLT4gVHJhbnNmZXIgew0KCXZhciB2ZXJ0ZXggPSBwb3NpdGlvbnMuZGF0YVtpZCAvICgydSAqIHBhcmFtZXRlci5rKV07DQoJdmFyIGNvbG9yID0gY29sb3JzLmRhdGFbaWQgLyAoMnUgKiBwYXJhbWV0ZXIuayldOw0KCWlmIChpZCUydSAhPSAwdSkgew0KCQl2ZXJ0ZXggPSAodmVydGV4ICsgcG9zaXRpb25zLmRhdGFbaW5kaWNlcy5kYXRhW2lkLzJ1XSBdKSAvIDIuMDsNCgl9DQoJdmFyIG91dHB1dCA6IFRyYW5zZmVyOw0KCW91dHB1dC5wb3NpdGlvbiA9IGNhbWVyYS5wcm9qZWN0aW9uICogY2FtZXJhLnZpZXcgKiBwYXJhbWV0ZXIubW9kZWwgKiB2ZWM0PGYzMj4odmVydGV4LCAxLjApOw0KCQ0KCW91dHB1dC5jb2xvciA9IGFicyhjb2xvcik7DQoNCglyZXR1cm4gb3V0cHV0Ow0KfQ0KDQpAc3RhZ2UoZnJhZ21lbnQpDQpmbiBmcmFnbWVudE1haW4oZGF0YTogVHJhbnNmZXIpIC0+IEBsb2NhdGlvbigwKSB2ZWM0PGYzMj4gew0KCXJldHVybiB2ZWM0PGYzMj4oZGF0YS5jb2xvciwgMS4wKTsNCn0NCg==";

	let pipeline$1 = undefined;
	function Render$1(position, positions, colors, nearest, k, length) {
	    if (pipeline$1 == undefined) {
	        const module = NewModule(ConvertURI(srcURI$1));
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

	var srcURI = "data:null;base64,c3RydWN0IENhbWVyYSB7Cglwcm9qZWN0aW9uOiBtYXQ0eDQ8ZjMyPjsKCXZpZXc6IG1hdDR4NDxmMzI+Owp9OwoKc3RydWN0IFBhcmFtZXRlciB7Cgltb2RlbDogbWF0NHg0PGYzMj47CglrOiB1MzI7Cn07CgpzdHJ1Y3QgQnVmZmVyIHsKCWRhdGE6IGFycmF5PHZlYzM8ZjMyPj47Cn07CgpzdHJ1Y3QgSW5kaWNlcyB7CglkYXRhOiBhcnJheTx1MzI+Owp9OwoKQGdyb3VwKDApIEBiaW5kaW5nKDApIHZhcjx1bmlmb3JtPiBjYW1lcmE6IENhbWVyYTsKQGdyb3VwKDApIEBiaW5kaW5nKDEpIHZhcjx1bmlmb3JtPiBwYXJhbWV0ZXI6IFBhcmFtZXRlcjsKQGdyb3VwKDApIEBiaW5kaW5nKDIpIHZhcjxzdG9yYWdlLCByZWFkPiBwb3NpdGlvbnM6IEJ1ZmZlcjsKQGdyb3VwKDApIEBiaW5kaW5nKDMpIHZhcjxzdG9yYWdlLCByZWFkPiBjb2xvcnM6IEJ1ZmZlcjsKQGdyb3VwKDApIEBiaW5kaW5nKDQpIHZhcjxzdG9yYWdlLCByZWFkPiBpbmRpY2VzOiBJbmRpY2VzOwoKc3RydWN0IFRyYW5zZmVyIHsKCUBidWlsdGluKHBvc2l0aW9uKSBwb3NpdGlvbiA6IHZlYzQ8ZjMyPjsKCUBsb2NhdGlvbigwKSBjb2xvcjogdmVjMzxmMzI+Owp9OwoKQHN0YWdlKHZlcnRleCkKZm4gdmVydGV4TWFpbigKCUBidWlsdGluKHZlcnRleF9pbmRleCkgaWQ6IHUzMiwKKSAtPiBUcmFuc2ZlciB7CglsZXQgY2VudGVyID0gaWQgLyAoM3UgKiBwYXJhbWV0ZXIuayk7CglsZXQgbWlkZGxlX3BvcyA9IHBvc2l0aW9ucy5kYXRhW2NlbnRlcl07Cgl2YXIgcG9zaXRpb246IHZlYzM8ZjMyPjsKCXN3aXRjaCAoaWQlM3UpIHsKCQljYXNlIDB1OiB7CgkJCXBvc2l0aW9uID0gbWlkZGxlX3BvczsKCQkJYnJlYWs7CgkJfQoJCWNhc2UgMXU6IHsKCQkJbGV0IGluZGV4X2lkID0gaW5kaWNlcy5kYXRhW2lkLzN1XTsKCQkJbGV0IHAgPSBwb3NpdGlvbnMuZGF0YVtpbmRleF9pZF07CgkJCWlmIChwLnggPj0gbWlkZGxlX3Bvcy54KSB7CgkJCQlwb3NpdGlvbiA9IHA7CgkJCX0gZWxzZSB7CgkJCQlwb3NpdGlvbiA9IG1pZGRsZV9wb3M7CgkJCX0KCQkJYnJlYWs7CgkJfQoJCWRlZmF1bHQ6IHsKCQkJdmFyIGluZGV4X2lkID0gaW5kaWNlcy5kYXRhW2lkLzN1ICsgMXVdOwoJCQlpZiAoaW5kZXhfaWQgPT0gY2VudGVyIHx8IChpZCArIDF1KSUocGFyYW1ldGVyLmsgKiAzdSkgPT0gMHUpIHsgLy9sb29wIGFyb3VuZCB0byB0aGUgZmlyc3QgdmVydGV4IGluIHRoZSBjaXJjbGUKCQkJCWluZGV4X2lkID0gaW5kaWNlcy5kYXRhW2NlbnRlcipwYXJhbWV0ZXIua107CgkJCX0KCQkJbGV0IHAgPSBwb3NpdGlvbnMuZGF0YVtpbmRleF9pZF07CgkJCWlmIChwLnggPj0gbWlkZGxlX3Bvcy54KSB7CgkJCQlwb3NpdGlvbiA9IHA7CgkJCX0gZWxzZSB7CgkJCQlwb3NpdGlvbiA9IG1pZGRsZV9wb3M7CgkJCX0KCQkJYnJlYWs7CgkJfQoJfQoJdmFyIG91dHB1dCA6IFRyYW5zZmVyOwoJb3V0cHV0LnBvc2l0aW9uID0gY2FtZXJhLnByb2plY3Rpb24gKiBjYW1lcmEudmlldyAqIHBhcmFtZXRlci5tb2RlbCAqIHZlYzQ8ZjMyPihwb3NpdGlvbiwgMS4wKTsKCW91dHB1dC5jb2xvciA9IGFicyhjb2xvcnMuZGF0YVtjZW50ZXJdKTsKCXJldHVybiBvdXRwdXQ7Cn0KCkBzdGFnZShmcmFnbWVudCkKZm4gZnJhZ21lbnRNYWluKGRhdGE6IFRyYW5zZmVyKSAtPiBAbG9jYXRpb24oMCkgdmVjNDxmMzI+IHsKCXJldHVybiB2ZWM0PGYzMj4oZGF0YS5jb2xvciwgMS4wKTsKfQo=";

	let pipeline = undefined;
	function Render(position, positions, colors, nearest, k, length) {
	    if (pipeline == undefined) {
	        const module = NewModule(ConvertURI(srcURI));
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

	async function Setup(width, height) {
	    const c = await Setup$1(width, height);
	    if (c == undefined) {
	        return undefined;
	    }
	    return c;
	}

	function Create$1(points) {
	    const colors = new Float32Array(points * 4);
	    for (let i = 0; i < points; i++) {
	        colors[i * 4 + 0] = 0.2;
	        colors[i * 4 + 1] = 0.3;
	        colors[i * 4 + 2] = 0.4;
	    }
	    return CreateBuffer(colors, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
	}

	function Create(amount) {
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
	    addLine(amount * 4 + 0, { x: -amount, y: 0, z: 0 }, { x: amount, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
	    addLine(amount * 4 + 1, { x: 0, y: -amount, z: 0 }, { x: 0, y: amount, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
	    addLine(amount * 4 + 2, { x: 0, y: 0, z: -amount }, { x: 0, y: 0, z: amount }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 });
	    return {
	        length: (amount * 4 + 3) * 2,
	        positions: CreateBuffer(positions, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE),
	        colors: CreateBuffer(colors, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE),
	    };
	}

	class GlobalInput extends HTMLElement {
	    constructor() {
	        super();
	        const name = this.getAttribute('name');
	        const min = this.getAttribute('min');
	        const max = this.getAttribute('max');
	        const value = this.getAttribute('value');
	        const step = this.getAttribute('step');
	        const variable = this.getAttribute('variable');
	        const shadow = this.attachShadow({ mode: 'open' });
	        const body = document.createElement('div');
	        body.style.display = 'flex';
	        body.title = name;
	        shadow.appendChild(body);
	        const text = document.createElement('div');
	        text.style.textAlign = 'left';
	        text.innerText = name + ': ';
	        text.style.flexGrow = '0';
	        body.appendChild(text);
	        const val = document.createElement('input');
	        val.type = 'number';
	        val.style.textAlign = 'right';
	        val.style.margin = '0px 10px 0px 10px';
	        val.value = value;
	        val.min = min;
	        val.max = max;
	        val.step = step;
	        val.innerText = value;
	        val.style.flexGrow = '0';
	        body.appendChild(val);
	        const input = document.createElement('input');
	        input.type = 'range';
	        input.value = value;
	        input.min = min;
	        input.max = max;
	        input.step = step;
	        input.style.flexGrow = '1';
	        body.appendChild(input);
	        val.oninput = () => {
	            window[variable] = val.valueAsNumber;
	            input.value = val.value;
	        };
	        input.oninput = () => {
	            window[variable] = input.valueAsNumber;
	            val.value = input.value;
	        };
	        window[variable] = val.valueAsNumber;
	    }
	}
	customElements.define('global-input', GlobalInput);

	const socket = new WebSocket('ws://' + location.host + '/ws');
	socket.onerror = () => {
	    alert('socket connection error');
	};
	socket.onopen = async () => {
	    const display = document.getElementById('display');
	    const canvas = await Setup(display.clientWidth, display.clientHeight);
	    display.innerHTML = '';
	    display.append(canvas);
	    const formIdOffset = 1;
	    const computeIdOffset = 33;
	    const renderFlag = GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE;
	    const computeFlag = GPUBufferUsage.STORAGE;
	    const mode = document.getElementById('mode');
	    const color = document.getElementById('color');
	    const gridCheckbox = document.getElementById('grid');
	    const cam = new Camera(Math.PI / 4);
	    cam.Translate(0, 5, 30);
	    const increase = new Position();
	    increase.Scale(5, 5, 5);
	    const normal = new Position();
	    const grid = Create(10);
	    let k = 0;
	    let length = 0;
	    let cloud = CreateEmptyBuffer(0, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
	    let colors = CreateEmptyBuffer(0, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
	    let nearest = undefined;
	    let normals = undefined;
	    let curvature = undefined;
	    const keys = {};
	    socket.onmessage = async (ev) => {
	        if (typeof ev.data == 'string') {
	            alert(ev.data);
	        }
	        else {
	            let data = await ev.data.arrayBuffer();
	            console.log('message: ', data.byteLength);
	            const info = new Int32Array(data)[0];
	            data = data.slice(4);
	            switch (info) {
	                case 1:
	                    cloud.destroy();
	                    colors.destroy();
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
	                    length = new Int32Array(data)[0];
	                    data = data.slice(4);
	                    if (length * 16 != data.byteLength) {
	                        alert('wrong length');
	                        console.log(length, data.byteLength);
	                    }
	                    cloud = CreateBuffer(new Float32Array(data), renderFlag);
	                    colors = Create$1(length);
	                    mode.value = 'points';
	                    color.value = 'color';
	                    break;
	                case 2:
	                    if (nearest != undefined) {
	                        nearest.destroy();
	                    }
	                    k = new Int32Array(data)[0];
	                    data = data.slice(4);
	                    nearest = CreateBuffer(new Uint32Array(data), computeFlag);
	                    mode.value = 'connections';
	                    break;
	                case 3:
	                    if (curvature != undefined) {
	                        curvature.destroy();
	                    }
	                    curvature = CreateBuffer(new Float32Array(data), renderFlag);
	                    color.value = 'curve';
	                    break;
	                case 4:
	                    if (normals != undefined) {
	                        normals.destroy();
	                    }
	                    normals = CreateBuffer(new Float32Array(data), renderFlag);
	                    color.value = 'normal';
	                    break;
	            }
	        }
	    };
	    window.CreateForm = (name) => {
	        const data = new ArrayBuffer(8);
	        let id;
	        const size = window.size;
	        switch (name) {
	            case 'sphere':
	                id = formIdOffset + 0;
	                break;
	            case 'cube':
	                id = formIdOffset + 1;
	                break;
	            case 'torus':
	                id = formIdOffset + 2;
	                break;
	            case 'map':
	                id = formIdOffset + 3;
	                break;
	            case 'bunny':
	                id = formIdOffset + 4;
	                break;
	            case 'bunnyBig':
	                id = formIdOffset + 5;
	                break;
	            case 'statue':
	                id = formIdOffset + 6;
	                break;
	        }
	        new Int32Array(data)[0] = id;
	        new Int32Array(data)[1] = size;
	        socket.send(data);
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
	    window.StartCompute = (name) => {
	        let data;
	        switch (name) {
	            case 'kNearestIter':
	            case 'kNearestList':
	            case 'kNearestIterSorted':
	            case 'kNearestListSorted':
	                data = new ArrayBuffer(8);
	                switch (name) {
	                    case 'kNearestIter':
	                        new Int32Array(data)[0] = computeIdOffset + 0;
	                        break;
	                    case 'kNearestList':
	                        new Int32Array(data)[0] = computeIdOffset + 1;
	                        break;
	                    case 'kNearestIterSorted':
	                        new Int32Array(data)[0] = computeIdOffset + 2;
	                        break;
	                    case 'kNearestListSorted':
	                        new Int32Array(data)[0] = computeIdOffset + 3;
	                        break;
	                }
	                new Int32Array(data)[1] = window.k;
	                socket.send(data);
	                break;
	            case 'triangulateAll':
	            case 'triangulateNear':
	                data = new ArrayBuffer(4);
	                switch (name) {
	                    case 'triangulateAll':
	                        new Int32Array(data)[0] = computeIdOffset + 4;
	                        break;
	                    case 'triangulateNear':
	                        new Int32Array(data)[0] = computeIdOffset + 5;
	                        break;
	                }
	                socket.send(data);
	                break;
	            case 'noise':
	                data = new ArrayBuffer(8);
	                new Int32Array(data)[0] = computeIdOffset + 6;
	                new Float32Array(data)[1] = window.noise;
	                socket.send(data);
	                break;
	            case 'frequenz':
	                data = new ArrayBuffer(8);
	                new Int32Array(data)[0] = computeIdOffset + 7;
	                new Int32Array(data)[1] = window.frequencies;
	                socket.send(data);
	                break;
	            case 'smooth':
	                data = new ArrayBuffer(8);
	                new Int32Array(data)[0] = computeIdOffset + 8;
	                new Int32Array(data)[1] = window.iterations;
	                socket.send(data);
	                break;
	            case 'normal':
	                data = new ArrayBuffer(4);
	                new Int32Array(data)[0] = computeIdOffset + 9;
	                socket.send(data);
	                break;
	            case 'curvatureNormal':
	                data = new ArrayBuffer(4);
	                new Int32Array(data)[0] = computeIdOffset + 10;
	                socket.send(data);
	                break;
	            case 'peek':
	                data = new ArrayBuffer(4);
	                new Int32Array(data)[0] = computeIdOffset + 11;
	                socket.send(data);
	                break;
	            case 'threshold':
	                data = new ArrayBuffer(8);
	                new Int32Array(data)[0] = computeIdOffset + 12;
	                new Float32Array(data)[1] = window.threshold;
	                socket.send(data);
	                break;
	            case 'reduce':
	                data = new ArrayBuffer(4);
	                new Int32Array(data)[0] = computeIdOffset + 13;
	                socket.send(data);
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
	    window.CreateForm('sphere');
	    let last = await new Promise(requestAnimationFrame);
	    const run = true;
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
	        const rad = window.radius;
	        StartRender(cam);
	        if (gridCheckbox.checked) {
	            Render$3(normal, grid.length, grid.positions, grid.colors);
	        }
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
	        FinishRender();
	        if (keys['KeyP'] != undefined) {
	            const a = document.createElement('a');
	            a.href = canvas.toDataURL('image/png');
	            const name = prompt('download name');
	            if (name != null) {
	                if (name.length == 0) {
	                    a.download = 'cloud.png';
	                }
	                else {
	                    a.download = name;
	                }
	                a.click();
	            }
	            delete keys['KeyP'];
	        }
	        last = time;
	    }
	};

})();
