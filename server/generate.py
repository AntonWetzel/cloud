import math
from random import random, randint
from typing import Tuple
import numpy as np
from opensimplex import OpenSimplex
import requests
from numba import jit, types
import time


@jit(types.void(types.float32[:], types.int32), nopython=True)
def norm(cloud, n):
	avg_x = 0.0
	avg_y = 0.0
	avg_z = 0.0
	for i in range(n):
		avg_x += cloud[i * 4 + 0]
		avg_y += cloud[i * 4 + 1]
		avg_z += cloud[i * 4 + 2]
	avg_x /= n
	avg_y /= n
	avg_z /= n
	for i in range(n):
		cloud[i * 4 + 0] -= avg_x
		cloud[i * 4 + 1] -= avg_y
		cloud[i * 4 + 2] -= avg_z
	var = 0
	for i in range(n):
		var += cloud[i * 4 + 0] * cloud[i * 4 + 0]
		var += cloud[i * 4 + 1] * cloud[i * 4 + 1]
		var += cloud[i * 4 + 1] * cloud[i * 4 + 2]
	norm = 1 / math.sqrt(var / n)
	for i in range(n):
		cloud[i * 4 + 0] *= norm
		cloud[i * 4 + 1] *= norm
		cloud[i * 4 + 2] *= norm


def create(id: int, size: int):
	if id == 0:
		cloud = sphere(size)
	elif id == 1:
		cloud = cube(size)
	elif id == 2:
		cloud = torus(size)
	elif id == 3:
		cloud = map(size)
	elif id == 4:
		link = "https://raw.githubusercontent.com/PointCloudLibrary/pcl/master/test/bunny.pcd"
		(cloud, size) = extern(link, 3)
	elif id == 5:
		link = "https://raw.githubusercontent.com/joachimtapp/bachelorProject/master/bunny.pcd"
		(cloud, size) = extern(link, 5)
	elif id == 6:
		link = "https://raw.githubusercontent.com/PointCloudLibrary/pcl/master/test/rops_cloud.pcd"
		(cloud, size) = extern(link, 3)
	else:
		print("generate error: id '" + id + "' wrong")
	cloud = cloud.reshape(size * 4)
	norm(cloud, size)
	return (size, cloud)


def sphere(size: int) -> np.ndarray:
	points = np.empty((size, 4), dtype=np.float32)
	for i in range(size):
		long = math.acos(random() * 2 - 1) # less points near the poles
		lat = random() * 2 * math.pi

		points[i, 0] = math.sin(lat) * math.sin(long)
		points[i, 1] = math.cos(long)
		points[i, 2] = math.cos(lat) * math.sin(long)
		points[i, 3] = 0
	return points


def torus(size: int) -> np.ndarray:
	points = np.empty((size, 4), dtype=np.float32)
	for i in range(size):
		u = random() * 2 * math.pi
		v = random() * 2 * math.pi
		t = 1 + 0.4 * math.cos(v)
		points[i, 0] = t * math.cos(i)
		points[i, 1] = 0.4 * math.sin(v)
		points[i, 2] = t * math.sin(i)
		points[i, 3] = 0
	return points


def cube(size: int) -> np.ndarray:
	points = np.empty((size, 4), dtype=np.float32)
	for i in range(size):
		face = randint(0, 5)
		if face == 0:
			points[i, 0] = random() * 2 - 1
			points[i, 1] = random() * 2 - 1
			points[i, 2] = -1
		elif face == 1:
			points[i, 0] = random() * 2 - 1
			points[i, 1] = random() * 2 - 1
			points[i, 2] = 1
		elif face == 2:
			points[i, 0] = random() * 2 - 1
			points[i, 1] = -1
			points[i, 2] = random() * 2 - 1
		elif face == 3:
			points[i, 0] = random() * 2 - 1
			points[i, 1] = 1
			points[i, 2] = random() * 2 - 1
		elif face == 4:
			points[i, 0] = -1
			points[i, 1] = random() * 2 - 1
			points[i, 2] = random() * 2 - 1
		elif face == 5:
			points[i, 0] = 1
			points[i, 1] = random() * 2 - 1
			points[i, 2] = random() * 2 - 1
		points[i, 3] = 0

	return points


def map(size: int) -> np.ndarray:
	count = math.ceil(math.sqrt(size))
	points = np.empty((size, 4), dtype=np.float32)
	noise = OpenSimplex()
	c = 0
	for i in range(count):
		for j in range(count):
			points[c, 0] = i / count - 0.5
			points[c, 1] = noise.noise2(i * 0.01, j * 0.01) / count * 25
			if (random() <= 0.03):
				points[c, 1] += (0.5 + random()) / count * 5
			points[c, 2] = j / count - 0.5
			points[c, 3] = 0
			c += 1
			if c >= size:
				break
		if c >= size:
			break
	return points


def extern(url: str, data_per_point) -> Tuple[np.ndarray, int]:
	r = requests.get(url)
	words = r.text.split()
	i = 0

	while i < len(words):
		if (words[i].lower() == "points"):
			size = int(words[i + 1])
			points = np.empty((size, 4), dtype=np.float32)
			i += 2
		elif words[i].lower() == "ascii":
			i += 1
			break
		else:
			i += 1
	for c in range(size):
		for j in range(3):
			points[c, j] = float(words[i + j])
		points[c, 3] = 0
		i += data_per_point
	return (points, size)
