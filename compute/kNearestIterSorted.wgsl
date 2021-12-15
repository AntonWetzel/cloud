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


fn get_index(id: u32, offset: u32) -> u32 {
	if (offset / 2u > id) {
		return offset;
	} elseif (id + (offset+1u) / 2u >= parameter.length) {
		return parameter.length - 1u - offset;
	}
	let sign = i32(offset % 2u * 2u) - 1;
	return u32(i32(id) + sign * i32(offset + 1u) / 2);
}

[[stage(compute), workgroup_size(256)]]
fn main([[builtin(global_invocation_id)]] global : vec3<u32>) {
	let id = global.x;
	if (id >= parameter.length) {
		return;
	}
	let offset = (id + 1u) * parameter.k - 1u;
	let p = cloud.data[id];
	var last = 0.0;
	for (var k = 0u; k < parameter.k; k = k + 1u) {
		var best: u32;
		var dist = MAX_DISTANCE;
		for (var i = 1u; i < parameter.length; i = i + 1u) {
			let idx = get_index(id, i);
			let other = cloud.data[idx];
			if (abs(p.x - other.x) > dist) {
				break;
			}
			var d = distance(p, other);
			if (last < d && d < dist) {
				best = idx;
				dist = d;
			}
		}
		nearest.data[offset - k] = best;
		last = dist;
	}
}
