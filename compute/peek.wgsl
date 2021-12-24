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
[[group(0), binding(1)]] var<storage, read> nearest: Indices;
[[group(0), binding(2)]] var<storage, read> curvature: Buffer;
[[group(0), binding(3)]] var<storage, write> new_curvature: Buffer;

[[stage(compute), workgroup_size(256)]]
fn main([[builtin(global_invocation_id)]] global : vec3<u32>) {
	let id = global.x;
	if (id >= parameter.length) {
		return;
	}
	let offset = global.x * parameter.k;
	let t = curvature.data[id].x;
	var c = 0u;
	for (
		var count = 0u;
		nearest.data[offset + count] != id && count < parameter.k;
		count = count + 1u
	) {
		if (curvature.data[nearest.data[offset + count]].x > t) {
			c = c + 1u;
		}
	}
	if (c <= 2u) {
		new_curvature.data[id] = vec3<f32>(t, 0.0, 0.0);
	} else {
		new_curvature.data[id] = vec3<f32>(0.0, 0.0, 0.0);
	}
}
