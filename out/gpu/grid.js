import * as GPU from './gpu.js';
import * as Request from '../helper/request.js';
import * as Module from './module.js';
import * as Object from './object.js';
let pipeline;
export async function Setup() {
    let src = await Request.getFile("../shaders/lines.wgsl");
    let module = Module.New(src);
    pipeline = GPU.device.createRenderPipeline({
        vertex: {
            module: module,
            entryPoint: 'vertexMain',
            buffers: [
                {
                    attributes: [{
                            shaderLocation: 0,
                            offset: 0 * 4,
                            format: 'float32x3'
                        }],
                    arrayStride: 3 * 4,
                    stepMode: 'vertex'
                }
            ]
        },
        fragment: {
            module: module,
            entryPoint: 'fragmentMain',
            targets: [{
                    format: GPU.format
                }]
        },
        depthStencil: {
            format: 'depth32float',
            depthWriteEnabled: true,
            depthCompare: 'less'
        },
        primitive: {
            topology: 'line-list',
        }
    });
}
export class Lines extends Object.Object {
    constructor(lines) {
        super();
        let buffer = GPU.CreateBuffer(lines, GPUBufferUsage.VERTEX);
        this.#data = {
            length: lines.length / 3,
            buffer: buffer,
        };
    }
    #data;
    Draw() {
        this.SetCamera(pipeline);
        GPU.renderPass.setVertexBuffer(0, this.#data.buffer);
        GPU.renderPass.draw(this.#data.length);
    }
}
export function Grid(amount) {
    let length = (amount * 2 + 1) * 2 * 2;
    let array = new Float32Array(length * 3);
    let half = array.length / 2;
    for (let i = -amount; i <= amount; i++) {
        let idx = (i + amount) * 6;
        array[idx + 0] = i;
        array[idx + 1] = 0;
        array[idx + 2] = amount;
        array[idx + 3] = i;
        array[idx + 4] = 0;
        array[idx + 5] = -amount;
        array[half + idx + 0] = amount;
        array[half + idx + 1] = 0;
        array[half + idx + 2] = i;
        array[half + idx + 3] = -amount;
        array[half + idx + 4] = 0;
        array[half + idx + 5] = i;
    }
    return new Lines(array);
}
