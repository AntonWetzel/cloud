import { Node } from './node.js'

export class Empty extends Node {
	SubRender(): void {
		//pass
	}

	SubShadow = undefined
	SubMap = undefined
}
