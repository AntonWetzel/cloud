import { CreateBuffer, device, NewModule, ReadBuffer } from './gpu.js'

const pipelines =  {
	filterDang:         undefined as GPUComputePipeline,
	filterDist:         undefined as GPUComputePipeline,
	kNearestList:       undefined as GPUComputePipeline,
	kNearestIter:       undefined as GPUComputePipeline,
	normalLinear:       undefined as GPUComputePipeline,
	normalTriang:       undefined as GPUComputePipeline,
	curvatureDist:      undefined as GPUComputePipeline,
	curvatureAngle:     undefined as GPUComputePipeline,
	triangulateAll:     undefined as GPUComputePipeline,
	triangulateNearest: undefined as GPUComputePipeline,
	reduceP1:           undefined as GPUComputePipeline,
	reduceP2:           undefined as GPUComputePipeline,
	sort:               undefined as GPUComputePipeline,
	kNearestSorted:     undefined as GPUComputePipeline,
}

export async function Setup() {
	for (const name in pipelines) {
		pipelines[name] = device.createComputePipeline({
			compute: {
				module:     NewModule(await (await fetch('./compute/'+name+'.wgsl')).text()),
				entryPoint: 'main',
			},
		})
	}
}

export function Compute(
	name: keyof typeof pipelines,
	length: number,
	parameter: number[],
	buffers: GPUBuffer[],
	result = false,
): GPUBuffer | undefined {
	const paramU32 = new Uint32Array(parameter.length+1)
	paramU32[0] = length
	for (let i = 0; i < parameter.length; i++) {
		paramU32[i+1] = parameter[i]
	}
	const buffer = CreateBuffer(paramU32, GPUBufferUsage.STORAGE)
	const x: GPUBindGroupEntry[] = []
	x.push({
		binding:  0,
		resource: { buffer: buffer },
	})
	for (let i = 0; i < buffers.length; i++) {
		x.push({
			binding:  i+1,
			resource: {buffer: buffers[i]}
		})
	}
	const pipeline = pipelines[name]
	const group = device.createBindGroup({
		layout:  pipeline.getBindGroupLayout(0),
		entries: x,
	})
	const encoder = device.createCommandEncoder({
		measureExecutionTime: true
	})
	const compute = encoder.beginComputePass({})
	compute.setPipeline(pipeline)
	compute.setBindGroup(0, group)
	compute.dispatch(Math.ceil(length / 256))
	compute.endPass()
	const commands = encoder.finish()
	device.queue.submit([commands])
	if (result) {
		return buffer
	} else {
		buffer.destroy()
		return undefined
	}
}
