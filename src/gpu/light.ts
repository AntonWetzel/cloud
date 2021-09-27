import * as GPU from './gpu.js'
import * as Module from './module.js'
import { Matrix, Vector } from './math.js'
import { Node } from './node.js'
import { Lines } from './lines.js'
import { GetServerFile } from '../helper/file.js'
import * as Quad from './quad.js'

export class Light {
	static lines: Lines

	static async Setup(): Promise<void> {
		Light.lines = new Lines(
			new Float32Array([
				/*eslint-disable*/
				 1,  1,  1,   0,0,0,  0,0,0,   -1, -1, -1,
				 1,  1, -1,   0,0,0,  0,0,0,   -1, -1,  1,
				 1, -1,  1,   0,0,0,  0,0,0,   -1,  1, -1,
				-1,  1,  1,   0,0,0,  0,0,0,    1, -1, -1,
				/*eslint-enable*/
			]),
			new Float32Array([
				/*eslint-disable*/
				0,0,0,  1,1,0,   1,1,0,  0,0,0,
				0,0,0,  1,1,0,   1,1,0,  0,0,0,
				0,0,0,  1,1,0,   1,1,0,  0,0,0,
				0,0,0,  1,1,0,   1,1,0,  0,0,0,
				/*eslint-enable*/
			]),
		)
		Light.lines.Scale(10, 10, 10)
	}

	private projection: Matrix
	private view: Matrix
	private viewInv: Matrix
	private intensity: number

	constructor(intensity: number) {
		this.projection = Matrix.Perspective(Math.PI / 2, 1, 1, 1000)
		this.view = Matrix.Identity()
		this.viewInv = Matrix.Identity()
		this.intensity = intensity
	}

	Show(
		projection: Matrix,
		view: Matrix,
		renderPass: GPURenderPassEncoder,
		lights: GPUBuffer,
	): void {
		Light.lines.Render(projection, view, this.viewInv, renderPass, lights)
	}

	Translate(x: number, y: number, z: number): void {
		this.view = Matrix.Translate(-x, -y, -z).Multiply(this.view)
		this.viewInv = this.viewInv.Multiply(Matrix.Translate(x, y, z))
	}

	RotateX(rad: number): void {
		this.view = Matrix.RotateX(-rad).Multiply(this.view)
		this.viewInv = this.viewInv.Multiply(Matrix.RotateX(rad))
	}

	RotateY(rad: number): void {
		this.view = Matrix.RotateY(-rad).Multiply(this.view)
		this.viewInv = this.viewInv.Multiply(Matrix.RotateY(rad))
	}
	RotateGlobalY(rad: number): void {
		const axis = this.view.MultiplyVector({ x: 0, y: 1, z: 0 })
		this.view = Matrix.Rotate(-rad, axis).Multiply(this.view)
		this.viewInv = this.viewInv.Multiply(Matrix.Rotate(rad, axis))
	}
	RotateZ(rad: number): void {
		this.view = Matrix.RotateZ(-rad).Multiply(this.view)
		this.viewInv = this.viewInv.Multiply(Matrix.RotateZ(rad))
	}

	Position(): Vector {
		return this.viewInv.Position()
	}

	Save(data: Float32Array, offset: number): void {
		const p = this.viewInv.Position()
		data[offset + 0] = p.x
		data[offset + 1] = p.y
		data[offset + 2] = p.z
		data[offset + 3] = this.intensity
	}
}
