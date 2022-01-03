from numba import cuda, types
from numba.core.errors import NumbaDeprecationWarning
import warnings
import math

warnings.simplefilter('ignore', category=NumbaDeprecationWarning)
Point = types.UniTuple(types.float32, 3)


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


@cuda.jit(types.float32(Point, Point), device=True, inline=True)
def dot(a, b):
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


@cuda.jit(Point(Point, Point), device=True, inline=True)
def add(a, b):
	return (a[0] + b[0], a[1] + b[1], a[2] + b[2])


@cuda.jit(Point(Point, Point), device=True, inline=True)
def sub(a, b):
	return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


@cuda.jit(types.float32(Point), device=True, inline=True)
def length(a):
	return math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2])


@cuda.jit(Point(Point), device=True, inline=True)
def normalize(a):
	l = 1 / length(a)
	return (a[0] * l, a[1] * l, a[2] * l)


@cuda.jit(Point(Point, Point), device=True, inline=True)
def cross(a, b):
	return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
