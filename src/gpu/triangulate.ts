import { aspect, cameraBuffer, CreateBuffer, device, format, NewModule, renderPass } from './gpu.js'
import { Position } from './position.js'
import { sources } from './sources.js'

let pipeline: undefined | GPURenderPipeline = undefined

export const K = 16

export function Render(
	position: Position,
	positions: GPUBuffer,
	colors: GPUBuffer,
	nearest: GPUBuffer,
	k: number,
	length: number,
): void {
	if (pipeline == undefined) {
		const module = NewModule(sources['triangle'])
		pipeline = device.createRenderPipeline({
			vertex: {
				module:     module,
				entryPoint: 'vertexMain',
				buffers:    [],
			},
			fragment: {
				module:     module,
				entryPoint: 'fragmentMain',
				targets:    [
					{
						format: format,
					},
				],
			},
			depthStencil: {
				format:            'depth32float',
				depthWriteEnabled: true,
				depthCompare:      'less',
			},
			primitive: {
				topology: 'triangle-list',
			},
		})
	}
	const array = new Float32Array(16 + 1)
	position.Save(array, 0)
	new Uint32Array(array.buffer)[16] = k
	const buffer = CreateBuffer(array, GPUBufferUsage.UNIFORM)
	renderPass.setPipeline(pipeline)
	const group = device.createBindGroup({
		layout:  pipeline.getBindGroupLayout(0),
		entries: [
			{
				binding:  0,
				resource: { buffer: cameraBuffer },
			},
			{
				binding:  1,
				resource: { buffer: buffer },
			},
			{
				binding:  2,
				resource: { buffer: positions },
			},
			{
				binding:  3,
				resource: { buffer: colors },
			},
			{
				binding:  4,
				resource: { buffer: nearest },
			},
		],
	})
	renderPass.setBindGroup(0, group)
	renderPass.draw(length * k * 3)
}
