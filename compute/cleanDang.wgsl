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
	let id = global.x;
	if (id >= parameter.length) {
		return;
	}
	var target = 0u;
	var off = id * parameter.k;
	for (var i = 0u; i < parameter.k; i = i + 1u) {
		let idx = nearest.data[id * parameter.k + i];
		if (idx == id) {
			break;
		}
		let offset = idx * parameter.k;
		var connected = false;
		for (var j = 0u; j < parameter.k; j = j + 1u) {
			if (nearest.data[offset + j] == id) {
				connected = true;
				break;
			}
		}
		if (connected) {
			nearest.data[off + target] = idx;
			target = target + 1u;
		}
	}
	for (; target < parameter.k; target = target + 1u) {
		nearest.data[off + target] = id;
	}
}
