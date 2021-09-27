
[[block]] struct Uniforms {
	projection: mat4x4<f32>;
	view: mat4x4<f32>;
	model: mat4x4<f32>;
	ambient: f32;
};


struct Light {
	projection: mat4x4<f32>;
	view: mat4x4<f32>;
	position: vec3<f32>;
	intensity: f32;
};

[[block]] struct Lights {
	[[size(16)]] length: i32;
	data: array<Light>;
};

[[group(0), binding(0)]] var<uniform> uniforms: Uniforms;
[[group(0), binding(1)]] var<storage, read> lights: Lights;
[[group(0), binding(2)]] var samplerCompare: sampler_comparison;
[[group(0), binding(3)]] var shadows: texture_depth_2d_array;

struct Transfer {
	[[builtin(position)]] position : vec4<f32>;
	[[location(0)]] normal : vec3<f32>;
	[[location(1)]] color : vec3<f32>;
	[[location(2)]] worldPosition: vec3<f32>;
};

[[stage(vertex)]]
fn vertexMain(
	[[location(0)]] position : vec3<f32>,
	[[location(1)]] color: vec3<f32>,
	[[location(2)]] normal : vec3<f32>
) -> Transfer {
	var output : Transfer;
	let n = uniforms.model * vec4<f32>(normal, 0.0);
	let p = uniforms.model * vec4<f32>(position, 1.0);
	output.normal = n.xyz;
	output.worldPosition = p.xyz;
	output.position = uniforms.projection * uniforms.view * p;
	output.color = color;
	return output;
}

[[stage(fragment)]]
fn fragmentMain(input : Transfer) -> [[location(0)]] vec4<f32> {
	ignore(lights);
	ignore(samplerCompare);
	ignore(shadows);
	var brightness = 0.0;
	for (var i = 0; i < lights.length; i = i + 1) {
		let light = lights.data[i];
		var pos = light.projection * light.view * vec4<f32>(input.worldPosition, 1.0);
		if (pos.z < 0.0) {
			continue;
		}
		pos = pos / pos.w;
		let uv = pos.xy * vec2<f32>(0.5, -0.5) + 0.5;
		if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
			continue;
		}
		let diff = light.position - input.worldPosition;
		let l = length(diff);
		let visibile = textureSampleCompareLevel(shadows, samplerCompare, uv, i, pos.z - 0.001 * l);
		brightness = brightness + max(
			0.0,
			dot(
				normalize(input.normal),
				normalize(diff)
			)
		) * visibile / (l *  l) * light.intensity;
	}
	brightness = uniforms.ambient + (1.0 - uniforms.ambient) * brightness;
	return vec4<f32>(brightness * input.color, 1.0);
}
