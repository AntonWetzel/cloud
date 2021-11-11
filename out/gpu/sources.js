export const sources = {
    cloud: undefined,
    kNearest: undefined,
    lines: undefined,
    triangle: undefined,
};
export async function Setup() {
    for (const name in sources) {
        sources[name] = await (await fetch('./render/' + name + '.wgsl')).text();
    }
}
