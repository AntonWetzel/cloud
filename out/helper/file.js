export async function GetUserFile(endings) {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '';
        for (let i = 0; i < endings.length; i++) {
            input.accept += '.' + endings[i];
            if (i < endings.length - 1) {
                input.accept += ',';
            }
        }
        input.onchange = async () => {
            const files = input.files;
            if (files == null || files.length == 0) {
                return;
            }
            const file = files[0];
            const sep = file.name.split('.');
            const format = sep[sep.length - 1];
            if (endings.includes(format)) {
                resolve(file);
            }
            else {
                reject("format '" + format + "' not supported");
            }
        };
        input.click();
    });
}
export async function GetServerFile(path) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.onreadystatechange = () => {
            if (request.readyState == 4 && request.status == 200) {
                resolve(request.responseText);
            }
        };
        request.open('GET', path);
        request.send();
        setTimeout(reject, 1000, 'file timeout');
    });
}
