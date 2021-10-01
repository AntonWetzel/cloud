[[block]] struct Buffer {
	data: array<f32>;
};

[[block]] struct Parameter {
	length: u32;
	threshhold: f32;
};

let COUNT = 20u;
let MAX_DISTANCE = 340282346638528859811704183484516925440.0; //max value for f32 (i think)

[[group(0), binding(0)]] var<storage, read> parameter: Parameter;
[[group(0), binding(1)]] var<storage, read> cloud: Buffer;
[[group(0), binding(2)]] var<storage, write> colors: Buffer;

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
	for (var i = 0u; i < COUNT; i = i + 1u) {
		points[i] = points[i] - mean;
	}

	var varianz = vec3<f32>(0.0001, 0.0001, 0.0001);
	for (var i = 0u; i < COUNT; i = i + 1u) {
		varianz = varianz + points[i] * points[i];
	}
	varianz = varianz / f32(COUNT);

	for (var i = 0u; i < COUNT; i = i + 1u) {
		points[i] = points[i] / varianz;
	}

	var kovar = mat3x3<f32>(
		vec3<f32>(0.0, 0.0, 0.0),
		vec3<f32>(0.0, 0.0, 0.0),
		vec3<f32>(0.0, 0.0, 0.0),
	);
	for (var i = 0u; i < COUNT; i = i + 1u) {
		kovar[0][0] = points[i].x * points[i].x;
		kovar[1][1] = points[i].y * points[i].y;
		kovar[2][2] = points[i].z * points[i].z;
		kovar[0][1] = points[i].x * points[i].y;
		kovar[0][2] = points[i].x * points[i].z;
		kovar[1][2] = points[i].y * points[i].z;
	}

	if (kovar[0][1] <= parameter.threshhold ||kovar[0][2] <= parameter.threshhold ||kovar[1][2] <= parameter.threshhold) {
		colors.data[id + 0u] = 0.2;
		colors.data[id + 1u] = 0.0;
		colors.data[id + 2u] = 0.0;
	} else {
		colors.data[id + 0u] = 0.0;
		colors.data[id + 1u] = 1.0;
		colors.data[id + 2u] = 0.0;
	}
}
