import { Matrix } from './math.js';
export class Position {
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
