import { Matrix } from './math.js'
import * as GPU from './gpu.js'
import { Position } from './position.js'

export class Camera {
	private projection: Matrix
	private view: Matrix
	private fov: number

	constructor(fieldOfView: number) {
		this.projection = Matrix.Perspective(fieldOfView, GPU.global.aspect, 1, 1000)
		this.view = Matrix.Identity()
		this.fov = fieldOfView
	}

	set fieldOfView(val: number) {
		this.fov = val
		this.projection = Matrix.Perspective(val, GPU.global.aspect, 1, 1000)
	}

	get fieldOfView(): number {
		return this.fov
	}

	Buffer(): GPUBuffer {
		const array = new Float32Array(16 * 2)
		this.projection.Save(array, 0)
		this.view.Save(array, 16)
		return GPU.CreateBuffer(array, GPUBufferUsage.UNIFORM)
	}

	UpdateSize(): void {
		this.projection = Matrix.Perspective(this.fov, GPU.global.aspect, 1, 1000)
	}

	Translate(x: number, y: number, z: number): void {
		this.view = Matrix.Translate(-x, -y, -z).Multiply(this.view)
	}

	RotateX(rad: number): void {
		this.view = Matrix.RotateX(-rad).Multiply(this.view)
	}

	RotateY(rad: number): void {
		this.view = Matrix.RotateY(-rad).Multiply(this.view)
	}
	RotateGlobalY(rad: number): void {
		const axis = this.view.MultiplyVector({ x: 0, y: 1, z: 0 })
		this.view = Matrix.Rotate(-rad, axis).Multiply(this.view)
	}
	RotateZ(rad: number): void {
		this.view = Matrix.RotateZ(-rad).Multiply(this.view)
	}
}
