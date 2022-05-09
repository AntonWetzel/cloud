import * as GPU from './gpu/header.js'

export function Create(points: number): GPUBuffer {
	const colors = new Float32Array(points * 4)


	const box = document.getElementById('IndexColor') as HTMLInputElement

	if (box.checked) {
		for (let i = 0; i < points; i++) {
			const v = i / points
			if (v < 1/2) {
				colors[i * 4 + 0] = 1-v*2
				colors[i * 4 + 1] = v*2
				colors[i * 4 + 2] = 0-0
			} else {
				colors[i * 4 + 0] = 0
				colors[i * 4 + 1] = 1 - (v-1/2)*2
				colors[i * 4 + 2] = (v-1/2)*2
			}
		}
	} else {
		for (let i = 0; i < points; i++) {
			colors[i * 4 + 0] = 0.2
			colors[i * 4 + 1] = 0.3
			colors[i * 4 + 2] = 0.4
		}
	}
	return GPU.CreateBuffer(colors, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE)
}
