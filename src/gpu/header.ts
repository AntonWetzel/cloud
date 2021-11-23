import { Setup as SetupGPU } from './gpu.js'
import { Setup as SetupCompute } from './compute.js'
import { Setup as SetupSources } from './sources.js'

export { Resize, CreateBuffer, CreateEmptyBuffer, StartRender, FinishRender, ReadBuffer} from './gpu.js'
export { Position } from './position.js'
export { Camera } from './camera.js'
export { Render as Lines } from './lines.js'
export { Render as Cloud } from './cloud.js'
export { Render as KNearest } from './kNearest.js'
export { Render as Triangulate , K as TriangulateK } from './triangulate.js'
export { Compute } from './compute.js'

export async function Setup(width: number, height: number): Promise<HTMLCanvasElement| undefined> {
	const c = await SetupGPU(width, height)
	if (c == undefined) {
		return undefined
	}
	await SetupSources()
	await SetupCompute()
	return c
}
