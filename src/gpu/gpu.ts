import { Camera } from './camera'

export let adapter: GPUAdapter
export let device: GPUDevice

export const clearColor = { r: 0.0, g: 0.1, b: 0.2, a: 1.0 }
export let format: GPUTextureFormat
export let sampler: GPUSampler

export let canvas: HTMLCanvasElement
export let context: GPUCanvasContext

export let global: {
	aspect: number
}

export let depth: GPUTexture

export async function Setup(width: number, height: number): Promise<HTMLCanvasElement | undefined> {
	if (window.navigator.gpu == undefined) {
		return undefined
	}
	adapter = (await window.navigator.gpu.requestAdapter({
		powerPreference: 'high-performance',
	})) as GPUAdapter
	device = (await adapter.requestDevice()) as GPUDevice
	device.lost.then((info) => {
		console.log(info)
	})

	canvas = document.createElement('canvas')
	context = canvas.getContext('webgpu') as GPUCanvasContext

	format = context.getPreferredFormat(adapter)

	global = {
		aspect: undefined as any,
	}

	sampler = device.createSampler({
		magFilter: 'linear',
		minFilter: 'linear',
	})

	Resize(width, height)

	return canvas
}

export function Resize(width: number, height: number): void {
	context.configure({
		device: device,
		format: format,
		size: { width: width, height: height },
	})
	canvas.width = width
	canvas.height = height

	depth = device.createTexture({
		size: {
			width: canvas.width,
			height: canvas.height,
		},
		format: 'depth32float',
		usage: GPUTextureUsage.RENDER_ATTACHMENT,
	})
	global.aspect = canvas.width / canvas.height
}

export let cameraBuffer: GPUBuffer
export let renderPass: GPURenderPassEncoder
let encoder: GPUCommandEncoder

export function StartRender(camera: Camera): void {
	encoder = device.createCommandEncoder()
	renderPass = encoder.beginRenderPass({
		colorAttachments: [
			{
				loadValue: clearColor,
				storeOp: 'store',
				view: context.getCurrentTexture().createView(),
			},
		],
		depthStencilAttachment: {
			depthLoadValue: 1.0,
			depthStoreOp: 'store',
			stencilLoadValue: 0,
			stencilStoreOp: 'store',
			view: depth.createView(),
		},
	})
	cameraBuffer = camera.Buffer()
}

export function FinishRender(): void {
	renderPass.endPass()
	device.queue.submit([encoder.finish()])
}

export function CreateBuffer(data: Float32Array | Uint32Array, usage: GPUFlagsConstant): GPUBuffer {
	const buffer = device.createBuffer({
		size: data.byteLength,
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | usage,
		mappedAtCreation: true,
	})
	new Uint8Array(buffer.getMappedRange()).set(new Uint8Array(data.buffer))
	buffer.unmap()
	return buffer
}

export function CreateEmptyBuffer(length: number, usage: GPUFlagsConstant): GPUBuffer {
	const buffer = device.createBuffer({
		size: length,
		usage: usage,
		mappedAtCreation: false,
	})
	return buffer
}
export async function ReadBuffer(buffer: GPUBuffer, size: number): Promise<ArrayBuffer> {
	const temp = CreateEmptyBuffer(size, GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST)
	// Encode commands for copying buffer to buffer.
	const copyEncoder = device.createCommandEncoder()
	copyEncoder.copyBufferToBuffer(
		buffer /* source buffer */,
		0 /* source offset */,
		temp /* destination buffer */,
		0 /* destination offset */,
		size /* size */,
	)
	const copyCommands = copyEncoder.finish()
	device.queue.submit([copyCommands])
	await temp.mapAsync(GPUMapMode.READ)
	const copyArrayBuffer = temp.getMappedRange()
	return copyArrayBuffer
}
