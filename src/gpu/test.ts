import * as GPU from './gpu.js'
import * as Module from './module.js'
import { GetServerFile } from '../helper/file.js'
import { Position } from './position.js'
import { Matrix } from './math.js'
import { Camera } from './camera.js'

let computePipeline: undefined | GPUComputePipeline = undefined

export const K = 16

export async function Compute(positions: GPUBuffer, length: number): Promise<GPUBuffer> {
	if (computePipeline == undefined) {
		computePipeline = GPU.device.createComputePipeline({
			compute: {
				module: Module.New(await GetServerFile('../shaders/compute/test.wgsl')),
				entryPoint: 'main',
			},
		})
	}
	const nearest = GPU.CreateEmptyBuffer(
		length * 4 * K,
		GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
	)
	const param = new Uint32Array([length])
	const buffer = GPU.CreateBuffer(param, GPUBufferUsage.STORAGE)

	const encoder = GPU.device.createCommandEncoder()

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
				binding: 2,
				resource: { buffer: nearest },
			},
		],
	})
	const compute = encoder.beginComputePass()
	compute.setPipeline(computePipeline)
	compute.setBindGroup(0, group)
	compute.dispatch(Math.ceil(length / 256))
	compute.endPass()

	GPU.device.queue.submit([encoder.finish()])
	return nearest
}
