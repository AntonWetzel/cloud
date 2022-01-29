from cgi import test
import time
from winreg import FlushKey
import compute.compute as compute
import generate
from numba import cuda, errors
import math
from numba.cuda.cudadrv.driver import Stream
import warnings
import numpy as np
import sys
import os

warnings.simplefilter('ignore', category=errors.NumbaPerformanceWarning)

c = 16
skip_mode = False

values = {}

idx = 0
while (os.path.exists("result" + str(idx) + ".md")):
	idx += 1
file = open("result" + str(idx) + ".md", "w")


def print_and_write(str):
	print(str)
	file.write(str + "\n")


def print_it(name, size, k, t):
	if k == None:
		print_and_write(f"| {name:>10} | {size:>8} | {'-':>4} | {t:>12} | {'-':>10} | {t//size:>10} |")
	else:
		print_and_write(f"| {name:>10} | {size:>8} | {k:>4} | {t:>12} | {t//k:>10} | {t//size:>10} |")


def cloud(size):
	name = f"cloud_{size}"
	if name not in values:
		_, values[name] = generate.create(0, size)
	return values[name]


def d_cloud(size):
	name = f"d_cloud_{size}"
	if name not in values:
		c = cloud(size)
		values[name] = cuda.to_device(c)
	return values[name]


def sort(c, size):
	c = c.reshape(size, 4)
	ind = np.lexsort((c[:, 2], c[:, 1], c[:, 0]))
	return c[ind].reshape(size * 4)


def cloud_sorted(size):
	name = f"cloud_sorted_{size}"
	if name not in values:
		c = cloud(size)
		t = repeat(lambda: sort(c, size))
		print_it("sort", size, None, t)
		values[name] = sort(c, size)
	return values[name]


def d_cloud_sorted(size):
	name = f"d_cloud_sorted_{size}"
	if name not in values:
		c = cloud_sorted(size)
		values[name] = cuda.to_device(c)
	return values[name]


def nearest(size, k):
	name = f"nearest_{size}_{k}"
	if name not in values:
		print(f"todo {name}")
		quit()
	return values[name]


def d_nearest(size, k, generate=False):
	name = f"d_nearest_{size}_{k}"
	if name not in values:
		if not generate:
			print(f"could not find {name}")
			quit()
		values[name] = cuda.device_array(size * k, dtype=np.uint32)
	return values[name]


def triangulation(size):
	name = f"triangulation_{size}"
	if name not in values:
		print(f"todo triangulation {name}")
		quit()
	return values[name]


def d_triangulation(size, generate=False):
	name = f"d_triangulation_{size}"
	if name not in values:
		if not generate:
			print(f"could not find {name}")
			quit()
		values[name] = cuda.device_array(size * compute.triangulate_max, dtype=np.uint32)
	return values[name]


def repeat(func):
	if skip_mode:
		func()
		return -1
	cuda.synchronize()
	start = time.perf_counter_ns()
	sys.stdout.flush()
	for i in range(c):
		print("\r" + str(i) + "/" + str(c), end="")
		sys.stdout.flush()
		func()
		cuda.synchronize()
	end = time.perf_counter_ns()
	print("\r", end="")
	sys.stdout.flush()
	return (end - start) // c


def nearest_test(k, size):

	tpb = 256 #threads per block
	ppg = math.ceil(size / tpb) #blocks per grid

	d_s = d_nearest(size, k, True)

	for name, f, d_c in [
		("iter", compute.nearest_iter, d_cloud(size)),
		("list", compute.nearest_list, d_cloud(size)),
		("iter sort", compute.nearest_iter_sorted, d_cloud_sorted(size)),
		("list sort", compute.nearest_list_sorted, d_cloud_sorted(size)),
	]:
		t = repeat(lambda: f[ppg, tpb](d_c, d_s, size, k))
		print_it(name, size, k, t)


def triangulate_test(k, size):
	tpb = 256 #threads per block
	ppg = math.ceil(size / tpb) #blocks per grid

	d_c = d_cloud(size)
	d_s = d_nearest(size, k)
	d_t = d_triangulation(size, True)

	t = repeat(lambda: compute.triangulate_all[ppg, tpb](d_c, d_t, size))
	print_it("tria", size, None, t)

	t = repeat(lambda: compute.triangulate_with_sur[ppg, tpb](d_c, d_s, d_t, size, k))
	print_it("tria surr", size, k, t)


def edge_test(size):
	tpb = 256 #threads per block
	ppg = math.ceil(size / tpb) #blocks per grid

	d_t = d_triangulation(size)
	d_c = d_cloud(size)

	d_normal = cuda.device_array(size * 4, dtype=np.float32)
	d_curve = cuda.device_array(size * 4, dtype=np.float32)
	d_max = cuda.device_array(size * 4, dtype=np.float32)
	d_edge = cuda.device_array(size * 4, dtype=np.float32)

	k = compute.triangulate_max

	t = repeat(lambda: compute.normal[ppg, tpb](d_c, d_t, d_normal, size, k))
	print_it("normal", size, None, t)

	t = repeat(lambda: compute.curve[ppg, tpb](d_c, d_t, d_normal, d_curve, size, k))
	print_it("curve", size, None, t)

	t = repeat(lambda: compute.max[ppg, tpb](d_curve, d_t, d_max, size, k))
	print_it("max", size, None, t)

	t = repeat(lambda: compute.threshhold[ppg, tpb](d_curve, d_edge, 0.1, size))
	print_it("thresh", size, None, t)


def main():
	print_and_write(f"|       name |     size |    k |         time |        t/k |        t/s |")
	print_and_write(f"|-----------:|---------:|-----:|-------------:|-----------:|-----------:|")

	#for size in [8]:
	for size in [8, 16, 32, 64]:
		size *= 1024
		#for k in [64]:
		for k in [4, 16, 256, 64]:
			nearest_test(k, size)
			triangulate_test(k, size)
		edge_test(size)


main()

file.close()
