import * as GPU from './gpu.js'
import * as Module from './module.js'
import { Matrix } from './math.js'
import { Node } from './node.js'
import { GetServerFile } from '../helper/file.js'

export class Textured extends Node {
	private static pipeline: {
		normal: GPURenderPipeline
		shadow: GPURenderPipeline
	}

	static async Setup(): Promise<void> {
		const module = {
			normal: Module.New(await GetServerFile('../shaders/textured.wgsl')),
			shadow: Module.New(await GetServerFile('../shaders/shadow.wgsl')),
		}
		const depthStencil: GPUDepthStencilState = {
			format: 'depth32float',
			depthWriteEnabled: true,
			depthCompare: 'less',
		}
		const primitive: GPUPrimitiveState = {
			topology: 'triangle-list',
			cullMode: 'back',
		}
		Textured.pipeline = {
			normal: GPU.device.createRenderPipeline({
				vertex: {
					module: module.normal,
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
									format: 'float32x2',
								},
							],
							arrayStride: 2 * 4,
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
					module: module.normal,
					entryPoint: 'fragmentMain',
					targets: [
						{
							format: GPU.format,
						},
					],
				},
				primitive: primitive,
				depthStencil: depthStencil,
			}),
			shadow: GPU.device.createRenderPipeline({
				vertex: {
					module: module.shadow,
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
					],
				},
				fragment: {
					module: module.shadow,
					entryPoint: 'fragmentMain',
					targets: [],
				},
				primitive: primitive,
				depthStencil: depthStencil,
			}),
		}
	}

	private buffer: {
		length: number
		vertices: GPUBuffer
		uvs: GPUBuffer
		normals: GPUBuffer
		texture: GPUTexture
	}

	constructor(
		vertices: number[],
		uvs: number[],
		normals: number[],
		texture: GPUTexture,
	) {
		super()
		this.buffer = {
			length: vertices.length / 3,
			vertices: GPU.CreateBuffer(
				new Float32Array(vertices),
				GPUBufferUsage.VERTEX,
			),
			uvs: GPU.CreateBuffer(new Float32Array(uvs), GPUBufferUsage.VERTEX),
			normals: GPU.CreateBuffer(
				new Float32Array(normals),
				GPUBufferUsage.VERTEX,
			),
			texture: texture,
		}
	}

	SubRender(
		projection: Matrix,
		view: Matrix,
		model: Matrix,
		renderPass: GPURenderPassEncoder,
	): void {
		const array = new Float32Array(16 * 3 + 4)
		projection.Save(array, 0)
		view.Save(array, 16)
		model.Save(array, 32)
		array[16 * 3] = GPU.global.ambient
		const pipeline = Textured.pipeline.normal
		const buffer = GPU.CreateBuffer(array, GPUBufferUsage.UNIFORM)
		renderPass.setPipeline(pipeline)
		const group = GPU.device.createBindGroup({
			layout: pipeline.getBindGroupLayout(0),
			entries: [
				{
					binding: 0,
					resource: { buffer: buffer },
				},
				{
					binding: 1,
					resource: GPU.sampler,
				},
				{
					binding: 2,
					resource: this.buffer.texture.createView(),
				},
			],
		})
		renderPass.setBindGroup(0, group)
		renderPass.setVertexBuffer(0, this.buffer.vertices)
		renderPass.setVertexBuffer(1, this.buffer.uvs)
		renderPass.setVertexBuffer(2, this.buffer.normals)
		renderPass.draw(this.buffer.length)
	}

	SubShadow(
		projection: Matrix,
		view: Matrix,
		model: Matrix,
		renderPass: GPURenderPassEncoder,
	): void {
		const array = new Float32Array(16 * 3)
		projection.Save(array, 0)
		view.Save(array, 16)
		model.Save(array, 32)
		const pipeline = Textured.pipeline.shadow
		const buffer = GPU.CreateBuffer(array, GPUBufferUsage.UNIFORM)
		renderPass.setPipeline(pipeline)
		const group = GPU.device.createBindGroup({
			layout: pipeline.getBindGroupLayout(0),
			entries: [
				{
					binding: 0,
					resource: { buffer: buffer },
				},
			],
		})
		renderPass.setBindGroup(0, group)
		renderPass.setVertexBuffer(0, this.buffer.vertices)
		renderPass.draw(this.buffer.length)
	}
}
