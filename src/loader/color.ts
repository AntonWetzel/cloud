import { Position } from '../gpu/position.js'
import { GetUserFile } from '../helper/file.js'
import { Cloud } from '../gpu/cloud.js'
import * as GPU from '../gpu/gpu.js'

export function CreateColors(points: number): GPUBuffer {
	const colors = new Float32Array(points * 4)

	for (let i = 0; i < points; i++) {
		colors[i * 4 + 0] = Math.random()
		colors[i * 4 + 1] = Math.random()
		colors[i * 4 + 2] = Math.random()
	}

	return GPU.CreateBuffer(colors, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE)
}
