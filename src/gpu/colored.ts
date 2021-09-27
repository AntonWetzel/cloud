import * as GPU from './gpu.js'
import * as Module from './module.js'
import { Matrix } from './math.js'
import { Node } from './node.js'
import { GetServerFile } from '../helper/file.js'

export class Colored extends Node {
	private static pipeline: {
		normal: GPURenderPipeline
		shadow: GPURenderPipeline
		map: GPURenderPipeline
	}

	static async Setup(): Promise<void> {
		const module = {
			normal: Module.New(await GetServerFile('../shaders/colored.wgsl')),
			shadow: Module.New(await GetServerFile('../shaders/shadow.wgsl')),
			map: Module.New(await GetServerFile('../shaders/map.wgsl')),
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
		Colored.pipeline = {
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
			map: GPU.device.createRenderPipeline({
				vertex: {
					module: module.map,
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
					module: module.map,
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
		const pipeline = Colored.pipeline.normal
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
					resource: { buffer: lights },
				},
				{
					binding: 2,
					resource: GPU.global.sampler,
				},
				{
					binding: 3,
					resource: GPU.global.shadows.createView({
						dimension: '2d-array',
					}),
				},
			],
		})
		renderPass.setBindGroup(0, group)
		renderPass.setVertexBuffer(0, this.buffer.vertices)
		renderPass.setVertexBuffer(1, this.buffer.colors)
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
		const pipeline = Colored.pipeline.shadow
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

	SubMap(
		view: Matrix,
		model: Matrix,
		renderPass: GPURenderPassEncoder,
	): void {
		const array = new Float32Array(16 * 2)
		view.Save(array, 0)
		model.Save(array, 16)
		const pipeline = Colored.pipeline.map
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
