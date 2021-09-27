import { Matrix } from './math.js'
import * as GPU from './gpu.js'
import { Node } from './node.js'
import { Light } from './light.js'

export class Camera {
	private projection: Matrix
	private view: Matrix
	private fov: number

	constructor(fieldOfView: number) {
		this.projection = Matrix.Perspective(
			fieldOfView,
			GPU.global.aspect,
			1,
			1000,
		)
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

	Render(node: Node, lights: Light[]): void {
		const encoder = GPU.device.createCommandEncoder()

		const spotSize = 16 * 2 + 4
		const pointSize = 4
		const lightData = new Float32Array(
			4 + (lights.length + (lights.length == 0 ? 1 : 0)) * spotSize,
		)
		new Int32Array(lightData.buffer)[0] = lights.length

		for (let i = 0; i < lights.length; i++) {
			const light = lights[i]
			light.Shadow(node, i, encoder)
			light.Save(lightData, 4 + i * spotSize)
		}
		const lightBuffer = GPU.CreateBuffer(lightData, GPUBufferUsage.STORAGE)
		const renderPass = encoder.beginRenderPass({
			colorAttachments: [
				{
					loadValue: GPU.clearColor,
					storeOp: 'store',
					view: GPU.context.getCurrentTexture().createView(),
				},
			],
			depthStencilAttachment: {
				depthLoadValue: 1.0,
				depthStoreOp: 'store',
				stencilLoadValue: 0,
				stencilStoreOp: 'store',
				view: GPU.depth.createView(),
			},
		})
		node.Render(
			this.projection,
			this.view,
			Matrix.Identity(),
			renderPass,
			lightBuffer,
		)
		for (let i = 0; i < lights.length; i++) {
			lights[i].Show(this.projection, this.view, renderPass, lightBuffer)
		}
		renderPass.endPass()
		GPU.device.queue.submit([encoder.finish()])
	}

	UpdateSize(): void {
		this.projection = Matrix.Perspective(
			this.fov,
			GPU.global.aspect,
			1,
			1000,
		)
	}

	Translate(x: number, y: number, z: number): void {
		this.view = Matrix.Translate(-x, -y, -z).Multiply(this.view)
		//this.viewInv = this.viewInv.Multiply(Matrix.Translate(x, y, z))
	}

	RotateX(rad: number): void {
		this.view = Matrix.RotateX(-rad).Multiply(this.view)
		//this.viewInv = this.viewInv.Multiply(Matrix.RotateX(rad))
	}

	RotateY(rad: number): void {
		this.view = Matrix.RotateY(-rad).Multiply(this.view)
		//this.viewInv = this.viewInv.Multiply(Matrix.RotateY(rad))
	}
	RotateGlobalY(rad: number): void {
		const axis = this.view.MultiplyVector({ x: 0, y: 1, z: 0 })
		this.view = Matrix.Rotate(-rad, axis).Multiply(this.view)
		//this.viewInv = this.viewInv.Multiply(Matrix.Rotate(rad, axis))
	}
	RotateZ(rad: number): void {
		this.view = Matrix.RotateZ(-rad).Multiply(this.view)
		//this.viewInv = this.viewInv.Multiply(Matrix.RotateZ(rad))
	}
}
