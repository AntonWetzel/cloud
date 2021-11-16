[[block]] struct Buffer {
	data: array<vec3<f32>>;
};

[[block]] struct Indices {
	data: array<u32>;
};

[[block]] struct Parameter {
	length: u32;
};

[[group(0), binding(0)]] var<storage, read> parameter: Parameter;
[[group(0), binding(1)]] var<storage, read> cloud: Buffer;
[[group(0), binding(2)]] var<storage, write> cloud_sorted: Buffer;
[[group(0), binding(3)]] var<storage, write> colors: Buffer;


[[stage(compute), workgroup_size(256)]]
fn main([[builtin(global_invocation_id)]] global : vec3<u32>) {
	let id = global.x;
	if (id >= parameter.length) {
		return;
	}
	var p = cloud.data[id];
	var idx = 0u;

	for (var i = 0u; i < parameter.length; i = i + 1u) {
		let other = cloud.data[i];
		if (other.x < p.x || (other.x == p.x && i < id)) {
			idx = idx + 1u;
		}
	}
	cloud_sorted.data[idx] = p;
	colors.data[idx] = vec3<f32>(1.0, 1.0, 1.0) * f32(idx) / f32(parameter.length);
}
