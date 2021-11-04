import * as GPU from './gpu'
import * as Module from './module'

let computePipeline: undefined | GPUComputePipeline = undefined

export async function Compute(nearest: GPUBuffer, k: number, length: number): Promise<void> {
	if (computePipeline == undefined) {
		computePipeline = GPU.device.createComputePipeline({
			compute: {
				module:     Module.New(await (await fetch('compute/filter.wgsl')).text()),
				entryPoint: 'main',
			},
		})
	}
	const param = new Uint32Array([length, k])
	const buffer = GPU.CreateBuffer(param, GPUBufferUsage.STORAGE)
	const group = GPU.device.createBindGroup({
		layout:  computePipeline.getBindGroupLayout(0),
		entries: [
			{
				binding:  0,
				resource: { buffer: buffer },
			},
			{
				binding:  1,
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
}
