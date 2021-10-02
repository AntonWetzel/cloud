import { Cloud } from '../gpu/cloud.js'
import { Colored } from '../gpu/colored.js'
import { Node } from '../gpu/node.js'

export async function CreateCube(
	points: number,
	radius: number,
): Promise<{ node: Cloud; name: string }> {
	const vertices = new Float32Array(points * 4)
	const colors = new Float32Array(vertices.length)

	for (let i = 0; i < points; i++) {
		switch (Math.floor(Math.random() * 6)) {
			case 0:
				vertices[i * 4 + 0] = Math.random() * 2 - 1
				vertices[i * 4 + 1] = Math.random() * 2 - 1
				vertices[i * 4 + 2] = -1
				break
			case 1:
				vertices[i * 4 + 0] = Math.random() * 2 - 1
				vertices[i * 4 + 1] = Math.random() * 2 - 1
				vertices[i * 4 + 2] = 1
				break
			case 2:
				vertices[i * 4 + 0] = Math.random() * 2 - 1
				vertices[i * 4 + 1] = -1
				vertices[i * 4 + 2] = Math.random() * 2 - 1
				break
			case 3:
				vertices[i * 4 + 0] = Math.random() * 2 - 1
				vertices[i * 4 + 1] = 1
				vertices[i * 4 + 2] = Math.random() * 2 - 1
				break
			case 4:
				vertices[i * 4 + 0] = -1
				vertices[i * 4 + 1] = Math.random() * 2 - 1
				vertices[i * 4 + 2] = Math.random() * 2 - 1
				break
			case 5:
				vertices[i * 4 + 0] = 1
				vertices[i * 4 + 1] = Math.random() * 2 - 1
				vertices[i * 4 + 2] = Math.random() * 2 - 1
				break
		}

		vertices[i * 4 + 0] += 0.001 * Math.random()
		vertices[i * 4 + 1] += 0.001 * Math.random()
		vertices[i * 4 + 2] += 0.001 * Math.random()

		colors[i * 4 + 0] = 0.2 + 0.8 * Math.random()
		colors[i * 4 + 1] = 0.2 + 0.8 * Math.random()
		colors[i * 4 + 2] = 0.2 + 0.8 * Math.random()
	}

	return {
		node: new Cloud(vertices, colors, radius),
		name: 'cube',
	}
}
