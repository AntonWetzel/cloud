
[[block]] struct Uniforms {
	view: mat4x4<f32>;
	model: mat4x4<f32>;
};

[[group(0), binding(0)]] var<uniform> uniforms: Uniforms;

struct Transfer {
	[[builtin(position)]] position : vec4<f32>;
};

[[stage(vertex)]]
fn vertexMain(
	[[location(0)]] vertex: vec3<f32>,
) -> Transfer {
	var output : Transfer;
	let world = (uniforms.view * uniforms.model * vec4<f32>(vertex, 1.0)).xyz;
	let length = length(world);
	output.position.x = atan2(world.x, world.z) / 3.14;
	output.position.y = atan2(world.y, length(vec2<f32>(world.x, world.z))) / 3.14 * 2.0;
	output.position.z = 1.0 / length;
	output.position.w = 1.0;
	return output;
}

[[stage(fragment)]]
fn fragmentMain(data: Transfer) -> [[location(0)]] vec4<f32> {
	return vec4<f32>(0.0, 0.0, 0.0, 0.0);
}
