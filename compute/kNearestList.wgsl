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

let MAX_DISTANCE = 340282346638528859811704183484516925440.0; //max value for f32 (i think)

[[group(0), binding(0)]] var<storage, read> parameter: Parameter;
[[group(0), binding(1)]] var<storage, read> cloud: Buffer;
[[group(0), binding(2)]] var<storage, read_write> nearest: Indices;

[[stage(compute), workgroup_size(256)]]
fn main([[builtin(global_invocation_id)]] global : vec3<u32>) {
	let id = global.x;
	if (id >= parameter.length) {
		return;
	}
	let offset = id * parameter.k;

	let point = cloud.data[id];
	var i = 0u;
	for (var count = 0u; count < parameter.k; i = i + 1u) { //init the k values with the first in cloud
		if (i == id) {
			continue;
		}
		let d = distance(point, cloud.data[i]);
		var idx = 0u;
		for (; idx < count; idx = idx + 1u) {
			if (distance(point, cloud.data[nearest.data[offset + idx] ]) < d) {
				break;
			}
		}
		for (var x = count; x > idx; x = x - 1u) {
			nearest.data[offset + x] = nearest.data[offset + x - 1u];
		}
		nearest.data[offset + idx] = i;
		count = count + 1u;
	}
	var dist = distance(point, cloud.data[nearest.data[offset] ]);
	for (; i < parameter.length; i = i + 1u) { //check the remaining points
		if (i == id) {
			continue;
		}
		let d = distance(point, cloud.data[i]);
		if (d < dist) {
			var idx = 0u;
			for (; idx < parameter.k - 1u; idx = idx + 1u) {
				if (distance(point, cloud.data[nearest.data[offset + idx + 1u] ]) < d) {
					break;
				}
				nearest.data[offset + idx] = nearest.data[offset + idx + 1u];
			}
			nearest.data[offset + idx] = i;
			dist = distance(point, cloud.data[nearest.data[offset] ]);
		}
	}
}
