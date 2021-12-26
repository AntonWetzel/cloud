import types
from typing import Dict
from aiohttp.web_ws import WebSocketResponse
from numba import cuda
from numba.cuda.cudadrv.devicearray import DeviceNDArray
from numba.cuda.cudadrv.driver import Stream
import numpy as np
import math

import generate as gen
import kernals.main as kernals

stream: Stream = cuda.stream()

size: int = 0
cloud: np.ndarray
d_cloud: DeviceNDArray

k: int = 0
nearest: np.ndarray
d_nearest: DeviceNDArray


def number_to_bytes(n: int) -> bytes:
	return n.to_bytes(4, 'little')


async def send_cloud(ws: WebSocketResponse):
	await ws.send_bytes(number_to_bytes(1) + number_to_bytes(size) + cloud.tobytes())


async def send_surrounding(ws: WebSocketResponse):
	await ws.send_bytes(number_to_bytes(2) + number_to_bytes(k) + nearest.tobytes())


async def compute(id: int, data: bytes, ws: WebSocketResponse):
	global size, cloud, d_cloud, k, nearest, d_nearest

	thread_per_block = 256
	blockspergrid = math.ceil(size / thread_per_block)

	if id == 0 or id == 1:
		if size == 0:
			print("cloud needed for nearest")
			return
		k = int.from_bytes(data[0:4], "little")
		d_nearest = cuda.device_array(size * k, dtype=np.uint32, stream=stream)
		if id == 0:
			kernals.nearest.iter[blockspergrid, thread_per_block, stream](d_cloud, d_nearest, size, k)
		elif id == 1:
			kernals.nearest.list[blockspergrid, thread_per_block, stream](d_cloud, d_nearest, size, k)
		nearest = d_nearest.copy_to_host(stream=stream)
		await stream.async_done()
		await send_surrounding(ws)
	elif id == 2 or id == 3:
		if size == 0:
			print("cloud needed for nearest")
			return
		k = int.from_bytes(data[0:4], "little")
		d_nearest = cuda.device_array(size * k, dtype=np.uint32, stream=stream)
		kernals.nearest.quickSort(cloud, 0, size - 1)
		d_cloud = cuda.to_device(cloud, stream=stream)
		if id == 2:
			kernals.nearest.iter_sorted[blockspergrid, thread_per_block, stream](d_cloud, d_nearest, size, k)
		elif id == 3:
			kernals.nearest.list_sorted[blockspergrid, thread_per_block, stream](d_cloud, d_nearest, size, k)
		nearest = d_nearest.copy_to_host(stream=stream)
		await stream.async_done()

		await send_cloud(ws)
		await send_surrounding(ws)
	else:
		print("compute error: id '" + str(id) + "' wrong")


async def generate(id: int, parameter: Dict, ws: WebSocketResponse):
	global size, cloud, d_cloud

	size = parameter["size"]
	if id == 0:
		cloud = gen.sphere(size)
	elif id == 1:
		cloud = gen.cube(size)
	elif id == 2:
		cloud = gen.map(size)
	elif id == 3:
		link = "https://raw.githubusercontent.com/PointCloudLibrary/pcl/master/test/bunny.pcd"
		(cloud, size) = gen.extern(link)
	elif id == 4:
		link = "https://raw.githubusercontent.com/PointCloudLibrary/pcl/master/test/rops_cloud.pcd"
		(cloud, size) = gen.extern(link)
	else:
		print("generate error: id '" + id + "' wrong")
	d_cloud = cuda.to_device(cloud, stream=stream)
	await send_cloud(ws)
