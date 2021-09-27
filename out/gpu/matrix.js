export class Matrix {
    data;
    constructor(data) {
        this.data = data;
    }
    static Identity() {
        return new Matrix(new Float32Array([
            /*eslint-disable*/
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
            /*eslint-enable*/
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
    Position() {
        const res = new Float32Array(3);
        res[0] = this.data[3];
        res[1] = this.data[7];
        res[2] = this.data[11];
        return res;
    }
    static Perspective(fovy, aspect, near, far) {
        const c2 = (far + near) / (near - far);
        const c1 = (2 * far * near) / (near - far);
        const s = 1 / Math.tan(fovy / 2);
        const m = new Float32Array([
            /*eslint-disable*/
            s / aspect, 0, 0, 0,
            0, s, 0, 0,
            0, 0, c2, c1,
            0, 0, -1, 0,
            /*eslint-enable*/
        ]);
        return new Matrix(m);
    }
}
