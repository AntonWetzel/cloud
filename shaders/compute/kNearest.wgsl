[[block]] struct Buffer {
	data: array<f32>;
};

[[block]] struct Parameter {
	length: u32;
	k: u32;
};

let MAX_K = 32u;
let MAX_DISTANCE = 340282346638528859811704183484516925440.0; //max value for f32 (i think)

[[group(0), binding(0)]] var<storage, read> parameter: Parameter;
[[group(0), binding(1)]] var<storage, read> cloud: Buffer;
[[group(0), binding(2)]] var<storage, read> cloudColors: Buffer;
[[group(0), binding(3)]] var<storage, write> lines: Buffer;
[[group(0), binding(4)]] var<storage, write> colors: Buffer;

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

	var distances: array<f32, MAX_K>;
	var maxDist = MAX_DISTANCE;
	var points: array<vec3<f32>, MAX_K>;
	for (var i = 0u; i < parameter.k; i = i + 1u) {
		let other = vec3<f32>(
			cloud.data[i * 3u + 0u],
			cloud.data[i * 3u + 1u],
			cloud.data[i * 3u + 2u]
		);
		distances[i] = distance(other, point);
		points[i] = other;
	}


	for (var i = parameter.k; i < parameter.length; i = i + 1u) {
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
		let offset = (id * parameter.k + c * 3u) * 2u;
		lines.data[offset + 0u] = point.x;
		lines.data[offset + 1u] = point.y;
		lines.data[offset + 2u] = point.z;
		lines.data[offset + 3u] = (point.x + points[c].x) / 2.0;
		lines.data[offset + 4u] = (point.y + points[c].y) / 2.0;
		lines.data[offset + 5u] = (point.z + points[c].z) / 2.0;

		colors.data[offset + 0u] = cloudColors.data[id + 0u];
		colors.data[offset + 1u] = cloudColors.data[id + 1u];
		colors.data[offset + 2u] = cloudColors.data[id + 2u];
		colors.data[offset + 3u] = cloudColors.data[id + 0u];
		colors.data[offset + 4u] = cloudColors.data[id + 1u];
		colors.data[offset + 5u] = cloudColors.data[id + 2u];
	}
}
