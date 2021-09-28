[[block]] struct Uniforms {
	projection: mat4x4<f32>;
	view: mat4x4<f32>;
	model: mat4x4<f32>;
};

[[group(0), binding(0)]] var<uniform> uniforms: Uniforms;

struct Transfer {
	[[builtin(position)]] position : vec4<f32>;
	[[location(0)]] color: vec3<f32>;
};

[[stage(vertex)]]
fn vertexMain(
	[[location(0)]] vertex: vec3<f32>,
	[[location(1)]] color: vec3<f32>,
) -> Transfer {
	var output : Transfer;
	output.position = uniforms.projection * uniforms.view * uniforms.model * vec4<f32>(vertex, 1.0);
	output.color = color;
	return output;
}

[[stage(fragment)]]
fn fragmentMain(data: Transfer) -> [[location(0)]] vec4<f32> {
	//return vec4<f32>(1.0, 1.0, 1.0, 1.0);
	return vec4<f32>(data.color, 1.0);
}
