from numba import cuda, types
from numba.core.errors import NumbaDeprecationWarning
import warnings

warnings.simplefilter('ignore', category=NumbaDeprecationWarning)
Point = types.Tuple([types.float32, types.float32, types.float32])


@cuda.jit(Point(types.float32[:], types.uint32), device=True, inline=True)
def get_point(cloud, id):
	id *= 4
	return (cloud[id + 0], cloud[id + 1], cloud[id + 2])


@cuda.jit(types.float32(Point, Point), device=True, inline=True)
def dist_pow_2(a, b):
	x = a[0] - b[0]
	y = a[1] - b[1]
	z = a[2] - b[2]
	return x * x + y * y + z * z
