import time
from compute.compute import *
import generate
from numba import cuda, errors
import math
import asyncio
from numba.cuda.cudadrv.driver import Stream
import warnings

warnings.simplefilter('ignore', category=errors.NumbaPerformanceWarning)

c = 10
stream: Stream = cuda.stream()

values = {}


def cloud(size):
	name = f"cloud_{size}"
	if name not in values:
		_, values[name] = generate.create(0, size)
	return values[name]


def d_cloud(size):
	name = f"d_cloud_{size}"
	if name not in values:
		c = cloud(size)
		values[name] = cuda.to_device(c, stream)
	return values[name]


def cloud_sorted(size):
	name = f"cloud_sorted_{size}"
	if name not in values:
		c = cloud(size)
		c = c.reshape(size, 4)
		ind = np.lexsort((c[:, 2], c[:, 1], c[:, 0]))
		c = c[ind].reshape(size * 4)
		values[name] = c
	return values[name]


def d_cloud_sorted(size):
	name = f"d_cloud_sorted_{size}"
	if name not in values:
		c = cloud_sorted(size)
		values[name] = cuda.to_device(c, stream)
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
		values[name] = cuda.device_array(size * k, dtype=np.uint32, stream=stream)
	return values[name]


def triangulation(size):
	name = f"triangulation_{size}"
	if name not in values:
		print(f"todo triangulation {name}")
		quit()
	return values[name]


def d_triangulation(size, generate):
	name = f"d_triangulation_{size}"
	if name not in values:
		if not generate:
			print(f"could not find {name}")
			quit()
		values[name] = cuda.device_array(size * triangulate_max, dtype=np.uint32, stream=stream)
	return values[name]


async def repeat(func):
	await stream.async_done()
	start = time.perf_counter()
	for _ in range(c):
		func()
	await stream.async_done()
	end = time.perf_counter()
	return (end - start) / c


async def nearest_test(k, size):

	tpb = 256 #threads per block
	ppg = math.ceil(size / tpb) #blocks per grid

	d_s = d_nearest(size, k, True)

	for name, f, d_c in [
		("iter", nearest_iter, d_cloud(size)),
		("list", nearest_list, d_cloud(size)),
		("iter sort", nearest_iter_sorted, d_cloud_sorted(size)),
		("list sort", nearest_list_sorted, d_cloud_sorted(size)),
	]:
		t = await repeat(lambda: f[ppg, tpb, stream](d_c, d_s, size, k))
		print(f"{name:>10} | {size//1000:>4} | {k:>4} | {t:10.5f} | {t/k:10.5f} | {t/size*1000:10.5f}")


async def triangulate_test(k, size):
	tpb = 256 #threads per block
	ppg = math.ceil(size / tpb) #blocks per grid

	d_c = d_cloud(size)
	d_s = d_nearest(size, k)
	d_t = d_triangulation(size, True)

	t = await repeat(lambda: triangulate_all[ppg, tpb, stream](d_c, d_t, size))
	print(f"{'tria':>10} | {size//1000:>4} | {'-':>4} | {t:10.5f} | {'-':>10} | {t/size*1000:10.5f}")

	t = await repeat(lambda: triangulate_with_sur[ppg, tpb, stream](d_c, d_s, d_s, size, k))
	print(f"{'tria surr':>10} | {size//1000:>4} | {k:>4} | {t:10.5f} | {t/k:10.5f} | {t/size*1000:10.5f}")


async def main():
	print(f"      name | size |    k |       time |        t/k |        t/s")
	print(f"-----------|------|------|------------|------------|-----------")

	for k in [4, 16, 64, 256]:
		await nearest_test(k, 10_000)
		await triangulate_test(k, 10_000)
	for size in [10_000, 20_000, 40_000, 80_000]:
		await nearest_test(64, size)
		await triangulate_test(64, size)


asyncio.run(main())
