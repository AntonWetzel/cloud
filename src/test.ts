import { Vector } from './gpu/math.js'

//https://math.stackexchange.com/a/2306029
function plane(points: Vector[]): Vector {
	const n = points.length

	const AtA = {
		a11: 0,
		a12: 0,
		a13: 0,
		a21: 0,
		a22: 0,
		a23: 0,
		a31: 0,
		a32: 0,
		a33: 0,
	}

	for (let i = 0; i < n; i++) {
		const p = points[i]
		AtA.a11 += p.x * p.x
		AtA.a12 += p.x * p.y
		AtA.a13 += p.x * 1.0
		AtA.a21 += p.y * p.x
		AtA.a22 += p.y * p.y
		AtA.a23 += p.y * 1.0
		AtA.a31 += 1.0 * p.x
		AtA.a32 += 1.0 * p.y
		AtA.a33 += 1.0 * 1.0
	}

	const det =
		AtA.a11 * AtA.a22 * AtA.a33 +
		AtA.a12 * AtA.a23 * AtA.a31 +
		AtA.a13 * AtA.a21 * AtA.a32 -
		AtA.a12 * AtA.a21 * AtA.a33 -
		AtA.a13 * AtA.a22 * AtA.a31 -
		AtA.a11 * AtA.a23 * AtA.a32

	const AtA1 = {
		a11: (AtA.a22 * AtA.a33 - AtA.a23 * AtA.a32) / det,
		a12: (AtA.a13 * AtA.a32 - AtA.a12 * AtA.a33) / det,
		a13: (AtA.a12 * AtA.a23 - AtA.a13 * AtA.a22) / det,
		a21: (AtA.a23 * AtA.a31 - AtA.a21 * AtA.a33) / det,
		a22: (AtA.a11 * AtA.a33 - AtA.a13 * AtA.a31) / det,
		a23: (AtA.a13 * AtA.a21 - AtA.a11 * AtA.a23) / det,
		a31: (AtA.a21 * AtA.a32 - AtA.a22 * AtA.a31) / det,
		a32: (AtA.a12 * AtA.a31 - AtA.a11 * AtA.a32) / det,
		a33: (AtA.a11 * AtA.a22 - AtA.a12 * AtA.a21) / det,
	}

	const AtB = { x: 0, y: 0, z: 0 }

	for (let i = 0; i < n; i++) {
		const p = points[i]
		AtB.x += p.x * p.z
		AtB.y += p.y * p.z
		AtB.z += 1.0 * p.z
	}

	const result = {
		x: AtA1.a11 * AtB.x + AtA1.a12 * AtB.y + AtA1.a13 * AtB.z,
		y: AtA1.a21 * AtB.x + AtA1.a22 * AtB.y + AtA1.a23 * AtB.z,
		z: AtA1.a31 * AtB.x + AtA1.a32 * AtB.y + AtA1.a33 * AtB.z,
	}

	return result
}

function dot(a: Vector, b: Vector): number {
	return a.x * b.x + a.y * b.y + a.z * b.z
}
function cross(a: Vector, b: Vector): Vector {
	return {
		x: a.y * b.z - a.z * b.y,
		y: a.z * b.x - a.x * b.z,
		z: a.x * b.y - a.y * b.x,
	}
}
function normalize(a: Vector): Vector {
	const l = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z)
	return {
		x: a.x / l,
		y: a.y / l,
		z: a.z / l,
	}
}
function sub(a: Vector, b: Vector) {
	return {
		x: a.x - b.x,
		y: a.y - b.y,
		z: a.z - b.z,
	}
}
const points = [
	{ x: 0, y: 1, z: 0 },
	{ x: 0, y: 1, z: 0 },
	{ x: 0.0001, y: 1.1, z: 1 },
]

const r = plane(points)
const q = { x: 0, y: 0, z: r.z }
const n = { x: r.x, y: r.y, z: 1.0 }
//const n = cross(normalize({ x: 1.0, y: 0.0, z: r.x }), normalize({ x: 0.0, y: 1.0, z: r.y }))

//const p = { x: 3, y: 3, z: -8 }
//const d = (p.z - r.z - r.x * p.x - r.y * p.y) / (r.x * n.x + r.y * n.y - n.z)

//console.log('plane', r)
console.log('n', n)
console.log('q', q)
//console.log('dist', d)

for (let i = 0; i < points.length; i++) {
	const p = points[i]
	console.log('point', i, ':', dot(n, sub(p, q)))
}
