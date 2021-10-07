import { Vector } from './gpu/math.js'

export function Center(a: Vector, b: Vector, c: Vector): Vector {
	const x = Length(Sub(a, b))
	const y = Length(Sub(a, c))
	const z = Length(Sub(b, c))
	if (x < y) {
		if (y < z) {
			return CenterSub(a, b, c)
		} else {
			return CenterSub(b, a, c)
		}
	} else {
		if (x < y) {
			return CenterSub(a, b, c)
		} else {
			return CenterSub(c, a, b)
		}
	}
}
/*
	assume a is opposite the longest side
	a, b, c, x, y, z are in the same plane with the normal n

	                   z <- equidistant from a, b and c
	                  / \
	                 /   \
                    /     \
   n     length -> /       \               n
   |              /         \              |
   c-------------/           \-------------b
	'-.         /             \         .-'
	   '-.     /---.       .---\     .-'
		  '-. /alpha|     | beta\ .-'
			 x-------------------y
			  '-.      n      .-'
			     '-.   |   .-'
				    '-.a.-'
*/
function CenterSub(a: Vector, b: Vector, c: Vector): Vector {
	const x = Mult(Add(a, c), 0.5)
	const y = Mult(Add(a, b), 0.5)

	const ab = Normalize(Sub(b, a))
	const ac = Normalize(Sub(c, a))
	const n = Cross(ab, ac) //normal of the plane with all 3 points

	const xz = Cross(ac, n) //right angle to normal to stay in 2D
	const yz = Cross(n, ab)
	const xy = Normalize(Sub(y, x))

	const alpha = Math.acos(Dot(xy, xz))
	const beta = Math.PI - Math.acos(Dot(xy, yz)) //minus because xy ist wrong direction

	//https://en.wikipedia.org/wiki/Law_of_sines
	const length = (Length(Sub(x, y)) * Math.sin(beta)) / Math.sin(Math.PI - (alpha + beta))
	const z = Add(x, Mult(xz, length))

	//check if it is the center, currently not perfect, no clue if it is a error or precision
	//console.log(Length(Sub(a, z)), Length(Sub(b, z)), Length(Sub(c, z)))
	return z
}

function Normalize(x: Vector): Vector {
	const l = Length(x)
	return {
		x: x.x / l,
		y: x.y / l,
		z: x.z / l,
	}
}

function Dot(x: Vector, y: Vector): number {
	return x.x * y.x + x.y * y.y + x.z * y.z
}

function Length(x: Vector): number {
	return Math.sqrt(x.x * x.x + x.y * x.y + x.z * x.z)
}

function Cross(x: Vector, y: Vector): Vector {
	return {
		x: x.y * y.z - x.z * y.y,
		y: x.z * y.x - x.x * y.z,
		z: x.x * y.y - x.y * y.x,
	}
}

function Add(x: Vector, y: Vector): Vector {
	return {
		x: x.x + y.x,
		y: x.y + y.y,
		z: x.z + y.z,
	}
}

function Sub(x: Vector, y: Vector): Vector {
	return {
		x: x.x - y.x,
		y: x.y - y.y,
		z: x.z - y.z,
	}
}
function Mult(x: Vector, a: number): Vector {
	return {
		x: x.x * a,
		y: x.y * a,
		z: x.z * a,
	}
}
