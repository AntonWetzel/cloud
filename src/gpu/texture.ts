import * as GPU from './gpu.js'

export async function New(img: HTMLImageElement): Promise<GPUTexture> {
	await img.decode()
	const imageBitmap = await createImageBitmap(img)

	const texture = GPU.device.createTexture({
		size: [imageBitmap.width, imageBitmap.height, 1],
		format: GPU.format,
		usage:
			GPUTextureUsage.TEXTURE_BINDING |
			GPUTextureUsage.COPY_DST |
			GPUTextureUsage.RENDER_ATTACHMENT,
	})
	GPU.device.queue.copyExternalImageToTexture(
		{ source: imageBitmap },
		{ texture: texture },
		[imageBitmap.width, imageBitmap.height],
	)
	return texture
}
