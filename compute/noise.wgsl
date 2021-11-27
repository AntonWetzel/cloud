[[block]] struct Buffer {
	data: array<vec3<f32>>;
};

[[block]] struct Indices {
	data: array<u32>;
};

[[block]] struct Parameter {
	length: u32;
	k: u32;
	amount :f32;
};

[[group(0), binding(0)]] var<storage, read> parameter: Parameter;
[[group(0), binding(1)]] var<storage, read> cloud: Buffer;
[[group(0), binding(2)]] var<storage, read> normals: Buffer;
[[group(0), binding(3)]] var<storage, read> distances: Buffer;
[[group(0), binding(4)]] var<storage, write> new_cloud: Buffer;


[[stage(compute), workgroup_size(256)]]
fn main([[builtin(global_invocation_id)]] global : vec3<u32>) {
	let id = global.x;
	if (id >= parameter.length) {
		return;
	}
	let point = cloud.data[id];
	new_cloud.data[id] = cloud.data[id] - distances.data[id].x * parameter.amount * normals.data[id];
}
