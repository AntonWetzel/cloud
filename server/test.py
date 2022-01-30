import time
import compute.compute as compute
import generate
from numba import cuda, errors
import math
import warnings
import numpy as np

warnings.simplefilter('ignore', category=errors.NumbaPerformanceWarning)

min_time = 5_000_000_000

values = {}
file = open("result", "w")

sizes = [8, 16, 32, 64, 128, 256]
#sizes = [8, 16]
ks = [4, 16, 64, 128, 256]
#ks = [64]
for i in range(len(sizes)):
	sizes[i] *= 1024


def print_and_write(str):
	print(str, end="")
	file.write(str)


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


sort_times = []


def sort(c, size):
	c = c.reshape(size, 4)
	ind = np.lexsort((c[:, 2], c[:, 1], c[:, 0]))
	return c[ind].reshape(size * 4)


def cloud_sorted(size):
	name = f"cloud_sorted_{size}"
	if name not in values:
		c = cloud(size)
		t = repeat(lambda: sort(c, size))
		sort_times.append((size, t))
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
		d_n = d_nearest(size, k)
		values[name] = d_n.copy_to_host()
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
	c = 0
	cuda.synchronize()
	start = time.perf_counter_ns()
	while True:
		func()
		cuda.synchronize()
		c += 1
		t = time.perf_counter_ns() - start
		if t > min_time:
			break
	return t // c


def sur_test():

	for name, f in [
		("iter", lambda: compute.nearest_iter[ppg, tpb](d_cl, d_sur, size, k)),
		("list", lambda: compute.nearest_list[ppg, tpb](d_cl, d_sur, size, k)),
		("iter sorted", lambda: compute.nearest_iter[ppg, tpb](d_sorted, d_sur, size, k)),
		("list sorted", lambda: compute.nearest_list[ppg, tpb](d_sorted, d_sur, size, k)),
		("tria", lambda: compute.triangulate_all[ppg, tpb](d_cl, d_tria, size)),
		("tria sorted", lambda: compute.triangulate_with_sur[ppg, tpb](d_cl, d_sur, d_tria, size, k))
	]:
		print_and_write(name + "\n")
		times = []
		for size in sizes:
			tpb = 256 #threads per block
			ppg = math.ceil(size / tpb) #blocks per grid
			d_cl = d_cloud(size)
			d_sorted = d_cloud_sorted(size)
			d_tria = d_triangulation(size, True)
			print_and_write(f"{size:>12} & ")
			for k_i, k in enumerate(ks):
				d_sur = d_nearest(size, k, True)
				t = repeat(f)
				times.append(t)
				end = "&" if k_i < len(ks) - 1 else "\\\\\n"
				print_and_write(f"{t:>12} {end}")
		print_and_write("---\n")
		i = 0
		for size in sizes:
			print_and_write(f"{size:>12} & ")
			for k_i, k in enumerate(ks):
				t = times[i] // k
				end = "&" if k_i < len(ks) - 1 else "\\\\\n"
				print_and_write(f"{t:>12} {end}")
				i += 1
		print_and_write("---\n")
		i = 0
		for size in sizes:
			print_and_write(f"{size:>12} & ")
			for k_i, k in enumerate(ks):
				t = times[i] // size
				end = "&" if k_i < len(ks) - 1 else "\\\\\n"
				print_and_write(f"{t:>12} {end}")
				i += 1
		print_and_write("---\n")


def noise_test():
	k = 64
	for name, f, counts in [
		("spatial", lambda: compute.smooth[ppg, tpb](d_cl, d_sur, d_cl_new, size, k), [4, 16, 64]),
		("frequency", lambda: compute.frequenzy(cl, sur, size, k, count, False), [8, 64, 256]),
	]:
		print_and_write(name + "\n")
		times = []
		for size in sizes:
			tpb = 256 #threads per block
			ppg = math.ceil(size / tpb) #blocks per grid
			cl = cloud(size)
			d_cl = d_cloud(size)
			d_cl_new = cuda.device_array(size * 4, dtype=np.float32)

			print_and_write(f"{size:>12} & ")
			for count_i, count in enumerate(counts):
				sur = nearest(size, k)
				d_sur = d_nearest(size, k)
				t = repeat(f)
				times.append(t)
				end = "&" if count_i < len(counts) - 1 else "\\\\\n"
				print_and_write(f"{t:>12} {end}")
		print_and_write("---\n")
		i = 0
		for size in sizes:
			print_and_write(f"{size:>12} & ")
			for count_i, count in enumerate(counts):
				t = times[i] // size
				end = "&" if count_i < len(counts) - 1 else "\\\\\n"
				print_and_write(f"{t:>12} {end}")
				i += 1
		print_and_write("---\n")
		i = 0
		for size in sizes:
			print_and_write(f"{size:>12} & ")
			for count_i, count in enumerate(counts):
				t = times[i] // count
				end = "&" if count_i < len(counts) - 1 else "\\\\\n"
				print_and_write(f"{t:>12} {end}")
				i += 1
		print_and_write("---\n")


def edge_test():
	k = compute.triangulate_max

	times = []
	print_and_write("edge\n")
	for size in sizes:
		tpb = 256 #threads per block
		ppg = math.ceil(size / tpb) #blocks per grid

		d_t = d_triangulation(size)
		d_c = d_cloud(size)

		d_normal = cuda.device_array(size * 4, dtype=np.float32)
		d_curve = cuda.device_array(size * 4, dtype=np.float32)
		d_max = cuda.device_array(size * 4, dtype=np.float32)
		d_edge = cuda.device_array(size * 4, dtype=np.float32)

		print_and_write(f"{size:>12} & ")

		t = repeat(lambda: compute.normal[ppg, tpb](d_c, d_t, d_normal, size, k))
		print_and_write(f"{t:>12} & ")
		times.append(t)

		t = repeat(lambda: compute.curve[ppg, tpb](d_c, d_t, d_normal, d_curve, size, k))
		print_and_write(f"{t:>12} & ")
		times.append(t)

		t = repeat(lambda: compute.max[ppg, tpb](d_curve, d_t, d_max, size, k))
		print_and_write(f"{t:>12} & ")
		times.append(t)

		t = repeat(lambda: compute.threshhold[ppg, tpb](d_curve, d_edge, 0.1, size))
		print_and_write(f"{t:>12} \\\\\n")
		times.append(t)
	i = 0
	print_and_write("---\n")
	for size in sizes:
		print_and_write(
			f"{size:>12} & {times[i+0]//size:>12} & {times[i+1]//size:>12} & {times[i+2]//size:>12} & {times[i+3]//size:>12} \\\\\n"
		)
		i += 4
	print_and_write("---\n")


def main():
	sur_test()
	edge_test()

	noise_test()

	print_and_write("sort\n")
	for size, t in sort_times:
		print_and_write(f"{size:>10} & {t:>12} \\\\\n")
	print_and_write("---")

	print_and_write(
		"""


\\begin{table}
	\\caption{Laufzeiten für K-Nächsten-Nachbarn mit Liste ohne Sortierung}
	\\label{laufzeit:list}
	\\centering
	\\footnotesize
	\\begin{tabular}{|r||rrrrr|}
		\\hline
		Punkte N     & \\multicolumn{5}{c|}{K}                                                            \\\\
		\\hline \\hline
		Zeit in ns   & 4                      & 16          & 64           & 128          & 256          \\\\
		\\hline
		
		---
		
		\\hline \\hline
		Zeit/K in ns & 4                      & 16          & 64           & 128          & 256          \\\\
		\\hline

		---

		\\hline
	\\end{tabular}
\\end{table}
"""
	)


main()

file.close()
