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
	let p = cloud.data[id];
	var last = cloud.data[nearest.data[offset]];
	var n = vec3<f32>(0.0, 0.0, 0.0);
	var i = 1u;
	for (
		/*none*/;
		nearest.data[offset + i] != id && i < parameter.k;
		i = i + 1u
	) {
		let current = cloud.data[nearest.data[offset + i]];
		n = n + cross(last - p, current - p);
		last = current;
	}

	colors.data[id] = normalize(abs(n));
}
