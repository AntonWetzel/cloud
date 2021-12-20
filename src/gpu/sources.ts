export const sources =  {
	cloud:    undefined as string,
	kNearest: undefined as string,
	lines:    undefined as string,
	triangle: undefined as string,
}


export async function Setup() {
	const requests: { [key: string]: Promise<Response>} = {}
	for (const name in sources) {
		requests[name] = fetch('./render/'+name+'.wgsl')
	}
	for (const name in sources) {
		sources[name] = await (await requests[name]).text()
	}
}
