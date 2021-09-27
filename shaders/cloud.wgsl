
[[block]] struct Uniforms {
	projection: mat4x4<f32>;
	view: mat4x4<f32>;
	model: mat4x4<f32>;
	ambient: f32;
	radius: f32;
	aspect: f32;
};


struct Light {
	position: vec3<f32>;
	intensity: f32;
};

[[block]] struct Lights {
	[[size(16)]] length: i32;
	data: array<Light>;
};

[[group(0), binding(0)]] var<uniform> uniforms: Uniforms;
[[group(0), binding(1)]] var<storage, read> lights: Lights;

struct Transfer {
	[[builtin(position)]] position : vec4<f32>;
	[[location(0)]] offset : vec2<f32>;
	[[location(1)]] color : vec3<f32>;
	[[location(2)]] worldPosition: vec3<f32>;
};

[[stage(vertex)]]
fn vertexMain(
	[[location(0)]] offset: vec2<f32>,
	[[location(1)]] position : vec3<f32>,
	[[location(2)]] color: vec3<f32>,
) -> Transfer {
	var output : Transfer;
	let p = uniforms.model * vec4<f32>(position, 1.0);
	output.worldPosition = p.xyz;
	output.position = uniforms.projection * uniforms.view * p;
	output.position.x = output.position.x + offset.x * uniforms.radius;
	output.position.y = output.position.y + offset.y * uniforms.radius * uniforms.aspect;
	output.offset = offset;
	output.color = color;
	return output;
}

[[stage(fragment)]]
fn fragmentMain(input : Transfer) -> [[location(0)]] vec4<f32> {
	if (length(input.offset) >= 1.0) {
		discard;
	}
	var brightness = 0.0;
	for (var i = 0; i < lights.length; i = i + 1) {
		let light = lights.data[i];
		let diff = light.position - input.worldPosition;
		let l = length(diff);
		brightness = brightness + light.intensity / (l *  l);
	}
	brightness = uniforms.ambient + (1.0 - uniforms.ambient) * brightness;
	return vec4<f32>(brightness * input.color, 1.0);
}
