[[block]] struct Buffer {
	data: array<vec3<f32>>;
};

[[block]] struct Indices {
	data: array<u32>;
};

[[block]] struct Parameter {
	length: u32;
	new_length: u32;
	threshhold: f32;
};

[[group(0), binding(0)]] var<storage, read_write> parameter: Parameter;
[[group(0), binding(1)]] var<storage, read> cloud: Buffer;
[[group(0), binding(2)]] var<storage, read> color: Buffer;
[[group(0), binding(3)]] var<storage, read> distances: Buffer;
[[group(0), binding(4)]] var<storage, write> cloud_filter: Buffer;
[[group(0), binding(5)]] var<storage, write> color_filter: Buffer;

let MAX_DISTANCE = 340282346638528859811704183484516925440.0; //max value for f32 (i think)

[[stage(compute), workgroup_size(256)]]
fn main([[builtin(global_invocation_id)]] global : vec3<u32>) {
	let id = global.x;
	if (id >= parameter.length) {
		return;
	}

	if (abs(distances.data[id].x) < parameter.threshhold) {
		return;
	}
	var idx = 0u;
	for (var i = 0u; i < id; i = i + 1u) {
		if (abs(distances.data[i].x) >= parameter.threshhold) {
			idx = idx + 1u;
		}
	}
	cloud_filter.data[idx] = cloud.data[id];
	color_filter.data[idx] = color.data[id];

	for (var i = id + 1u; i < parameter.length; i = i + 1u) {
		if (abs(distances.data[i].x) >= parameter.threshhold) {
			return;
		}
	}
	parameter.new_length = idx;
}
