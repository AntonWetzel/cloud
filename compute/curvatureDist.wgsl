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
[[group(0), binding(3)]] var<storage, read_write> colors: Buffer;

let PI = 3.1415926538;

[[stage(compute), workgroup_size(256)]]
fn main([[builtin(global_invocation_id)]] global : vec3<u32>) {
	let id = global.x;
	if (id >= parameter.length) {
		return;
	}
	let offset =id * parameter.k;
	let p = cloud.data[id];
	let n = colors.data[id];
	var off = 0.0;
	var i = 0u;
	for (; i < parameter.k; i = i + 1u) {
		let idx = nearest.data[offset + i];
		if (idx == id) {
			break;
		}
		let diff = p - cloud.data[idx];
		let l = dot(normalize(diff), n) * length(diff);
		off = off + l;
	}
	off = off / f32(i);

	colors.data[id] = vec3<f32>(1.0, 1.0, 1.0) * abs(off) * 100.0;
}
