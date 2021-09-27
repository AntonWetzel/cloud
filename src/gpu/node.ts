import * as GPU from './gpu.js'
import { Matrix } from './math.js'

export abstract class Node {
	protected model: Matrix
	children: Node[]

	constructor() {
		this.model = Matrix.Identity()
		this.children = []
	}

	Render(
		projection: Matrix,
		view: Matrix,
		model: Matrix,
		renderPass: GPURenderPassEncoder,
		spotLights: GPUBuffer,
	): void {
		model = model.Multiply(this.model)
		this.SubRender(projection, view, model, renderPass, spotLights)
		for (let i = 0; i < this.children.length; i++) {
			this.children[i].Render(
				projection,
				view,
				model,
				renderPass,
				spotLights,
			)
		}
	}

	protected abstract SubRender(
		projection: Matrix,
		view: Matrix,
		model: Matrix,
		renderPass: GPURenderPassEncoder,
		lights: GPUBuffer,
	): void

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
