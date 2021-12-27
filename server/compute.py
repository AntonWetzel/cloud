from aiohttp.web_ws import WebSocketResponse
from numba import cuda
from numba.cuda.cudadrv.devicearray import DeviceNDArray
from numba.cuda.cudadrv.driver import Stream
import numpy as np
import math

import kernal.nearest as nearest
import kernal.frequ as frequ

stream: Stream = cuda.stream()

size: int = 0
cloud: np.ndarray = np.array([])
d_cloud: DeviceNDArray

k: int = 0
surround: np.ndarray
d_surround: DeviceNDArray


def number_to_bytes(n: int) -> bytes:
	return n.to_bytes(4, 'little')


async def update_cloud(new_cloud: np.ndarray, new_size: int, ws: WebSocketResponse):
	global size, cloud, d_cloud
	cloud = new_cloud
	size = new_size
	d_cloud = cuda.to_device(cloud, stream=stream)
	await ws.send_bytes(number_to_bytes(1) + number_to_bytes(size) + cloud.tobytes())


async def send_surrounding(ws: WebSocketResponse):
	await ws.send_bytes(number_to_bytes(2) + number_to_bytes(k) + surround.tobytes())


async def compute(id: int, data: bytes, ws: WebSocketResponse):
	global size, cloud, d_cloud, k, surround, d_surround

	thread_per_block = 256
	blockspergrid = math.ceil(size / thread_per_block)

	if id == 0 or id == 1:
		if size == 0:
			print("cloud needed for surround")
			return
		k = int.from_bytes(data[0:4], "little")
		d_surround = cuda.device_array(size * k, dtype=np.uint32, stream=stream)
		if id == 0:
			nearest.iter[blockspergrid, thread_per_block, stream](d_cloud, d_surround, size, k)
		elif id == 1:
			nearest.list[blockspergrid, thread_per_block, stream](d_cloud, d_surround, size, k)
		surround = d_surround.copy_to_host(stream=stream)
		await stream.async_done()
		await send_surrounding(ws)
	elif id == 2 or id == 3:
		if size == 0:
			print("cloud needed for surround")
			return
		k = int.from_bytes(data[0:4], "little")
		d_surround = cuda.device_array(size * k, dtype=np.uint32, stream=stream)
		cloud = cloud.reshape(size, 4)
		ind = np.lexsort((cloud[:, 2], cloud[:, 1], cloud[:, 0]))
		cloud = cloud[ind]
		cloud = cloud.reshape(size * 4)
		await update_cloud(cloud, size, ws)
		if id == 2:
			nearest.iter_sorted[blockspergrid, thread_per_block, stream](d_cloud, d_surround, size, k)
		elif id == 3:
			nearest.list_sorted[blockspergrid, thread_per_block, stream](d_cloud, d_surround, size, k)
		surround = d_surround.copy_to_host(stream=stream)
		await stream.async_done()

		await send_surrounding(ws)
	elif id == 4:
		if k == 0:
			print("surround needed for laplace")
			return
		cloud = frequ.frequ(cloud, surround, size, k).reshape(size * 4)
		await update_cloud(cloud, size, ws)
	else:
		print("compute error: id '" + str(id) + "' wrong")
