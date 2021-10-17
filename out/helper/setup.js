const functions = [];
export function Register(f) {
    functions.push(f);
}
export function Setup() {
    for (let i = 0; i < functions.length; i++) {
        functions[i]();
    }
}
