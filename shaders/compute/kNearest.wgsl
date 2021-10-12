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

let MAX_K = 64u;
let MAX_DISTANCE = 340282346638528859811704183484516925440.0; //max value for f32 (i think)

[[group(0), binding(0)]] var<storage, read> parameter: Parameter;
[[group(0), binding(1)]] var<storage, read> cloud: Buffer;
[[group(0), binding(3)]] var<storage, write> nearest: Indices;

[[stage(compute), workgroup_size(256)]]
fn main([[builtin(global_invocation_id)]] global : vec3<u32>) {
	if (global.x >= parameter.length) {
		return;
	}
	let id = global.x;

	var point = cloud.data[id];
	var distances: array<f32, MAX_K>;
	var indices: array<u32, MAX_K>;

	var maxDist = MAX_DISTANCE;
	for (var i = 0u; i < parameter.k; i = i + 1u) {
		distances[i] = MAX_DISTANCE;
	}

	for (var i = 0u; i < parameter.length; i = i + 1u) {
		if (i == id) {
			continue;
		}
		let other = cloud.data[i];
		let dist = distance(other, point);
		if (dist < maxDist) {
			var max = 0u;
			var val = distances[0];
			for (var j = 1u; j < parameter.k; j = j + 1u) {
				if (distances[j] > val) {
					max = j;
					val = distances[j];
				}
			}
			distances[max] = dist;
			indices[max] = i;

			maxDist = distances[0];
			for (var j = 1u; j < parameter.k; j = j + 1u) {
				if (distances[j] > maxDist) {
					maxDist = distances[j];
				}
			}
		}
	}

	for (var c = 0u; c < parameter.k; c = c + 1u) {
		nearest.data[id * parameter.k + c] = indices[c];
	}
}	
