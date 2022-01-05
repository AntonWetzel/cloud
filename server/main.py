import aiohttp
from aiohttp import web
import asyncio
import time

import handler

generateIdOffset = 1
computeIdOffset = 33


def handle(path: str, content_type: str):
	file = open(path, 'r').read()
	return web.Response(text=file, content_type=content_type)


async def websocket_handler(request):
	ws = web.WebSocketResponse()
	await ws.prepare(request)

	handle = handler.Handler(ws)
	async for msg in ws:
		if msg.type == aiohttp.WSMsgType.ERROR:
			print('ws connection closed with exception %s' % ws.exception())
		elif msg.type == aiohttp.WSMsgType.BINARY:
			data: bytes = msg.data
			info = int.from_bytes(data[0:4], "little")
			if generateIdOffset <= info and info < computeIdOffset:
				t = time.time()
				info -= generateIdOffset
				print("started generate " + str(info))
				size = int.from_bytes(data[4:8], "little")
				await handle.create(info, size)
				print("executed generate " + str(info) + " in " + str(time.time() - t) + " seconds")
			elif computeIdOffset <= info and info <= 50:
				t = time.time()
				info -= computeIdOffset
				print("started compute " + str(info))
				await handle.compute(info, data[4:])
				print("executed compute " + str(info) + " in " + str(time.time() - t) + " seconds")
			else:
				print("wrong info code: ", info)
	return ws


def create_runner():
	app = web.Application()
	app.add_routes(
		[
		web.get('/ws', websocket_handler),
		web.get('/', lambda _: handle("./client/index.html", "text/html")),
		web.get('/index', lambda _: handle("./client/index.html", "text/html")),
		web.get('/index.html', lambda _: handle("./client/index.html", "text/html")),
		web.get('/main.css', lambda _: handle("./client/main.css", "text/css")),
		web.get('/favicon.svg', lambda _: handle("./favicon.svg", "image/svg+xml")),
		web.get('/bundle.js', lambda _: handle("./bundle.js", "application/javascript")),
		]
	)
	return web.AppRunner(app)


async def start_server(host: str, port: int):
	runner = create_runner()
	await runner.setup()
	site = web.TCPSite(runner, host, port)
	await site.start()


if __name__ == "__main__":
	host = "127.0.0.1"
	port = 5500
	loop = asyncio.new_event_loop()
	loop.run_until_complete(start_server(host, port))
	print("running at: http://" + host + ":" + str(port))
	loop.run_forever()
