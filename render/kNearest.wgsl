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
	var vertex = positions.data[id / (2u * parameter.k)];
	var color = colors.data[id / (2u * parameter.k)];
	if (id%2u != 0u) {
		vertex = (vertex + positions.data[indices.data[id/2u] ]) / 2.0;
	}
	var output : Transfer;
	output.position = camera.projection * camera.view * parameter.model * vec4<f32>(vertex, 1.0);
	
	output.color = abs(color);

	return output;
}

[[stage(fragment)]]
fn fragmentMain(data: Transfer) -> [[location(0)]] vec4<f32> {
	return vec4<f32>(data.color, 1.0);
}
