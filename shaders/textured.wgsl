
[[block]] struct Uniforms {
	projection: mat4x4<f32>;
	view: mat4x4<f32>;
	model: mat4x4<f32>;
	ambientFactor: f32;
};

[[group(0), binding(0)]] var<uniform> uniforms: Uniforms;
[[group(0), binding(1)]] var sam: sampler;
[[group(0), binding(2)]] var tex: texture_2d<f32>;

struct Transfer {
	[[location(0)]] light : f32;
	[[location(1)]] uv : vec2<f32>;

	[[builtin(position)]] Position : vec4<f32>;
};

[[stage(vertex)]]
fn vertexMain(
	[[location(0)]] position : vec3<f32>,
	[[location(1)]] uv: vec2<f32>,
	[[location(2)]] normal : vec3<f32>
) -> Transfer {
	var output : Transfer;
	let n = normalize(uniforms.model * vec4<f32>(normal, 0.0));
	let p = uniforms.model * vec4<f32>(position, 1.0);
	output.light = uniforms.ambientFactor;
	output.Position = uniforms.projection * uniforms.view * p;
	output.uv = uv;
	return output;
}

[[stage(fragment)]]
fn fragmentMain(input : Transfer) -> [[location(0)]] vec4<f32> {
	let t = textureSample(tex, sam, input.uv);
	return vec4<f32>(input.light * t.rgb, t.a);
}
