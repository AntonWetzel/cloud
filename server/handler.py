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

		self.has_normal = False
		self.normal: np.ndarray
		self.d_normal: DeviceNDArray

		self.has_curve = False
		self.curvature: np.ndarray
		self.d_curvature: DeviceNDArray

		self.ws = ws

	async def send_string(self, s):
		await self.ws.send_str(s)

	async def send_cloud(self):
		self.k = 0
		self.has_curve = False
		self.has_normal = False
		await self.ws.send_bytes(number_to_bytes(1) + number_to_bytes(self.size) + self.cloud.tobytes())

	async def send_surrounding(self):
		await self.ws.send_bytes(number_to_bytes(2) + number_to_bytes(self.k) + self.surround.tobytes())

	async def send_curvature(self):
		self.has_curve = True
		await self.ws.send_bytes(number_to_bytes(3) + self.curvature.tobytes())

	async def send_normals(self):
		self.has_normal = True
		await self.ws.send_bytes(number_to_bytes(4) + self.normal.tobytes())

	async def compute(self, id: int, data: bytes):

		thread_per_block = 256
		blockspergrid = math.ceil(self.size / thread_per_block)

		if id == 0 or id == 1:
			if self.size == 0:
				await self.send_string("cloud needed for surround")
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
				await self.send_string("cloud needed for surround")
				return
			k = int.from_bytes(data[0:4], "little")
			cloud = self.cloud.reshape(self.size, 4)
			ind = np.lexsort((cloud[:, 2], cloud[:, 1], cloud[:, 0]))
			cloud = cloud[ind]
			self.cloud = cloud.reshape(self.size * 4)
			self.d_cloud = cuda.to_device(self.cloud, stream=self.stream)
			await self.send_cloud()
			self.k = k
			self.d_surround = cuda.device_array(self.size * self.k, dtype=np.uint32, stream=self.stream)
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
			if self.size == 0:
				await self.send_string("cloud needed for surround")
				return
			self.k = compute.triangulate_max
			self.d_surround = cuda.device_array(self.size * self.k, dtype=np.uint32, stream=self.stream)
			compute.triangulate_all[blockspergrid, thread_per_block,
				self.stream](self.d_cloud, self.d_surround, self.size)
			self.surround = self.d_surround.copy_to_host(stream=self.stream)
			await self.stream.async_done()
			await self.send_surrounding()
		elif id == 5:
			if self.k == 0:
				await self.send_string("surround needed for triangulation with surrounding")
				return
			new_k = compute.triangulate_max
			new_d_surround = cuda.device_array(self.size * new_k, dtype=np.uint32, stream=self.stream)
			compute.triangulate_with_sur[blockspergrid, thread_per_block,
				self.stream](self.d_cloud, self.d_surround, new_d_surround, self.size, self.k)
			self.d_surround = new_d_surround
			self.k = new_k
			self.surround = self.d_surround.copy_to_host(stream=self.stream)
			await self.stream.async_done()
			await self.send_surrounding()
		elif id == 6:
			[amount] = struct.unpack('<f', data[0:4])
			compute.noise(self.cloud, amount, self.size)
			self.d_cloud = cuda.to_device(self.cloud, stream=self.stream)
			await self.send_cloud()
		elif id == 7:
			count = int.from_bytes(data[0:4], "little")
			if self.k == 0:
				await self.send_string("surround needed for frequency domain filtering")
				return
			self.cloud = compute.frequenzy(self.cloud, self.surround, self.size, self.k, count)
			self.d_cloud = cuda.to_device(self.cloud, stream=self.stream)
			await self.send_cloud()
		elif id == 8:
			if self.k == 0:
				await self.send_string("surround needed for spatial domain filtering")
				return
			count = int.from_bytes(data[0:4], "little")
			clouds = [self.d_cloud, cuda.device_array(self.size * 4, dtype=np.float32, stream=self.stream)]
			for count in range(10):
				compute.smooth[blockspergrid, thread_per_block,
					self.stream](clouds[0], self.d_surround, clouds[1], self.size, self.k)
				clouds[0], clouds[1] = clouds[1], clouds[0]
			self.d_cloud = clouds[0]
			self.cloud = clouds[0].copy_to_host(stream=self.stream)
			await self.stream.async_done()
			await self.send_cloud()
		elif id == 9:
			if self.k == 0:
				await self.send_string("surround needed for normal")
				return
			self.d_normal = cuda.device_array(self.size * 4, dtype=np.float32, stream=self.stream)
			compute.normal[blockspergrid, thread_per_block,
				self.stream](self.d_cloud, self.d_surround, self.d_normal, self.size, self.k)
			self.normal = self.d_normal.copy_to_host(stream=self.stream)
			await self.stream.async_done()
			await self.send_normals()
		elif id == 10:
			if self.has_normal == False:
				await self.send_string("normal needed for curvature")
				return
			self.d_curvature = cuda.device_array(self.size * 4, dtype=np.float32, stream=self.stream)
			compute.edge_with_normal[blockspergrid, thread_per_block, self.stream](
				self.d_cloud, self.d_surround, self.d_normal, self.d_curvature, self.size, self.k
			)
			self.curvature = self.d_curvature.copy_to_host(stream=self.stream)
			await self.stream.async_done()
			await self.send_curvature()
		elif id == 11:
			if self.has_curve == False:
				await self.send_string("curvature needed for curvature maximum")
				return
			new_d_curvature = cuda.device_array(self.size * 4, dtype=np.float32, stream=self.stream)
			compute.peek[blockspergrid, thread_per_block,
				self.stream](self.d_curvature, self.d_surround, new_d_curvature, self.size, self.k)
			self.d_curvature = new_d_curvature
			self.curvature = self.d_curvature.copy_to_host(stream=self.stream)
			await self.stream.async_done()
			await self.send_curvature()
		elif id == 12:
			if self.has_curve == False:
				await self.send_string("curvature needed for threshhold")
				return
			[threshhold] = struct.unpack('<f', data[0:4])
			new_d_curvature = cuda.device_array(self.size * 4, dtype=np.float32, stream=self.stream)
			compute.threshhold[blockspergrid, thread_per_block,
				self.stream](self.d_curvature, new_d_curvature, threshhold, self.size)
			self.d_curvature = new_d_curvature
			self.curvature = self.d_curvature.copy_to_host(stream=self.stream)
			await self.stream.async_done()
			await self.send_curvature()
		else:
			await self.send_string("compute error: id '" + str(id) + "' wrong")

	async def create(self, id: int, size: int):
		self.size, self.cloud = generate.create(id, size)
		self.d_cloud = cuda.to_device(self.cloud, stream=self.stream)
		await self.send_cloud()
