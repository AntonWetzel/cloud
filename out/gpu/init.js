const functions = [];
export function Register(f) {
    functions.push(f);
}
export async function Setup() {
    for (let i = 0; i < functions.length; i++) {
        await functions[i]();
    }
}
