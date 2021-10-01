import { Cloud } from '../gpu/cloud.js'
import { Colored } from '../gpu/colored.js'
import { Node } from '../gpu/node.js'

export async function CreateCube(
	points: number,
	radius: number,
): Promise<{ node: Cloud; name: string }> {
	const vertices = new Float32Array(points * 3)
	const colors = new Float32Array(vertices.length)

	for (let i = 0; i < points; i++) {
		switch (Math.floor(Math.random() * 6)) {
			case 0:
				vertices[i * 3 + 0] = Math.random() * 2 - 1
				vertices[i * 3 + 1] = Math.random() * 2 - 1
				vertices[i * 3 + 2] = -1
				break
			case 1:
				vertices[i * 3 + 0] = Math.random() * 2 - 1
				vertices[i * 3 + 1] = Math.random() * 2 - 1
				vertices[i * 3 + 2] = 1
				break
			case 2:
				vertices[i * 3 + 0] = Math.random() * 2 - 1
				vertices[i * 3 + 1] = -1
				vertices[i * 3 + 2] = Math.random() * 2 - 1
				break
			case 3:
				vertices[i * 3 + 0] = Math.random() * 2 - 1
				vertices[i * 3 + 1] = 1
				vertices[i * 3 + 2] = Math.random() * 2 - 1
				break
			case 4:
				vertices[i * 3 + 0] = -1
				vertices[i * 3 + 1] = Math.random() * 2 - 1
				vertices[i * 3 + 2] = Math.random() * 2 - 1
				break
			case 5:
				vertices[i * 3 + 0] = 1
				vertices[i * 3 + 1] = Math.random() * 2 - 1
				vertices[i * 3 + 2] = Math.random() * 2 - 1
				break
		}

		vertices[i * 3 + 0] += 0.0001 * Math.random()
		vertices[i * 3 + 1] += 0.0001 * Math.random()
		vertices[i * 3 + 2] += 0.0001 * Math.random()

		colors[i * 3 + 0] = 0.2 + 0.8 * Math.random()
		colors[i * 3 + 1] = 0.2 + 0.8 * Math.random()
		colors[i * 3 + 2] = 0.2 + 0.8 * Math.random()
	}

	return {
		node: new Cloud(vertices, colors, radius),
		name: 'cube',
	}
}
