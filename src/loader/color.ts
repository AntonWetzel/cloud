import * as GPU from '../gpu/gpu.js'

export function CreateColors(points: number): GPUBuffer {
	const colors = new Float32Array(points * 4)

	for (let i = 0; i < points; i++) {
		colors[i * 4 + 0] = 0.3 + 0.7 * Math.random()
		colors[i * 4 + 1] = 0.3 + 0.7 * Math.random()
		colors[i * 4 + 2] = 0.3 + 0.7 * Math.random()
	}

	return GPU.CreateBuffer(colors, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE)
}
