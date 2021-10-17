export function Triangulation(count) {
    const a = {
        x: 0,
        y: 0,
        z: 0,
    };
    function GetPoint() {
        return {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1,
            z: 0,
        };
    }
    const first = GetPoint();
    const second = GetPoint();
    const spheres = [Sphere(a, first, second)];
    console.log(spheres);
    return;
}
function Sphere(a, b, c) {
    const cen = Center(a, b, c);
    const rad = Length(Sub(a, cen));
    return {
        cen: cen,
        rad: rad,
        b: b,
        c: c,
    };
}
function Inside(s, a) {
    return Length(Sub(s.cen, a)) <= s.rad;
}
export function Center(a, b, c) {
    const x = Length(Sub(a, b));
    const y = Length(Sub(a, c));
    const z = Length(Sub(b, c));
    if (x < y) {
        if (y < z) {
            return CenterFromOrdered(a, b, c);
        }
        else {
            return CenterFromOrdered(b, a, c);
        }
    }
    else {
        if (x < z) {
            return CenterFromOrdered(a, b, c);
        }
        else {
            return CenterFromOrdered(c, a, b);
        }
    }
}
/*
    assume a is opposite the longest side
    a, b, c, x, y, z are in the same plane with the normal n

                       z <- equidistant from a, b and c
                      / \
                     /   \
                    /     \
   n     length -> /       \               n
   |              /         \              |
   c-------------/           \-------------b
    '-.         /             \         .-'
       '-.     /---.       .---\     .-'
          '-. /alpha|     | beta\ .-'
             x-------------------y
              '-.      n      .-'
                 '-.   |   .-'
                    '-.a.-'
*/
function CenterFromOrdered(a, b, c) {
    const x = Mult(Add(a, c), 0.5);
    const y = Mult(Add(a, b), 0.5);
    const ab = Normalize(Sub(b, a));
    const ac = Normalize(Sub(c, a));
    const n = Cross(ab, ac); //normal of the plane with all 3 points
    const xz = Cross(ac, n); //right angle to normal to stay in 2D
    const yz = Cross(n, ab);
    const xy = Normalize(Sub(y, x));
    const alpha = Math.acos(Dot(xy, xz));
    const beta = Math.PI - Math.acos(Dot(xy, yz)); //minus because xy ist wrong direction
    //https://en.wikipedia.org/wiki/Law_of_sines
    const length = (Length(Sub(x, y)) * Math.sin(beta)) / Math.sin(Math.PI - (alpha + beta));
    const z = Add(x, Mult(xz, length));
    //check if it is the center, currently not perfect, no clue if it is a error or precision
    console.log(Length(Sub(a, z)), Length(Sub(b, z)), Length(Sub(c, z)));
    return z;
}
function Normalize(x) {
    const l = Length(x);
    return {
        x: x.x / l,
        y: x.y / l,
        z: x.z / l,
    };
}
function Dot(x, y) {
    return x.x * y.x + x.y * y.y + x.z * y.z;
}
function Length(x) {
    return Math.sqrt(x.x * x.x + x.y * x.y + x.z * x.z);
}
function Cross(x, y) {
    return {
        x: x.y * y.z - x.z * y.y,
        y: x.z * y.x - x.x * y.z,
        z: x.x * y.y - x.y * y.x,
    };
}
function Add(x, y) {
    return {
        x: x.x + y.x,
        y: x.y + y.y,
        z: x.z + y.z,
    };
}
function Sub(x, y) {
    return {
        x: x.x - y.x,
        y: x.y - y.y,
        z: x.z - y.z,
    };
}
function Mult(x, a) {
    return {
        x: x.x * a,
        y: x.y * a,
        z: x.z * a,
    };
}
