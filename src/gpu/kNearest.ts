import * as GPU from './gpu.js'
import * as Module from './module.js'
import { GetServerFile } from '../helper/file.js'
import { Position } from './position.js'
import { Matrix } from './math.js'
import { Camera } from './camera.js'

let computePipeline: undefined | GPUComputePipeline = undefined
let renderPipeline: undefined | GPURenderPipeline = undefined

export async function Compute(k: number, positions: GPUBuffer, length: number): Promise<GPUBuffer> {
	if (computePipeline == undefined) {
		computePipeline = GPU.device.createComputePipeline({
			compute: {
				module: Module.New(await GetServerFile('../shaders/compute/kNearest.wgsl')),
				entryPoint: 'main',
			},
		})
	}
	const nearest = GPU.CreateEmptyBuffer(
		length * 4 * k,
		GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
	)
	const param = new Uint32Array([length, k])
	const buffer = GPU.CreateBuffer(param, GPUBufferUsage.STORAGE)
	const group = GPU.device.createBindGroup({
		layout: computePipeline.getBindGroupLayout(0),
		entries: [
			{
				binding: 0,
				resource: { buffer: buffer },
			},
			{
				binding: 1,
				resource: { buffer: positions },
			},
			{
				binding: 3,
				resource: { buffer: nearest },
			},
		],
	})
	const encoder = GPU.device.createCommandEncoder()
	const compute = encoder.beginComputePass({})
	compute.setPipeline(computePipeline)
	compute.setBindGroup(0, group)
	compute.dispatch(Math.ceil(length / 256))
	compute.endPass()
	GPU.device.queue.submit([encoder.finish()])
	return nearest
}

export async function Render(
	position: Position,
	positions: GPUBuffer,
	colors: GPUBuffer,
	nearest: GPUBuffer,
	k: number,
	length: number,
): Promise<void> {
	if (renderPipeline == undefined) {
		const src = await GetServerFile('../shaders/render/kNearest.wgsl')
		const module = Module.New(src)
		renderPipeline = GPU.device.createRenderPipeline({
			vertex: {
				module: module,
				entryPoint: 'vertexMain',
				buffers: [],
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
				topology: 'line-list',
			},
		})
	}
	const array = new Float32Array(16 + 1)
	position.Save(array, 0)
	new Uint32Array(array.buffer)[16] = k
	const buffer = GPU.CreateBuffer(array, GPUBufferUsage.UNIFORM)
	GPU.renderPass.setPipeline(renderPipeline)
	const group = GPU.device.createBindGroup({
		layout: renderPipeline.getBindGroupLayout(0),
		entries: [
			{
				binding: 0,
				resource: { buffer: GPU.cameraBuffer },
			},
			{
				binding: 1,
				resource: { buffer: buffer },
			},
			{
				binding: 2,
				resource: { buffer: positions },
			},
			{
				binding: 3,
				resource: { buffer: colors },
			},
			{
				binding: 4,
				resource: { buffer: nearest },
			},
		],
	})
	GPU.renderPass.setBindGroup(0, group)
	GPU.renderPass.draw(length * k * 2)
}
