
[[block]] struct Uniforms {
	projection: mat4x4<f32>;
	view: mat4x4<f32>;
	model: mat4x4<f32>;
};

[[group(0), binding(0)]] var<uniform> uniforms: Uniforms;
struct Transfer {
	[[builtin(position)]] Position : vec4<f32>;
	[[location(0)]] color : vec3<f32>;
};

[[stage(vertex)]]
fn vertexMain(
	[[location(0)]] position : vec3<f32>,
	[[location(1)]] color: vec3<f32>,
) -> Transfer {
	var output : Transfer;
	output.Position = uniforms.projection * uniforms.view * uniforms.model * vec4<f32>(position, 1.0);
	output.color = color;
	return output;
}

[[stage(fragment)]]
fn fragmentMain(input : Transfer) -> [[location(0)]] vec4<f32> {
	return vec4<f32>(input.color, 1.0);
}
