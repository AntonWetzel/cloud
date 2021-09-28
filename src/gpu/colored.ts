import * as GPU from './gpu.js'
import * as Module from './module.js'
import { Matrix } from './math.js'
import { Node } from './node.js'
import { GetServerFile } from '../helper/file.js'

export class Colored extends Node {
	private static pipeline: GPURenderPipeline

	static async Setup(): Promise<void> {
		const module = Module.New(
			await GetServerFile('../shaders/render/colored.wgsl'),
		)

		Colored.pipeline = GPU.device.createRenderPipeline({
			vertex: {
				module: module,
				entryPoint: 'vertexMain',
				buffers: [
					{
						attributes: [
							{
								shaderLocation: 0,
								offset: 0 * 4,
								format: 'float32x3',
							},
						],
						arrayStride: 3 * 4,
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
						stepMode: 'vertex',
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
						stepMode: 'vertex',
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
			primitive: {
				topology: 'triangle-list',
				cullMode: 'back',
			},
			depthStencil: {
				format: 'depth32float',
				depthWriteEnabled: true,
				depthCompare: 'less',
			},
		})
	}

	private buffer: {
		length: number
		vertices: GPUBuffer
		colors: GPUBuffer
		normals: GPUBuffer
	}

	constructor(vertices: number[], color: number[], normals: number[]) {
		super()
		this.buffer = {
			length: vertices.length / 3,
			vertices: GPU.CreateBuffer(
				new Float32Array(vertices),
				GPUBufferUsage.VERTEX,
			),
			colors: GPU.CreateBuffer(
				new Float32Array(color),
				GPUBufferUsage.VERTEX,
			),
			normals: GPU.CreateBuffer(
				new Float32Array(normals),
				GPUBufferUsage.VERTEX,
			),
		}
	}

	SubRender(
		projection: Matrix,
		view: Matrix,
		model: Matrix,
		renderPass: GPURenderPassEncoder,
		lights: GPUBuffer,
	): void {
		const array = new Float32Array(16 * 3 + 4)
		projection.Save(array, 0)
		view.Save(array, 16)
		model.Save(array, 32)
		array[16 * 3] = GPU.global.ambient
		const buffer = GPU.CreateBuffer(array, GPUBufferUsage.UNIFORM)
		renderPass.setPipeline(Colored.pipeline)

		const group = GPU.device.createBindGroup({
			layout: Colored.pipeline.getBindGroupLayout(0),
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
		renderPass.setVertexBuffer(0, this.buffer.vertices)
		renderPass.setVertexBuffer(1, this.buffer.colors)
		renderPass.setVertexBuffer(2, this.buffer.normals)
		renderPass.draw(this.buffer.length)
	}
}
