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
	let offset = (id + 1u) * parameter.k - 1u;
	let p = cloud.data[id];
	var last = 0.0;
	for (var k = 0u; k < parameter.k; k = k + 1u) {
		var best: u32;
		var dist = MAX_DISTANCE;
		for (var i = id - 1u; i < parameter.length; i = i - 1u) { //(i >= 0) == (i < parameter.length) because overflow 
			var other = cloud.data[i];
			if (abs(p.x - other.x) > dist) {
				break;
			}
			var d = distance(p, cloud.data[i]);
			if (last < d && d < dist) {
				best = i;
				dist = d;
			}
		}
		for (var i = id + 1u; i < parameter.length; i = i + 1u) {
			var other = cloud.data[i];
			if (other.x - p.x > dist) {
				break;
			}
			var d = distance(p, cloud.data[i]);
			if (last < d && d < dist) {
				best = i;
				dist = d;
			}
		}
		nearest.data[offset - k] = best;
		last = dist;
	}
}
