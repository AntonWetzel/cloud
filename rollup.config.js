import typescript from 'rollup-plugin-typescript2'
import url from '@rollup/plugin-url'

export default {
	input: './src/main.ts',
	output: {
		file: './bundle.js',
		format: 'iife',
	},
	plugins: [
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
