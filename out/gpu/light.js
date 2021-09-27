import { Matrix } from './math.js';
import { Lines } from './lines.js';
export class Light {
    static lines;
    static async Setup() {
        Light.lines = new Lines(new Float32Array([
            /*eslint-disable*/
            1, 1, 1, 0, 0, 0, 0, 0, 0, -1, -1, -1,
            1, 1, -1, 0, 0, 0, 0, 0, 0, -1, -1, 1,
            1, -1, 1, 0, 0, 0, 0, 0, 0, -1, 1, -1,
            -1, 1, 1, 0, 0, 0, 0, 0, 0, 1, -1, -1,
            /*eslint-enable*/
        ]), new Float32Array([
            /*eslint-disable*/
            0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0,
            0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0,
            0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0,
            0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0,
            /*eslint-enable*/
        ]));
        Light.lines.Scale(10, 10, 10);
    }
    projection;
    view;
    viewInv;
    intensity;
    constructor(intensity) {
        this.projection = Matrix.Perspective(Math.PI / 2, 1, 1, 1000);
        this.view = Matrix.Identity();
        this.viewInv = Matrix.Identity();
        this.intensity = intensity;
    }
    Show(projection, view, renderPass, lights) {
        Light.lines.Render(projection, view, this.viewInv, renderPass, lights);
    }
    Translate(x, y, z) {
        this.view = Matrix.Translate(-x, -y, -z).Multiply(this.view);
        this.viewInv = this.viewInv.Multiply(Matrix.Translate(x, y, z));
    }
    RotateX(rad) {
        this.view = Matrix.RotateX(-rad).Multiply(this.view);
        this.viewInv = this.viewInv.Multiply(Matrix.RotateX(rad));
    }
    RotateY(rad) {
        this.view = Matrix.RotateY(-rad).Multiply(this.view);
        this.viewInv = this.viewInv.Multiply(Matrix.RotateY(rad));
    }
    RotateGlobalY(rad) {
        const axis = this.view.MultiplyVector({ x: 0, y: 1, z: 0 });
        this.view = Matrix.Rotate(-rad, axis).Multiply(this.view);
        this.viewInv = this.viewInv.Multiply(Matrix.Rotate(rad, axis));
    }
    RotateZ(rad) {
        this.view = Matrix.RotateZ(-rad).Multiply(this.view);
        this.viewInv = this.viewInv.Multiply(Matrix.RotateZ(rad));
    }
    Position() {
        return this.viewInv.Position();
    }
    Save(data, offset) {
        const p = this.viewInv.Position();
        data[offset + 0] = p.x;
        data[offset + 1] = p.y;
        data[offset + 2] = p.z;
        data[offset + 3] = this.intensity;
    }
}
