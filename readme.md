# Cloud

## Overview
- calculate surrounding
	- k-nearest-neighbor
	- triangulation
- filter noise
	- gaussian filter in spatial domain
	- ideal box filter in frequency domain
- calculate edges
	- normal
	- curvature
	- edges
	- threshold

## Setup
- install [anaconda](https://www.anaconda.com/products/individual)
- clone and open repository
	- > git clone https://github.com/antonWetzel/cloud.git
- install and activate environment
	- > conda env create -f environment.yml
	- > conda activate cloud
- start server (vsCode)
	- open **cloud.code-workspace**
	- select python interpreter **'cloud': conda**
	- run and debug **server (workspace)**
- open **localhost:5500** or **127.0.0.1:5500** (tested with Google Chrome)

## Develop
- install [node](https://nodejs.org/en/)
- open root directory
- install dependencies
	- > npm install
- start server and compiler
	- command line
		- > conda activate cloud
		- > python server/main.py
		- > npx rollup -c - w
	- vsCode
		- open **cloud.code-workspace**
		- select python interpreter **'cloud': conda**
		- run and debug **run (workspace)**
- open **localhost:5500** or **127.0.0.1:5500**
