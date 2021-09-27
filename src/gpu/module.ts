import * as GPU from './gpu.js'

export function New(src: string): GPUShaderModule {
	const module = GPU.device.createShaderModule({
		code: src,
	})
	return module
}
