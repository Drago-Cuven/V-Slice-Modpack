#pragma header

#import <base/postprocess.frag>

uniform float uScale;
uniform float uIntensity;
uniform float uTime;

float rand(vec2 a) {
	return fract(sin(dot(mod(a, vec2(1000.0)).xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float rainDist(vec2 p, float scale, float intensity) {
	// scale everything
	p *= 0.1;
	// sheer
	p.x += p.y * 0.1;
	// scroll
	p.y -= uTime * 500.0 / scale;
	// expand Y
	p.y *= 0.03;
	float ix = floor(p.x);
	// shift Y
	p.y += mod(ix, 2.0) * 0.5 + (rand(vec2(ix)) - 0.5) * 0.3;
	float iy = floor(p.y);
	vec2 index = vec2(ix, iy);
	// mod
	p -= index;
	// shift X
	p.x += (rand(index.yx) * 2.0 - 1.0) * 0.35;
	// distance
	vec2 a = abs(p - 0.5);
	float res = max(a.x * 0.8, a.y * 0.5) - 0.1;
	// decimate
	bool empty = rand(index) < mix(1.0, 0.1, intensity);
	return empty ? 1.0 : res;
}

void main() {
	vec2 wpos = screenToWorld(screenCoord);
	vec2 origWpos = wpos;
	float intensity = uIntensity;

	vec3 add = vec3(0);
	float rainSum = 0.0;

	const int numLayers = 4;
	float scales[4];
	scales[0] = 1.0;
	scales[1] = 1.8;
	scales[2] = 2.6;
	scales[3] = 4.8;

	for (int i = 0; i < numLayers; i++) {
		float scale = scales[i];
		float r = rainDist(wpos * scale / uScale + 500.0 * float(i), scale, intensity);
		if (r < 0.0) {
			float v = (1.0 - exp(r * 5.0)) / scale * 2.0;
			wpos.x += v * 10.0 * uScale;
			wpos.y -= v * 2.0 * uScale;
			add += vec3(0.1, 0.15, 0.2) * v;
			rainSum += (1.0 - rainSum) * 0.75;
		}
	}

	vec3 color = sampleBitmapWorld(wpos).xyz;

	vec3 rainColor = vec3(0.4, 0.5, 0.8);
	color = mix(color + add, rainColor, 0.1 * rainSum);

	gl_FragColor = vec4(color, 1);
}