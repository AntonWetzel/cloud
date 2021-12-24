[[block]] struct Buffer {
	data: array<vec3<f32>>;
};

[[block]] struct Indices {
	data: array<u32>;
};

[[block]] struct Parameter {
	length: u32;
	k: u32;
	weight: f32;
};

[[group(0), binding(0)]] var<storage, read> parameter: Parameter;
[[group(0), binding(1)]] var<storage, read> nearest: Indices;
[[group(0), binding(2)]] var<storage, read> curvature: Buffer;
[[group(0), binding(3)]] var<storage, write> derivative: Buffer;

[[stage(compute), workgroup_size(256)]]
fn main([[builtin(global_invocation_id)]] global : vec3<u32>) {
	let id = global.x;
	if (id >= parameter.length) {
		return;
	}
	let offset = global.x * parameter.k;
	var sum = curvature.data[id].x * parameter.weight;
	var count = 0u;
	for (
		;
		nearest.data[offset + count] != id && count < parameter.k;
		count = count + 1u
	) {
		sum = sum + curvature.data[nearest.data[offset + count]].x;
	}
	derivative.data[id] = vec3<f32>(sum / (f32(count) + parameter.weight), 0.0, 0.0);
}
