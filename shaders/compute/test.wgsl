[[block]] struct Buffer {
	data: array<vec4<f32>>;
};

[[block]] struct Indices {
	data: array<u32>;
};

[[block]] struct Parameter {
	length: u32;

};

let MAX_K = 16u;
let MAX_DISTANCE = 340282346638528859811704183484516925440.0; //max value for f32 (i think)

[[group(0), binding(0)]] var<storage, read> parameter: Parameter;
[[group(0), binding(1)]] var<storage, read_write> cloud: Buffer;
[[group(0), binding(2)]] var<storage, write> nearest: Indices;

[[stage(compute), workgroup_size(256)]]
fn main([[builtin(global_invocation_id)]] global : vec3<u32>) {
	let id = global.x;
	if (id >= parameter.length) {
		return;
	}
	//get nearest
	let p = cloud.data[id];
	var dist = MAX_DISTANCE;
	var near: u32;
	for (var i = 0u; i < parameter.length; i = i + 1u) {
		if (i != id) {
			let d = distance(p, cloud.data[i]);
			if (d < dist) {
				dist = d;
				near = i;
			}
		}
	}
	let offset = id * MAX_K;
	nearest.data[offset] = near;
	
	for (var i = 1u; i < MAX_K; i = i + 1u) {
		nearest.data[offset + i] = id;
	}
}	
