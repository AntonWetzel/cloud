import { Node } from '../gpu/node.js'
import { Textured } from '../gpu/textured.js'
import { GetUserFile } from '../helper/file.js'
import * as Texture from '../gpu/texture.js'
import { Colored } from '../gpu/colored.js'

export async function CreateSphere(
	longituds: number,
	latitudes: number,
	r: number,
	g: number,
	b: number,
): Promise<{ node: Node; name: string }> {
	const vertices: number[] = []
	const colors: number[] = []
	const normals: number[] = []

	type Point = { x: number; y: number; z: number }

	function GetPoint(lat: number, long: number): Point {
		long = (long / longituds) * Math.PI
		lat = (lat / latitudes) * 2 * Math.PI

		const x = Math.sin(lat) * Math.sin(long)
		const y = Math.cos(long)
		const z = Math.cos(lat) * Math.sin(long)

		return { x: x, y: y, z: z }
	}

	function PushVertex(p: Point, n: Point, c: Point) {
		vertices.push(p.x, p.y, p.z)
		normals.push(n.x, n.y, n.z)
		colors.push(c.x, c.y, c.z)
	}

	function GetNormal(p0: Point, p1: Point, p2: Point, p3: Point): Point {
		let x = 0
		let y = 0
		let z = 0
		const arr = [p0, p1, p2, p3]
		for (let i = 0; i < 4; i++) {
			const p = arr[i]
			x += p.x
			y += p.y
			z += p.z
		}
		return { x: x, y: y, z: z }
	}

	const color = { x: r, y: g, z: b }
	for (let i = 0; i < latitudes; i++) {
		for (let j = 0; j < longituds; j++) {
			const p0 = GetPoint(i, j)
			const p1 = GetPoint(i, j + 1)
			const p2 = GetPoint(i + 1, j)
			const p3 = GetPoint(i + 1, j + 1)
			const n = GetNormal(p0, p1, p2, p3)
			PushVertex(p0, n, color)
			PushVertex(p1, n, color)
			PushVertex(p2, n, color)

			PushVertex(p2, n, color)
			PushVertex(p1, n, color)
			PushVertex(p3, n, color)
		}
	}

	return {
		node: new Colored(vertices, colors, normals),
		name: 'sphere',
	}
}
