import * as GPU from './gpu.js';
import * as Matrix from './matrix.js';
export class Object {
    position;
    constructor() {
        this.position = {
            buffer: undefined,
            dirty: true,
            data: new Matrix.Matrix(),
        };
    }
    static all;
    Draw(pipeline) {
        if (this.position.dirty) {
            const array = new Float32Array(16);
            this.position.data.Save(array, 0);
            this.position.buffer = GPU.CreateBuffer(array, GPUBufferUsage.UNIFORM);
            this.position.dirty = false;
        }
        GPU.renderPass.setPipeline(pipeline);
        const group = GPU.device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: GPU.uniform,
                },
                {
                    binding: 1,
                    resource: this.position,
                },
            ],
        });
        GPU.renderPass.setBindGroup(0, group);
    }
    Translate(x, y, z) {
        this.position.data = this.position.data.Translate(x, y, z);
        this.position.dirty = true;
    }
    Rotate(rad) {
        this.position.data = this.position.data.Rotate(rad);
        this.position.dirty = true;
    }
    Scale(x, y, z) {
        this.position.data = this.position.data.Scale(x, y, z);
        this.position.dirty = true;
    }
}
