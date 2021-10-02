[[block]] struct Buffer {
	data: array<f32>;
};

[[block]] struct Parameter {
	length: u32;
	amount: f32;
};

let COUNT = 20u;
let MAX_DISTANCE = 340282346638528859811704183484516925440.0; //max value for f32 (i think)

[[group(0), binding(0)]] var<storage, read> parameter: Parameter;
[[group(0), binding(1)]] var<storage, read_write> cloud: Buffer;

[[stage(compute), workgroup_size(256)]]
fn main([[builtin(global_invocation_id)]] global : vec3<u32>) {
	if (global.x >= parameter.length) {
		return;
	}
	let id = global.x * 3u;


	var point = vec3<f32>(
		cloud.data[id + 0u],
		cloud.data[id + 1u],
		cloud.data[id + 2u]
	);

	var distances: array<f32, COUNT>;
	var maxDist = MAX_DISTANCE;
	var points: array<vec3<f32>, COUNT>;
	for (var i = 0u; i < COUNT; i = i + 1u) {
		let other = vec3<f32>(
			cloud.data[i * 3u + 0u],
			cloud.data[i * 3u + 1u],
			cloud.data[i * 3u + 2u]
		);
		distances[i] = distance(other, point);
		points[i] = other;
	}

	for (var i = COUNT; i < parameter.length; i = i + 1u) {
		if (i == global.x) {
			continue;
		}
		let other = vec3<f32>(
			cloud.data[i * 3u + 0u],
			cloud.data[i * 3u + 1u],
			cloud.data[i * 3u + 2u]
		);
		let dist = distance(other, point);
		if (dist < maxDist) {
			var max = 0u;
			var val = distances[0];
			for (var j = 1u; j < COUNT; j = j + 1u) {
				if (distances[j] > val) {
					max = j;
					val = distances[j];
				}
			}
			distances[max] = dist;
			points[max] = other;
			maxDist = distances[0];

			for (var j = 1u; j < COUNT; j = j + 1u) {
				if (distances[j] > maxDist) {
					maxDist = distances[j];
				}
			}
		}
	}

	var mean = vec3<f32>(0.0, 0.0, 0.0);
	for (var i = 0u; i < COUNT; i = i + 1u) {
		mean = mean + points[i];
	}
	mean = mean / f32(COUNT);
	cloud.data[id + 0u] = point.x * (1.0 - parameter.amount) + mean.x * parameter.amount;
	cloud.data[id + 1u] = point.y * (1.0 - parameter.amount) + mean.y * parameter.amount;
	cloud.data[id + 2u] = point.z * (1.0 - parameter.amount) + mean.z * parameter.amount;
}
