[[block]] struct Camera {
	projection: mat4x4<f32>;
	view: mat4x4<f32>;
};

[[block]] struct Parameter {
	model: mat4x4<f32>;
	k: u32;
};

[[block]] struct Buffer {
	data: array<vec3<f32>>;
};

[[block]] struct Indices {
	data: array<u32>;
};

[[group(0), binding(0)]] var<uniform> camera: Camera;
[[group(0), binding(1)]] var<uniform> parameter: Parameter;
[[group(0), binding(2)]] var<storage, read> positions: Buffer;
[[group(0), binding(3)]] var<storage, read> colors: Buffer;
[[group(0), binding(4)]] var<storage, read> indices: Indices;

struct Transfer {
	[[builtin(position)]] position : vec4<f32>;
	[[location(0)]] color: vec3<f32>;
};

[[stage(vertex)]]
fn vertexMain(
	[[builtin(vertex_index)]] id: u32,
) -> Transfer {
	let center = id / (3u * parameter.k);
	let middle_pos = positions.data[center];
	var position: vec3<f32>;
	switch (id%3u) {
		case 0u: {
			position = middle_pos;
			break;
		}
		case 1u: {
			let index_id = indices.data[id/3u];
			let p = positions.data[index_id];
			if (p.x >= middle_pos.x) {
				position = p;
			} else {
				position = middle_pos;
			}
			break;
		}
		default: {
			var index_id = indices.data[id/3u + 1u];
			if (index_id == center || (id + 1u)%(parameter.k * 3u) == 0u) { //loop around to the first vertex in the circle
				index_id = indices.data[center*parameter.k];
			}
			let p = positions.data[index_id];
			if (p.x >= middle_pos.x) {
				position = p;
			} else {
				position = middle_pos;
			}
			break;
		}
	}
	var output : Transfer;
	output.position = camera.projection * camera.view * parameter.model * vec4<f32>(position, 1.0);
	output.color = abs(colors.data[center]);
	return output;
}

[[stage(fragment)]]
fn fragmentMain(data: Transfer) -> [[location(0)]] vec4<f32> {
	return vec4<f32>(data.color, 1.0);
}
