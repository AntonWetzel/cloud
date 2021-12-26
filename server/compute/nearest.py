from numba import cuda, types
from numba.core.errors import NumbaDeprecationWarning
import numpy as np
import warnings

warnings.simplefilter('ignore', category=NumbaDeprecationWarning)
Point = types.Tuple([types.float32, types.float32, types.float32])


@cuda.jit(Point(types.float32[:], types.uint32), device=True, inline=True)
def get_point(data, id):
    id *= 4
    return (data[id+0], data[id+1], data[id+2])


@cuda.jit(types.float32(Point, Point), device=True, inline=True)
def dist_pow_2(a, b):
    x = a[0] - b[0]
    y = a[1] - b[1]
    z = a[2] - b[2]
    return x*x+y*y+z*z


@cuda.jit(types.void(types.float32[:], types.uint32[:], types.uint32, types.uint32))
def nearest_iter(a, b, n, k):
    id = cuda.grid(1)
    if id >= n:
        return
    offset = (id + 1) * k - 1
    p = get_point(a, id)
    last = 0.0
    for c in range(k):
        current: int
        dist = np.Infinity
        for i in range(n):
            o = get_point(a, i)
            d = dist_pow_2(p, o)
            if d < dist and last < d:
                current = i
                dist = d
        b[offset - c] = current
        last = dist
