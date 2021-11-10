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
	let p = cloud.data[id];
	var last = cloud.data[nearest.data[offset]];
	var n = vec3<f32>(0.0, 0.0, 0.0);
	var count = 1u;
	for (
		/*none*/;
		nearest.data[offset + count] != id && count < parameter.k;
		count = count + 1u
	) {
		let current = cloud.data[nearest.data[offset + count]];
		n = n + cross(last - p, current - p);
		last = current;
	}
	n = normalize(n);

	var off = 0.0;
	for (var i = 0u; i < count; i = i + 1u) {
		let diff = p - cloud.data[nearest.data[offset + i]];
		let l = dot(normalize(diff), n) * length(diff);
		off = off + l;
	}
	off = off / f32(count);

	colors.data[id] = vec3<f32>(1.0, 1.0, 1.0) * abs(off) * 100.0;
	//colors.data[id] = abs(n);
	//cloud.data[id] = p - n * off;
}
