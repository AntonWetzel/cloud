[[block]] struct Buffer {
	data: array<f32>;
};

[[block]] struct Parameter {
	length: u32;
	[[size(12)]] k: u32;
	[[size(16)]] color: vec3<f32>;
};

let MAX_K = 32;
let MAX_DISTANCE = 340282346638528859811704183484516925440.0;

[[group(0), binding(0)]] var<storage, read> parameter: Parameter;
[[group(0), binding(1)]] var<storage, read> cloud: Buffer;
[[group(0), binding(2)]] var<storage, write> lines: Buffer;
[[group(0), binding(3)]] var<storage, write> colors: Buffer;

[[stage(compute), workgroup_size(256)]]
fn main([[builtin(global_invocation_id)]] id : vec3<u32>) {
	if (id.x >= parameter.length) {
		return;
	}

	var distances: array<f32, MAX_K>;
	var maxDist = MAX_DISTANCE;
	var points: array<vec3<f32>, MAX_K>;
	for (var i = 0; i < MAX_K; i = i + 1) {
		distances[i] = MAX_DISTANCE;
	}

	var point = vec3<f32>(
		cloud.data[id.x * 3u + 0u],
		cloud.data[id.x * 3u + 1u],
		cloud.data[id.x * 3u + 2u]
	);

	for (var i = 0u; i < parameter.length; i = i + 1u) {
		if (i == id.x) {
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
			for (var j = 1u; j < parameter.k; j = j + 1u) {
				if (distances[j] > val) {
					max = j;
					val = distances[j];
				}
			}
			distances[max] = dist;
			points[max] = other;
			maxDist = distances[0];

			for (var j = 1u; j < parameter.k; j = j + 1u) {
				if (distances[j] > maxDist) {
					maxDist = distances[j];
				}
			}
		}
	}
	for (var c = 0u; c < parameter.k; c = c + 1u) {
		lines.data[id.x * 6u * parameter.k + c * 6u + 0u] = point.x;
		lines.data[id.x * 6u * parameter.k + c * 6u + 1u] = point.y;
		lines.data[id.x * 6u * parameter.k + c * 6u + 2u] = point.z;
		lines.data[id.x * 6u * parameter.k + c * 6u + 3u] = points[c].x;
		lines.data[id.x * 6u * parameter.k + c * 6u + 4u] = points[c].y;
		lines.data[id.x * 6u * parameter.k + c * 6u + 5u] = points[c].z;

		colors.data[id.x * 6u * parameter.k + c * 6u + 0u] = parameter.color.x;
		colors.data[id.x * 6u * parameter.k + c * 6u + 1u] = parameter.color.y;
		colors.data[id.x * 6u * parameter.k + c * 6u + 2u] = parameter.color.z;
		colors.data[id.x * 6u * parameter.k + c * 6u + 3u] = parameter.color.x;
		colors.data[id.x * 6u * parameter.k + c * 6u + 4u] = parameter.color.y;
		colors.data[id.x * 6u * parameter.k + c * 6u + 5u] = parameter.color.z;
	}
}
