export const sources =  {
	cloud:    undefined as string,
	kNearest: undefined as string,
	lines:    undefined as string,
	triangle: undefined as string,
}


export async function Setup() {
	for (const name in sources) {
		sources[name] = await (await fetch('./render/'+name+'.wgsl')).text()
	}
}
