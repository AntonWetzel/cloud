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
[[group(0), binding(3)]] var<storage, write> new_cloud: Buffer;

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
		
		let n = normalize(cross(
			vec3<f32>(1.0, 0.0, plane.x),
			vec3<f32>(0.0, 1.0, plane.y),
		));
		//m = p + a * n
		//A * m.x + B * m.y + C = m.z
		//A * (p.x + a * n.x) + B * (p.y + a * n.y) + C = p.z + a * n.z
		//a * A * n.x + a * B * n.y - a * n.z = p.z - A * p.x - B * p.y - C
		//a * (A * n.x + B * n.y - n.z) =  p.z - A * p.x - B * p.y - C
		//a = (p.z - A * p.x - B * p.y - C) / (A * n.x + B * n.y - n.z)
		let alpha = (point.z - plane.x * point.x - plane.y * point.y - plane.z) / (plane.x * n.x + plane.y * n.y - n.z);
		new_cloud.data[id] = point + alpha * n;	
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
		
		let n = normalize(cross(
			vec3<f32>(1.0, plane.x, 0.0),
			vec3<f32>(0.0, plane.y, 1.0),
		));
		//m = p + a * n
		//A * m.x + B * m.z + C = m.y
		//A * (p.x + a * n.x) + B * (p.z + a * n.z) + C = p.y + a * n.y
		//a * A * n.x + a * B * n.z - a * n.y = p.y - A * p.x - B * p.z - C
		//a * (A * n.x + B * n.z - n.y) =  p.y - A * p.x - B * p.z - C
		//a = (p.y - A * p.x - B * p.z - C) / (A * n.x + B * n.z - n.y)
		let alpha = (point.y - plane.x * point.x - plane.y * point.z - plane.z) / (plane.x * n.x + plane.y * n.z - n.y);
		new_cloud.data[id] = point + alpha * n;
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

		//A * p.y + B * p.z + C = p.x
		let plane = AtA1 * AtB;
		
		let n = normalize(cross(
			vec3<f32>(plane.x, 1.0, 0.0),
			vec3<f32>(plane.y, 0.0, 1.0),
		));
		//m = p + a * n
		//A * m.y + B * m.z + C = m.x
		//A * (p.y + a * n.y) + B * (p.z + a * n.z) + C = p.x + a * n.x
		//a * A * n.y + a * B * n.z - a * n.x = p.x - A * p.y - B * p.z - C
		//a * (A * n.y + B * n.z - n.x) = p.x - A * p.y - B * p.z - C
		//a = (p.x - A * p.y - B * p.z - C) / (A * n.y + B * n.z - n.x)
		let alpha = (point.x - plane.x * point.y - plane.y * point.z - plane.z) / (plane.x * n.y + plane.y * n.z - n.x);
		new_cloud.data[id] = point + alpha * n;
	}
}
