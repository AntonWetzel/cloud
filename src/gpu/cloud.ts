import * as GPU from './gpu.js'
import * as Module from './module.js'
import { GetServerFile } from '../helper/file.js'
import { Node } from './node.js'
import { Matrix } from './math.js'

export class Cloud extends Node {
	private static pipeline: GPURenderPipeline
	private static quadBuffer: GPUBuffer

	static async Setup(): Promise<void> {
		const src = await GetServerFile('../shaders/cloud.wgsl')
		const module = Module.New(src)
		Cloud.pipeline = GPU.device.createRenderPipeline({
			vertex: {
				module: module,
				entryPoint: 'vertexMain',
				buffers: [
					{
						attributes: [
							{
								shaderLocation: 0,
								offset: 0 * 4,
								format: 'float32x2',
							},
						],
						arrayStride: 2 * 4,
						stepMode: 'vertex',
					},
					{
						attributes: [
							{
								shaderLocation: 1,
								offset: 0 * 4,
								format: 'float32x3',
							},
						],
						arrayStride: 3 * 4,
						stepMode: 'instance',
					},
					{
						attributes: [
							{
								shaderLocation: 2,
								offset: 0 * 4,
								format: 'float32x3',
							},
						],
						arrayStride: 3 * 4,
						stepMode: 'instance',
					},
				],
			},
			fragment: {
				module: module,
				entryPoint: 'fragmentMain',
				targets: [
					{
						format: GPU.format,
					},
				],
			},
			depthStencil: {
				format: 'depth32float',
				depthWriteEnabled: true,
				depthCompare: 'less',
			},
			primitive: {
				topology: 'triangle-strip',
				stripIndexFormat: 'uint32',
				cullMode: 'back',
			},
		})

		Cloud.quadBuffer = GPU.CreateBuffer(
			new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]),
			GPUBufferUsage.VERTEX,
		)
	}

	radius: number

	buffer: {
		length: number
		positions: GPUBuffer
		colors: GPUBuffer
	}

	constructor(points: Float32Array, colors: Float32Array, radius: number) {
		super()
		this.radius = radius
		this.buffer = {} as any
		this.SetPoints(points)
		this.SetColor(colors)
	}

	SetPoints(points: Float32Array): void {
		this.buffer.length = points.length / 3
		this.buffer.positions = GPU.CreateBuffer(points, GPUBufferUsage.VERTEX)
	}
	SetColor(colors: Float32Array): void {
		this.buffer.colors = GPU.CreateBuffer(colors, GPUBufferUsage.VERTEX)
	}

	SubRender(
		projection: Matrix,
		view: Matrix,
		model: Matrix,
		renderPass: GPURenderPassEncoder,
		lights: GPUBuffer,
	): void {
		const array = new Float32Array(16 * 3 + 3)
		projection.Save(array, 0)
		view.Save(array, 16)
		model.Save(array, 32)
		array[48] = GPU.global.ambient
		array[49] = this.radius
		array[50] = GPU.global.aspect
		const buffer = GPU.CreateBuffer(array, GPUBufferUsage.UNIFORM)
		renderPass.setPipeline(Cloud.pipeline)
		const group = GPU.device.createBindGroup({
			layout: Cloud.pipeline.getBindGroupLayout(0),
			entries: [
				{
					binding: 0,
					resource: { buffer: buffer },
				},
				{
					binding: 1,
					resource: { buffer: lights },
				},
			],
		})
		renderPass.setBindGroup(0, group)
		renderPass.setVertexBuffer(0, Cloud.quadBuffer)
		renderPass.setVertexBuffer(1, this.buffer.positions)
		renderPass.setVertexBuffer(2, this.buffer.colors)
		renderPass.draw(4, this.buffer.length)
	}
}
