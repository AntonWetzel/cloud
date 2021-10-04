import { Camera } from './camera.js'

export let adapter: GPUAdapter
export let device: GPUDevice

export const clearColor = { r: 0.0, g: 0.01, b: 0.05, a: 1.0 }
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
	adapter = (await window.navigator.gpu.requestAdapter()) as GPUAdapter
	device = (await adapter.requestDevice()) as GPUDevice

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
		size: Math.floor((data.byteLength + 3) / 4) * 4, //round to next size with %4 == 0,
		usage: GPUBufferUsage.COPY_DST | usage,
		mappedAtCreation: true,
	})
	new Uint8Array(buffer.getMappedRange()).set(new Uint8Array(data.buffer))
	buffer.unmap()
	return buffer
}

export function CreateEmptyBuffer(length: number, usage: GPUFlagsConstant): GPUBuffer {
	const buffer = device.createBuffer({
		size: length,
		usage: GPUBufferUsage.COPY_DST | usage,
		mappedAtCreation: false,
	})
	return buffer
}
