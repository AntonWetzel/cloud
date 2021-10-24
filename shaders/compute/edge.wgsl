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
[[group(0), binding(1)]] var<storage, read> cloud: Buffer;
[[group(0), binding(2)]] var<storage, read> nearest: Indices;
[[group(0), binding(3)]] var<storage, write> colors: Buffer;

let PI = 3.1415926538;

[[stage(compute), workgroup_size(256)]]
fn main([[builtin(global_invocation_id)]] global : vec3<u32>) {
	let id = global.x;
	if (id >= parameter.length) {
		return;
	}
	let offset = global.x * parameter.k;
	var count = 0u;
	for (
		/*none*/;
		nearest.data[offset + count] != id && count < parameter.k;
		count = count + 1u
	) {} //get edge count (assumed packed list)
	let p = cloud.data[id];
	var sum = 0.0;
	for (var i = 0u; i < count; i = i + 1u) {
		let a = normalize(p - cloud.data[nearest.data[offset + i]]);
		for (var j = 0u; j < count; j = j + 1u) {
			if (i == j) {
				continue;
			}
			let n = cross(a, normalize(p - cloud.data[nearest.data[offset + j]]));
			for (var k = 0u; k < count; k = k + 1u) {
				if (i == k || j == k) {
					continue;
				}
				let ang = dot(n, normalize(p - cloud.data[nearest.data[offset + k]]));
				sum = sum + abs(ang);
			}
		}
	}
	colors.data[id] = vec3<f32>(1.0, 1.0, 1.0) * sum / f32(count * count * count) * 4.0;
	ignore(cloud);
}
