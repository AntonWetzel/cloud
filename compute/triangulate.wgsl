[[block]] struct Buffer {
	data: array<vec3<f32>>;
};

[[block]] struct Indices {
	data: array<u32>;
};

[[block]] struct Parameter {
	length: u32;
};

let MAX_K = 16u;
let MAX_DISTANCE = 340282346638528859811704183484516925440.0; //max value for f32 (i think)
let PI = 3.1415926538;


[[group(0), binding(0)]] var<storage, read> parameter: Parameter;
[[group(0), binding(1)]] var<storage, read> cloud: Buffer;
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
	
	var current = near;
	var last = near;
	var idx = 1u;
	var direction = vec3<f32>(0.0, 0.0, 0.0);
	var current_point = cloud.data[current];
	for (/*none*/; idx < MAX_K; idx = idx + 1u) {
		var next = parameter.length;
		var best = 0.0;

		let c_point = cloud.data[current];
		for (var i = 0u; i < parameter.length; i = i + 1u) {
			if (i == id || i == current) {
				continue;
			}
			//check if this point is further in the rotation
			let n_point = cloud.data[i];
			if (dot(p - n_point, direction) > 0.0) {
				continue;
			}
			//https://en.wikipedia.org/wiki/Law_of_sines
			let ab = normalize(p - n_point);
			let ac = normalize(current_point - n_point);
			let alpha = acos(dot(ab, ac));
			if (alpha > best) { //get "nearest" point with biggest alpha
				next = i;
				best = alpha;
			}
		}

		if (next == near) { //full circle
			break;
		}
		let n_point = cloud.data[next];
		if (next == parameter.length) { //not a valid next avaible (recover?)
			for (var i = 0u; i < idx; i = i + 1u) {
				nearest.data[offset + i] = id;
			}
			break;
		}
		direction = cross(cross(c_point - p, n_point - p), n_point - p);
		current_point = n_point;
		nearest.data[offset + idx] = next;
		last = current;
		current = next;
	}
	for (/*none*/; idx < MAX_K; idx = idx + 1u) {
		nearest.data[offset + idx] = id;
	}
}
