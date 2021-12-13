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

fn inverse(m: mat3x3<f32>) -> mat3x3<f32> {
	let det = determinant(m);
	return mat3x3<f32>(
		vec3<f32>(
			(m[1][1] * m[2][2] - m[1][2] * m[2][1]) / det,
			(m[0][2] * m[2][1] - m[0][1] * m[2][2]) / det,
			(m[0][1] * m[1][2] - m[0][2] * m[1][1]) / det
		),
		vec3<f32>(
			(m[1][2] * m[2][0] - m[1][0] * m[2][2]) / det,
			(m[0][0] * m[2][2] - m[0][2] * m[2][0]) / det,
			(m[0][2] * m[1][0] - m[0][0] * m[1][2]) / det
		),
		vec3<f32>(
			(m[1][0] * m[2][1] - m[1][1] * m[2][0]) / det,
			(m[0][1] * m[2][0] - m[0][0] * m[2][1]) / det,
			(m[0][0] * m[1][1] - m[0][1] * m[1][0]) / det
		)
	);
}

//https://math.stackexchange.com/a/2306029
[[stage(compute), workgroup_size(256)]]
fn main([[builtin(global_invocation_id)]] global : vec3<u32>) {
	let id = global.x;
	if (id >= parameter.length) {
		return;
	}
	let point = cloud.data[id];
	let offset = global.x * parameter.k;
	var count = 0u;
	var dim = vec3<f32>(0.0, 0.0, 0.0);
	for (; nearest.data[offset + count] != id && count < parameter.k; count = count + 1u) {
		dim = dim + abs(point - cloud.data[nearest.data[offset + count] ]);
	}

	var AtA = mat3x3<f32>(
		vec3<f32>(0.0, 0.0, 0.0),
		vec3<f32>(0.0, 0.0, 0.0),
		vec3<f32>(0.0, 0.0, 0.0)	
	);

	if (dim.z < dim.x && dim.z < dim.y) {
		for (var i = 0u; i < count; i = i + 1u) {
			let p = cloud.data[nearest.data[offset + i] ];
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
		
		let AtA1 = inverse(AtA);

		var AtB = vec3<f32>(0.0, 0.0, 0.0);

		for (var i = 0u; i < count; i = i + 1u) {
			let p = cloud.data[nearest.data[offset + i] ];
			AtB.x = AtB.x + p.x * p.z;
			AtB.y = AtB.y + p.y * p.z;
			AtB.z = AtB.z + 1.0 * p.z;
		}

		let plane = AtA1 * AtB;
		
		colors.data[id] = normalize(cross(
			vec3<f32>(1.0, 0.0, plane.x),
			vec3<f32>(0.0, 1.0, plane.y),
		));
	} elseif (dim.y < dim.x) {

		for (var i = 0u; i < count; i = i + 1u) {
			let p = cloud.data[nearest.data[offset + i] ];
			AtA[0][0] = AtA[0][0] +  p.x * p.x;
			AtA[0][1] = AtA[0][1] +  p.x * p.z;
			AtA[0][2] = AtA[0][2] +  p.x * 1.0;
			AtA[1][0] = AtA[1][0] +  p.z * p.x;
			AtA[1][1] = AtA[1][1] +  p.z * p.z;
			AtA[1][2] = AtA[1][2] +  p.z * 1.0;
			AtA[2][0] = AtA[2][0] +  1.0 * p.x;
			AtA[2][1] = AtA[2][1] +  1.0 * p.z;
			AtA[2][2] = AtA[2][2] +  1.0 * 1.0;
		}
		
		let AtA1 = inverse(AtA);

		var AtB = vec3<f32>(0.0, 0.0, 0.0);

		for (var i = 0u; i < count; i = i + 1u) {
			let p = cloud.data[nearest.data[offset + i] ];
			AtB.x = AtB.x + p.x * p.y;
			AtB.y = AtB.y + p.z * p.y;
			AtB.z = AtB.z + 1.0 * p.y;
		}


		// A*x + B*y + C = z
		let plane = AtA1 * AtB;
		
		colors.data[id] = normalize(cross(
			vec3<f32>(1.0, plane.x, 0.0),
			vec3<f32>(0.0, plane.y, 1.0),
		));
	
	} else {
		
		for (var i = 0u; i < count; i = i + 1u) {
			let p = cloud.data[nearest.data[offset + i] ];
			AtA[0][0] = AtA[0][0] +  p.y * p.y;
			AtA[0][1] = AtA[0][1] +  p.y * p.z;
			AtA[0][2] = AtA[0][2] +  p.y * 1.0;
			AtA[1][0] = AtA[1][0] +  p.z * p.y;
			AtA[1][1] = AtA[1][1] +  p.z * p.z;
			AtA[1][2] = AtA[1][2] +  p.z * 1.0;
			AtA[2][0] = AtA[2][0] +  1.0 * p.y;
			AtA[2][1] = AtA[2][1] +  1.0 * p.z;
			AtA[2][2] = AtA[2][2] +  1.0 * 1.0;
		}
		
		let AtA1 = inverse(AtA);

		var AtB = vec3<f32>(0.0, 0.0, 0.0);

		for (var i = 0u; i < count; i = i + 1u) {
			let p = cloud.data[nearest.data[offset + i] ];
			AtB.x = AtB.x + p.y * p.x;
			AtB.y = AtB.y + p.z * p.x;
			AtB.z = AtB.z + 1.0 * p.x;
		}

		let plane = AtA1 * AtB;
		
		colors.data[id] = normalize(cross(
			vec3<f32>(plane.x, 1.0, 0.0),
			vec3<f32>(plane.y, 0.0, 1.0),
		));
	}
}
