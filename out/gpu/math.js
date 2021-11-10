export class Matrix {
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
