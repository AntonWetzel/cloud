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
	                loadOp: 'clear',
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

	var srcURI$3 = "data:null;base64,W1tibG9ja11dIHN0cnVjdCBDYW1lcmEgew0KCXByb2plY3Rpb246IG1hdDR4NDxmMzI+Ow0KCXZpZXc6IG1hdDR4NDxmMzI+Ow0KfTsNCg0KDQpbW2Jsb2NrXV0gc3RydWN0IFBhcmFtZXRlciB7DQoJbW9kZWw6IG1hdDR4NDxmMzI+Ow0KfTsNCg0KW1tncm91cCgwKSwgYmluZGluZygwKV1dIHZhcjx1bmlmb3JtPiBjYW1lcmE6IENhbWVyYTsNCltbZ3JvdXAoMCksIGJpbmRpbmcoMSldXSB2YXI8dW5pZm9ybT4gcGFyYW1ldGVyOiBQYXJhbWV0ZXI7DQoNCnN0cnVjdCBUcmFuc2ZlciB7DQoJW1tidWlsdGluKHBvc2l0aW9uKV1dIHBvc2l0aW9uIDogdmVjNDxmMzI+Ow0KCVtbbG9jYXRpb24oMCldXSBjb2xvcjogdmVjMzxmMzI+Ow0KfTsNCg0KW1tzdGFnZSh2ZXJ0ZXgpXV0NCmZuIHZlcnRleE1haW4oDQoJW1tsb2NhdGlvbigwKV1dIHZlcnRleDogdmVjMzxmMzI+LA0KCVtbbG9jYXRpb24oMSldXSBjb2xvcjogdmVjMzxmMzI+LA0KKSAtPiBUcmFuc2ZlciB7DQoJdmFyIG91dHB1dCA6IFRyYW5zZmVyOw0KCW91dHB1dC5wb3NpdGlvbiA9IGNhbWVyYS5wcm9qZWN0aW9uICogY2FtZXJhLnZpZXcgKiBwYXJhbWV0ZXIubW9kZWwgKiB2ZWM0PGYzMj4odmVydGV4LCAxLjApOw0KCW91dHB1dC5jb2xvciA9IGNvbG9yOw0KCXJldHVybiBvdXRwdXQ7DQp9DQoNCltbc3RhZ2UoZnJhZ21lbnQpXV0NCmZuIGZyYWdtZW50TWFpbihkYXRhOiBUcmFuc2ZlcikgLT4gW1tsb2NhdGlvbigwKV1dIHZlYzQ8ZjMyPiB7DQoJcmV0dXJuIHZlYzQ8ZjMyPihkYXRhLmNvbG9yLCAxLjApOw0KfQ0K";

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

	var srcURI$2 = "data:null;base64,W1tibG9ja11dIHN0cnVjdCBDYW1lcmEgew0KCXByb2plY3Rpb246IG1hdDR4NDxmMzI+Ow0KCXZpZXc6IG1hdDR4NDxmMzI+Ow0KfTsNCg0KW1tibG9ja11dIHN0cnVjdCBQYXJhbWV0ZXIgew0KCW1vZGVsOiBtYXQ0eDQ8ZjMyPjsNCglyYWRpdXM6IGYzMjsNCglhc3BlY3Q6IGYzMjsNCn07DQoNCg0KW1tncm91cCgwKSwgYmluZGluZygwKV1dIHZhcjx1bmlmb3JtPiBjYW1lcmE6IENhbWVyYTsNCltbZ3JvdXAoMCksIGJpbmRpbmcoMSldXSB2YXI8dW5pZm9ybT4gcGFyYW1ldGVyOiBQYXJhbWV0ZXI7DQoNCnN0cnVjdCBUcmFuc2ZlciB7DQoJW1tidWlsdGluKHBvc2l0aW9uKV1dIHBvc2l0aW9uIDogdmVjNDxmMzI+Ow0KCVtbbG9jYXRpb24oMCldXSBvZmZzZXQgOiB2ZWMyPGYzMj47DQoJW1tsb2NhdGlvbigxKV1dIGNvbG9yIDogdmVjMzxmMzI+Ow0KfTsNCg0KW1tzdGFnZSh2ZXJ0ZXgpXV0NCmZuIHZlcnRleE1haW4oDQoJW1tsb2NhdGlvbigwKV1dIG9mZnNldDogdmVjMjxmMzI+LA0KCVtbbG9jYXRpb24oMSldXSBwb3NpdGlvbiA6IHZlYzM8ZjMyPiwNCglbW2xvY2F0aW9uKDIpXV0gY29sb3I6IHZlYzM8ZjMyPiwNCikgLT4gVHJhbnNmZXIgew0KCXZhciBvdXRwdXQgOiBUcmFuc2ZlcjsNCglvdXRwdXQucG9zaXRpb24gPSBjYW1lcmEucHJvamVjdGlvbiAqIGNhbWVyYS52aWV3ICogcGFyYW1ldGVyLm1vZGVsICogdmVjNDxmMzI+KHBvc2l0aW9uLCAxLjApOw0KCW91dHB1dC5wb3NpdGlvbi54ID0gb3V0cHV0LnBvc2l0aW9uLnggKyBvZmZzZXQueCAqIHBhcmFtZXRlci5yYWRpdXM7DQoJb3V0cHV0LnBvc2l0aW9uLnkgPSBvdXRwdXQucG9zaXRpb24ueSArIG9mZnNldC55ICogcGFyYW1ldGVyLnJhZGl1cyAqIHBhcmFtZXRlci5hc3BlY3Q7DQoJb3V0cHV0Lm9mZnNldCA9IG9mZnNldDsNCglvdXRwdXQuY29sb3IgPSBhYnMoY29sb3IpOw0KCXJldHVybiBvdXRwdXQ7DQp9DQoNCltbc3RhZ2UoZnJhZ21lbnQpXV0NCmZuIGZyYWdtZW50TWFpbihpbnB1dCA6IFRyYW5zZmVyKSAtPiBbW2xvY2F0aW9uKDApXV0gdmVjNDxmMzI+IHsNCglpZiAobGVuZ3RoKGlucHV0Lm9mZnNldCkgPj0gMS4wKSB7DQoJCWRpc2NhcmQ7DQoJfQ0KCXJldHVybiB2ZWM0PGYzMj4oaW5wdXQuY29sb3IsIDEuMCk7DQp9DQo=";

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

	var srcURI$1 = "data:null;base64,W1tibG9ja11dIHN0cnVjdCBDYW1lcmEgew0KCXByb2plY3Rpb246IG1hdDR4NDxmMzI+Ow0KCXZpZXc6IG1hdDR4NDxmMzI+Ow0KfTsNCg0KW1tibG9ja11dIHN0cnVjdCBQYXJhbWV0ZXIgew0KCW1vZGVsOiBtYXQ0eDQ8ZjMyPjsNCglrOiB1MzI7DQp9Ow0KDQpbW2Jsb2NrXV0gc3RydWN0IEJ1ZmZlciB7DQoJZGF0YTogYXJyYXk8dmVjMzxmMzI+PjsNCn07DQoNCltbYmxvY2tdXSBzdHJ1Y3QgSW5kaWNlcyB7DQoJZGF0YTogYXJyYXk8dTMyPjsNCn07DQoNCg0KW1tncm91cCgwKSwgYmluZGluZygwKV1dIHZhcjx1bmlmb3JtPiBjYW1lcmE6IENhbWVyYTsNCltbZ3JvdXAoMCksIGJpbmRpbmcoMSldXSB2YXI8dW5pZm9ybT4gcGFyYW1ldGVyOiBQYXJhbWV0ZXI7DQpbW2dyb3VwKDApLCBiaW5kaW5nKDIpXV0gdmFyPHN0b3JhZ2UsIHJlYWQ+IHBvc2l0aW9uczogQnVmZmVyOw0KW1tncm91cCgwKSwgYmluZGluZygzKV1dIHZhcjxzdG9yYWdlLCByZWFkPiBjb2xvcnM6IEJ1ZmZlcjsNCltbZ3JvdXAoMCksIGJpbmRpbmcoNCldXSB2YXI8c3RvcmFnZSwgcmVhZD4gaW5kaWNlczogSW5kaWNlczsNCg0Kc3RydWN0IFRyYW5zZmVyIHsNCglbW2J1aWx0aW4ocG9zaXRpb24pXV0gcG9zaXRpb24gOiB2ZWM0PGYzMj47DQoJW1tsb2NhdGlvbigwKV1dIGNvbG9yOiB2ZWMzPGYzMj47DQp9Ow0KDQpbW3N0YWdlKHZlcnRleCldXQ0KZm4gdmVydGV4TWFpbigNCglbW2J1aWx0aW4odmVydGV4X2luZGV4KV1dIGlkOiB1MzIsDQopIC0+IFRyYW5zZmVyIHsNCgl2YXIgdmVydGV4ID0gcG9zaXRpb25zLmRhdGFbaWQgLyAoMnUgKiBwYXJhbWV0ZXIuayldOw0KCXZhciBjb2xvciA9IGNvbG9ycy5kYXRhW2lkIC8gKDJ1ICogcGFyYW1ldGVyLmspXTsNCglpZiAoaWQlMnUgIT0gMHUpIHsNCgkJdmVydGV4ID0gKHZlcnRleCArIHBvc2l0aW9ucy5kYXRhW2luZGljZXMuZGF0YVtpZC8ydV0gXSkgLyAyLjA7DQoJfQ0KCXZhciBvdXRwdXQgOiBUcmFuc2ZlcjsNCglvdXRwdXQucG9zaXRpb24gPSBjYW1lcmEucHJvamVjdGlvbiAqIGNhbWVyYS52aWV3ICogcGFyYW1ldGVyLm1vZGVsICogdmVjNDxmMzI+KHZlcnRleCwgMS4wKTsNCgkNCglvdXRwdXQuY29sb3IgPSBhYnMoY29sb3IpOw0KDQoJcmV0dXJuIG91dHB1dDsNCn0NCg0KW1tzdGFnZShmcmFnbWVudCldXQ0KZm4gZnJhZ21lbnRNYWluKGRhdGE6IFRyYW5zZmVyKSAtPiBbW2xvY2F0aW9uKDApXV0gdmVjNDxmMzI+IHsNCglyZXR1cm4gdmVjNDxmMzI+KGRhdGEuY29sb3IsIDEuMCk7DQp9DQo=";

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

	var srcURI = "data:null;base64,W1tibG9ja11dIHN0cnVjdCBDYW1lcmEgewoJcHJvamVjdGlvbjogbWF0NHg0PGYzMj47Cgl2aWV3OiBtYXQ0eDQ8ZjMyPjsKfTsKCltbYmxvY2tdXSBzdHJ1Y3QgUGFyYW1ldGVyIHsKCW1vZGVsOiBtYXQ0eDQ8ZjMyPjsKCWs6IHUzMjsKfTsKCltbYmxvY2tdXSBzdHJ1Y3QgQnVmZmVyIHsKCWRhdGE6IGFycmF5PHZlYzM8ZjMyPj47Cn07CgpbW2Jsb2NrXV0gc3RydWN0IEluZGljZXMgewoJZGF0YTogYXJyYXk8dTMyPjsKfTsKCltbZ3JvdXAoMCksIGJpbmRpbmcoMCldXSB2YXI8dW5pZm9ybT4gY2FtZXJhOiBDYW1lcmE7CltbZ3JvdXAoMCksIGJpbmRpbmcoMSldXSB2YXI8dW5pZm9ybT4gcGFyYW1ldGVyOiBQYXJhbWV0ZXI7CltbZ3JvdXAoMCksIGJpbmRpbmcoMildXSB2YXI8c3RvcmFnZSwgcmVhZD4gcG9zaXRpb25zOiBCdWZmZXI7CltbZ3JvdXAoMCksIGJpbmRpbmcoMyldXSB2YXI8c3RvcmFnZSwgcmVhZD4gY29sb3JzOiBCdWZmZXI7CltbZ3JvdXAoMCksIGJpbmRpbmcoNCldXSB2YXI8c3RvcmFnZSwgcmVhZD4gaW5kaWNlczogSW5kaWNlczsKCnN0cnVjdCBUcmFuc2ZlciB7CglbW2J1aWx0aW4ocG9zaXRpb24pXV0gcG9zaXRpb24gOiB2ZWM0PGYzMj47CglbW2xvY2F0aW9uKDApXV0gY29sb3I6IHZlYzM8ZjMyPjsKfTsKCltbc3RhZ2UodmVydGV4KV1dCmZuIHZlcnRleE1haW4oCglbW2J1aWx0aW4odmVydGV4X2luZGV4KV1dIGlkOiB1MzIsCikgLT4gVHJhbnNmZXIgewoJbGV0IGNlbnRlciA9IGlkIC8gKDN1ICogcGFyYW1ldGVyLmspOwoJbGV0IG1pZGRsZV9wb3MgPSBwb3NpdGlvbnMuZGF0YVtjZW50ZXJdOwoJdmFyIHBvc2l0aW9uOiB2ZWMzPGYzMj47Cglzd2l0Y2ggKGlkJTN1KSB7CgkJY2FzZSAwdTogewoJCQlwb3NpdGlvbiA9IG1pZGRsZV9wb3M7CgkJCWJyZWFrOwoJCX0KCQljYXNlIDF1OiB7CgkJCWxldCBpbmRleF9pZCA9IGluZGljZXMuZGF0YVtpZC8zdV07CgkJCWxldCBwID0gcG9zaXRpb25zLmRhdGFbaW5kZXhfaWRdOwoJCQlpZiAocC54ID49IG1pZGRsZV9wb3MueCkgewoJCQkJcG9zaXRpb24gPSBwOwoJCQl9IGVsc2UgewoJCQkJcG9zaXRpb24gPSBtaWRkbGVfcG9zOwoJCQl9CgkJCWJyZWFrOwoJCX0KCQlkZWZhdWx0OiB7CgkJCXZhciBpbmRleF9pZCA9IGluZGljZXMuZGF0YVtpZC8zdSArIDF1XTsKCQkJaWYgKGluZGV4X2lkID09IGNlbnRlciB8fCAoaWQgKyAxdSklKHBhcmFtZXRlci5rICogM3UpID09IDB1KSB7IC8vbG9vcCBhcm91bmQgdG8gdGhlIGZpcnN0IHZlcnRleCBpbiB0aGUgY2lyY2xlCgkJCQlpbmRleF9pZCA9IGluZGljZXMuZGF0YVtjZW50ZXIqcGFyYW1ldGVyLmtdOwoJCQl9CgkJCWxldCBwID0gcG9zaXRpb25zLmRhdGFbaW5kZXhfaWRdOwoJCQlpZiAocC54ID49IG1pZGRsZV9wb3MueCkgewoJCQkJcG9zaXRpb24gPSBwOwoJCQl9IGVsc2UgewoJCQkJcG9zaXRpb24gPSBtaWRkbGVfcG9zOwoJCQl9CgkJCWJyZWFrOwoJCX0KCX0KCXZhciBvdXRwdXQgOiBUcmFuc2ZlcjsKCW91dHB1dC5wb3NpdGlvbiA9IGNhbWVyYS5wcm9qZWN0aW9uICogY2FtZXJhLnZpZXcgKiBwYXJhbWV0ZXIubW9kZWwgKiB2ZWM0PGYzMj4ocG9zaXRpb24sIDEuMCk7CglvdXRwdXQuY29sb3IgPSBhYnMoY29sb3JzLmRhdGFbY2VudGVyXSk7CglyZXR1cm4gb3V0cHV0Owp9CgpbW3N0YWdlKGZyYWdtZW50KV1dCmZuIGZyYWdtZW50TWFpbihkYXRhOiBUcmFuc2ZlcikgLT4gW1tsb2NhdGlvbigwKV1dIHZlYzQ8ZjMyPiB7CglyZXR1cm4gdmVjNDxmMzI+KGRhdGEuY29sb3IsIDEuMCk7Cn0K";

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
	            case 'threshhold':
	                data = new ArrayBuffer(8);
	                new Int32Array(data)[0] = computeIdOffset + 12;
	                new Float32Array(data)[1] = window.threshhold;
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
