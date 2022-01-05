import { Matrix } from './math.js'

export class Position {
	model: Matrix

	constructor() {
		this.model = Matrix.Identity()
	}
	Save(location: Float32Array, offset: number): void {
		this.model.Save(location, offset)
	}

	Translate(x: number, y: number, z: number): void {
		this.model = Matrix.Translate(x, y, z).Multiply(this.model)
	}

	RotateX(rad: number): void {
		this.model = Matrix.RotateX(rad).Multiply(this.model)
	}
	RotateXLocal(rad: number): void {
		const p = this.model.Position()
		this.model = Matrix.Translate(p.x, p.y, p.z)
			.Multiply(Matrix.RotateX(rad))
			.Multiply(Matrix.Translate(-p.x, -p.y, -p.z))
			.Multiply(this.model)
	}

	RotateY(rad: number): void {
		this.model = Matrix.RotateY(rad).Multiply(this.model)
	}
	RotateYLocal(rad: number): void {
		const p = this.model.Position()
		this.model = Matrix.Translate(p.x, p.y, p.z)
			.Multiply(Matrix.RotateY(rad))
			.Multiply(Matrix.Translate(-p.x, -p.y, -p.z))
			.Multiply(this.model)
	}

	RotateZ(rad: number): void {
		this.model = Matrix.RotateZ(rad).Multiply(this.model)
	}
	RotateZLocal(rad: number): void {
		const p = this.model.Position()
		this.model = Matrix.Translate(p.x, p.y, p.z)
			.Multiply(Matrix.RotateZ(rad))
			.Multiply(Matrix.Translate(-p.x, -p.y, -p.z))
			.Multiply(this.model)
	}

	Scale(x: number, y: number, z: number): void {
		this.model = Matrix.Scale(x, y, z).Multiply(this.model)
	}
}
