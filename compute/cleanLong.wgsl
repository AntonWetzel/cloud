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
[[group(0), binding(2)]] var<storage, read_write> nearest: Indices;

let PI = 3.1415926538;

[[stage(compute), workgroup_size(256)]]
fn main([[builtin(global_invocation_id)]] global : vec3<u32>) {
	if (global.x >= parameter.length) {
		return;
	}
	let id = global.x;
	var p = cloud.data[id];
	var avg = 0.0;
	var count = 0u;
	for (; count < parameter.k; count = count + 1u) {
		let o = nearest.data[id*parameter.k + count];
		if (o == id) {
			break;
		}
		avg = avg + distance(p, cloud.data[o]);
	}
	avg = avg / f32(count) * 3.0;

	var idx = 0u;
	for (var i = 0u; i < count; i = i + 1u) {
		let o = nearest.data[id*parameter.k + i];
		if (distance(p, cloud.data[o]) <= avg) {
			nearest.data[id*parameter.k + idx] = o;
			idx = idx + 1u;
		}
	}
}
