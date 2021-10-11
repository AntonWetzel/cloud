[[block]] struct Buffer {
	data: array<vec3<f32>>;
};

[[block]] struct Indices {
	data: array<u32>;
};

[[block]] struct Parameter {
	length: u32;
	k: u32;
};

[[group(0), binding(0)]] var<storage, read> parameter: Parameter;
[[group(0), binding(1)]] var<storage, read_write> cloud: Buffer;
[[group(0), binding(2)]] var<storage, read_write> nearest: Indices;

let PI = 3.1415926538;

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
fn center_from_ordered(a: vec3<f32>, b: vec3<f32>, c: vec3<f32>) -> vec3<f32> {
	let x = (a + c) * 0.5;
	let y = (a + b) * 0.5; 

	let ab = normalize(b - a);
	let ac = normalize(c - a);
	let n = cross(ab, ac); //normal of the plane all points exist on

	let xz = cross(ac, n); //right angle to normal to stay in 2D
	let yz = cross(n, ab);
	let xy = normalize(y - x);

	let alpha = acos(dot(xy, xz));
	let beta = PI - acos(dot(xy, yz)); //minus because xy is in the wrong direction

	//https://en.wikipedia.org/wiki/Law_of_sines
	let length = (distance(x, y) * sin(beta)) / sin(PI - (alpha + beta));
	let z = x + xz * length;

	return z;
}


fn center(a: vec3<f32>, b: vec3<f32>, c: vec3<f32>) -> vec3<f32> {
	let x = distance(a, b);
	let y = distance(a, c);
	let z = distance(b, c);
	if (x < y) {
		if (y < z) {
			return center_from_ordered(a, b, c);
		} else {
			return center_from_ordered(b, a, c);
		}
	}
	if (x < z) {
		return center_from_ordered(a, b, c);
	} 
	return center_from_ordered(c, a, b);
}
let MAX_K = 64u;

[[stage(compute), workgroup_size(256)]]
fn main([[builtin(global_invocation_id)]] global : vec3<u32>) {
	if (global.x >= parameter.length) {
		return;
	}
	let id = global.x;
	let offset = parameter.k * id;
	let point = cloud.data[id];
	var triang: array<bool, MAX_K>;
	for (var i = 0u; i < parameter.k; i = i + 1u) {
		triang[i] = false;
	}
	for (var i = 0u; i < parameter.k; i = i + 1u) {
		if (triang[i]) {
			continue;
		}
		for (var j = 0u; j < parameter.k; j = j + 1u) {
			if (i == j) {
				continue;
			}
			let c = center(
				point,
				cloud.data[nearest.data[offset + i]],
				cloud.data[nearest.data[offset + j]],
			);
			let d = distance(point, c);
			var empty = true;
			for (var x = 0u; x < parameter.k; x = x + 1u) {
				if (x == i || x == j) {
					continue;
				}
				if (distance(c, cloud.data[nearest.data[offset + x]]) < d) {
					empty = false;
					break;
				}
			}
			if (empty) {
				triang[i] = true;
				triang[j] = true;
				break;
			}
		}
	}
	for (var i = 0u; i < parameter.k; i = i + 1u) {
		if (!triang[i]) {
			nearest.data[offset + i] = id;
		}
	}
}
