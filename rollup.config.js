import typescript from 'rollup-plugin-typescript2'
import url from '@rollup/plugin-url'
import includePaths from 'rollup-plugin-includepaths'

export default {
	input: './src/main.ts',
	output: {
		file: './bundle.js',
		format: 'iife',
	},

	plugins: [
		includePaths({
			paths: ['.'],
			extensions: ['.wgsl']
		}),
		url({
			include: [
				'**/*.wgsl',
			],
		}),
		typescript({
			tsconfig: './tsconfig.json',
		}),
	]
}
