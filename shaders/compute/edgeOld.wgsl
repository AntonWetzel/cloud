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

[[group(0), binding(0)]] var<storage, read> parameter: Parameter;
[[group(0), binding(1)]] var<storage, read> cloud: Buffer;
[[group(0), binding(2)]] var<storage, read> nearest: Indices;
[[group(0), binding(3)]] var<storage, write> colors: Buffer;

let PI = 3.1415926538;

[[stage(compute), workgroup_size(256)]]
fn main([[builtin(global_invocation_id)]] global : vec3<u32>) {
	let id = global.x;
	if (id >= parameter.length) {
		return;
	}
	let offset = global.x * parameter.k;
	var count = 0u;
	for (
		/*none*/;
		nearest.data[offset + count] != id && count < parameter.k;
		count = count + 1u
	) {} //get edge count (assumed packed list)

	var AtA = mat3x3<f32>(
		vec3<f32>(0.0, 0.0, 0.0),
		vec3<f32>(0.0, 0.0, 0.0),
		vec3<f32>(0.0, 0.0, 0.0)	
	);


	for (var i = 0u; i < count; i = i + 1u) {
		let p = cloud.data[nearest.data[offset + i]];
		AtA[0][0] = AtA[0][0] +  p.x * p.x;
		AtA[0][1] = AtA[0][1] +  p.x * p.y;
		AtA[0][2] = AtA[0][2] +  p.x * 1.0;
		AtA[1][0] = AtA[1][0] +  p.y * p.x;
		AtA[1][1] = AtA[1][1] +  p.y * p.y;
		AtA[1][2] = AtA[1][2] +  p.y * 1.0;
		AtA[2][0] = AtA[2][0] +  1.0 * p.x;
		AtA[2][1] = AtA[2][1] +  1.0 * p.y;
		AtA[2][2] = AtA[2][2] +  1.0 * 1.0;
	}
	let det = determinant(AtA);
	
	let AtA1 = mat3x3<f32>(
		vec3<f32>(
			(AtA[1][1] * AtA[2][2] - AtA[1][2] * AtA[2][1]) / det,
			(AtA[0][2] * AtA[2][1] - AtA[0][1] * AtA[2][2]) / det,
			(AtA[0][1] * AtA[1][2] - AtA[0][2] * AtA[1][1]) / det
		),
		vec3<f32>(
			(AtA[1][2] * AtA[2][0] - AtA[1][0] * AtA[2][2]) / det,
			(AtA[0][0] * AtA[2][2] - AtA[0][2] * AtA[2][0]) / det,
			(AtA[0][2] * AtA[1][0] - AtA[0][0] * AtA[1][2]) / det
		),
		vec3<f32>(
			(AtA[1][0] * AtA[2][1] - AtA[1][1] * AtA[2][0]) / det,
			(AtA[0][1] * AtA[2][0] - AtA[0][0] * AtA[2][1]) / det,
			(AtA[0][0] * AtA[1][1] - AtA[0][1] * AtA[1][0]) / det
		)
	);

	var AtB = vec3<f32>(0.0, 0.0, 0.0);
	var avg_distance = 0.0;
	let point = cloud.data[id];


	for (var i = 0u; i < count; i = i + 1u) {
		let p = cloud.data[nearest.data[offset + i]];
		AtB.x = AtB.x + p.x * p.z;
		AtB.y = AtB.y + p.y * p.z;
		AtB.z = AtB.z + 1.0 * p.z;

		avg_distance = distance(point, p);
	}

	avg_distance = avg_distance / f32(count);

	// A*x + B*y + C = z
	let plane = AtA1 * AtB;
	
	let n = cross(
		normalize(vec3<f32>(1.0, 0.0, plane.x)),
		normalize(vec3<f32>(0.0, 1.0, plane.y)),
	);

	//let d = (point.z - plane.z - plane.x * point.x - plane.y * point.y) / (plane.x * n.x + plane.y * n.y - n.z);

	//colors.data[id] = vec3<f32>(abs(n.x), 0.0, 0.0);
	//colors.data[id] = vec3<f32>(0.0, abs(n.y), 0.0);
	//colors.data[id] = vec3<f32>(0.0, 0.0, abs(n.z));
	colors.data[id] = n;
}
