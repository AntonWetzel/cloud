import math
from random import random, randint
from typing import Tuple
import numpy as np
from opensimplex import OpenSimplex
import requests
from typing import Dict
from aiohttp.web_ws import WebSocketResponse

from compute import update_cloud


async def create(id: int, parameter: Dict, ws: WebSocketResponse):
	size = parameter["size"]
	if id == 0:
		cloud = sphere(size)
	elif id == 1:
		cloud = cube(size)
	elif id == 2:
		cloud = map(size)
	elif id == 3:
		link = "https://raw.githubusercontent.com/PointCloudLibrary/pcl/master/test/bunny.pcd"
		(cloud, size) = extern(link, 3)
	elif id == 4:
		link = "https://raw.githubusercontent.com/joachimtapp/bachelorProject/master/bunny.pcd"
		(cloud, size) = extern(link, 5)
	elif id == 5:
		link = "https://raw.githubusercontent.com/PointCloudLibrary/pcl/master/test/rops_cloud.pcd"
		(cloud, size) = extern(link, 3)
	else:
		print("generate error: id '" + id + "' wrong")
	cloud = cloud.reshape(size * 4)
	await update_cloud(cloud, size, ws)


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
			points[c, 1] = noise.noise2d(i * 0.01, j * 0.01) / count * 25
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
	c = 0
	while i < len(words) and c < size:
		points[c, 0] = words[i + 0]
		points[c, 1] = words[i + 1]
		points[c, 2] = words[i + 2]
		points[c, 3] = 0
		c += 1
		i += data_per_point
	return (points, size)
