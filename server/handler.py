import struct
from aiohttp.web_ws import WebSocketResponse
from numba import cuda
from numba.cuda.cudadrv.devicearray import DeviceNDArray
from numba.cuda.cudadrv.driver import Stream
import numpy as np
import math

import compute.compute as compute
import generate as generate


def number_to_bytes(n: int) -> bytes:
	return n.to_bytes(4, 'little')


class Handler:
	def __init__(self, ws: WebSocketResponse) -> None:
		self.stream: Stream = cuda.stream()

		self.size: int = 0
		self.cloud: np.ndarray = np.array([])
		self.d_cloud: DeviceNDArray

		self.k: int = 0
		self.surround: np.ndarray
		self.d_surround: DeviceNDArray
		self.ws = ws

	async def update_cloud(self, cloud: np.ndarray, size: int, reset_sur: bool = False):
		self.cloud = cloud
		self.size = size
		self.d_cloud = cuda.to_device(cloud, stream=self.stream)
		if reset_sur:
			self.k = 0
		await self.ws.send_bytes(number_to_bytes(1) + number_to_bytes(size) + cloud.tobytes())

	async def send_surrounding(self):
		await self.ws.send_bytes(number_to_bytes(2) + number_to_bytes(self.k) + self.surround.tobytes())

	async def compute(self, id: int, data: bytes):

		thread_per_block = 256
		blockspergrid = math.ceil(self.size / thread_per_block)

		if id == 0 or id == 1:
			if self.size == 0:
				print("cloud needed for surround")
				return
			self.k = int.from_bytes(data[0:4], "little")
			self.d_surround = cuda.device_array(self.size * self.k, dtype=np.uint32, stream=self.stream)
			if id == 0:
				compute.nearest_iter[blockspergrid, thread_per_block,
					self.stream](self.d_cloud, self.d_surround, self.size, self.k)
			elif id == 1:
				compute.nearest_list[blockspergrid, thread_per_block,
					self.stream](self.d_cloud, self.d_surround, self.size, self.k)
			self.surround = self.d_surround.copy_to_host(stream=self.stream)
			await self.stream.async_done()
			await self.send_surrounding()
		elif id == 2 or id == 3:
			if self.size == 0:
				print("cloud needed for surround")
				return
			self.k = int.from_bytes(data[0:4], "little")
			self.d_surround = cuda.device_array(self.size * self.k, dtype=np.uint32, stream=self.stream)
			cloud = self.cloud.reshape(self.size, 4)
			ind = np.lexsort((cloud[:, 2], cloud[:, 1], cloud[:, 0]))
			cloud = cloud[ind]
			cloud = cloud.reshape(self.size * 4)
			await self.update_cloud(cloud, self.size)
			if id == 2:
				compute.nearest_iter_sorted[blockspergrid, thread_per_block,
					self.stream](self.d_cloud, self.d_surround, self.size, self.k)
			elif id == 3:
				compute.nearest_list_sorted[blockspergrid, thread_per_block,
					self.stream](self.d_cloud, self.d_surround, self.size, self.k)
			self.surround = self.d_surround.copy_to_host(stream=self.stream)
			await self.stream.async_done()
			await self.send_surrounding()
		elif id == 4:
			if self.k == 0:
				print("surround needed for laplace")
				return
			cloud = compute.frequenzy(self.cloud, self.surround, self.size, self.k)
			await self.update_cloud(cloud, self.size, self.ws)
		elif id == 5:
			[amount] = struct.unpack('<f', data[0:4])
			print("amount:", amount)
			cloud = compute.noise(self.cloud, amount, self.size, self.k)
			await self.update_cloud(cloud, self.size, True)
		else:
			print("compute error: id '" + str(id) + "' wrong")

	async def create(self, id: int, size: int):
		if id == 0:
			cloud = generate.sphere(size)
		elif id == 1:
			cloud = generate.cube(size)
		elif id == 2:
			cloud = generate.map(size)
		elif id == 3:
			link = "https://raw.githubusercontent.com/PointCloudLibrary/pcl/master/test/bunny.pcd"
			(cloud, size) = generate.extern(link, 3)
		elif id == 4:
			link = "https://raw.githubusercontent.com/joachimtapp/bachelorProject/master/bunny.pcd"
			(cloud, size) = generate.extern(link, 5)
		elif id == 5:
			link = "https://raw.githubusercontent.com/PointCloudLibrary/pcl/master/test/rops_cloud.pcd"
			(cloud, size) = generate.extern(link, 3)
		else:
			print("generate error: id '" + id + "' wrong")
		cloud = cloud.reshape(size * 4)
		await self.update_cloud(cloud, size, True)
