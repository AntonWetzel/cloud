import { Matrix } from './math.js';
import * as GPU from './gpu.js';
export class Camera {
    projection;
    view;
    fov;
    constructor(fieldOfView) {
        this.projection = Matrix.Perspective(fieldOfView, GPU.global.aspect, 1, 1000);
        this.view = Matrix.Identity();
        this.fov = fieldOfView;
    }
    set fieldOfView(val) {
        this.fov = val;
        this.projection = Matrix.Perspective(val, GPU.global.aspect, 1, 1000);
    }
    get fieldOfView() {
        return this.fov;
    }
    Buffer() {
        const array = new Float32Array(16 * 2);
        this.projection.Save(array, 0);
        this.view.Save(array, 16);
        return GPU.CreateBuffer(array, GPUBufferUsage.UNIFORM);
    }
    UpdateSize() {
        this.projection = Matrix.Perspective(this.fov, GPU.global.aspect, 1, 1000);
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
