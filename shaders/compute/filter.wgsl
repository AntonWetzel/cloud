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
[[group(0), binding(1)]] var<storage, read_write> nearest: Indices;

let PI = 3.1415926538;

[[stage(compute), workgroup_size(256)]]
fn main([[builtin(global_invocation_id)]] global : vec3<u32>) {
	if (global.x >= parameter.length) {
		return;
	}
	let id = global.x;
	for (var i = 0u; i < parameter.k; i = i + 1u) {
		let offset = nearest.data[id * parameter.k + i] * parameter.k;
		var connected = false;
		for (var j = 0u; j < parameter.k; j = j + 1u) {
			if (nearest.data[offset + j] == id) {
				connected = true;
				break;
			}
		}
		if (!connected) {
			nearest.data[id * parameter.k + i] = id;
		}
	}
}
