class GlobalInput extends HTMLElement {
	constructor() {
		super()

		const name = this.getAttribute('name')
		const min = this.getAttribute('min')
		const max = this.getAttribute('max')
		const value = this.getAttribute('value')
		const step = this.getAttribute('step')
		const variable = this.getAttribute('variable')

		const shadow = this.attachShadow({mode: 'open'})

		const body = document.createElement('div')
		body.style.display = 'flex'
		body.title = name
		shadow.appendChild(body)

		const text = document.createElement('div')
		text.style.textAlign = 'left'
		text.innerText = name + ': '
		text.style.flexGrow = '0'
		body.appendChild(text)

		const val = document.createElement('input')
		val.type = 'number'
		val.style.textAlign = 'right'
		val.style.margin = '0px 10px 0px 10px'
		val.value = value
		val.min = min
		val.max = max
		val.step = step
		val.innerText = value
		val.style.flexGrow = '0'
		body.appendChild(val)

		const input = document.createElement('input')
		input.type = 'range'
		input.value = value
		input.min = min
		input.max = max
		input.step = step
		input.style.flexGrow = '1'
		body.appendChild(input)

		val.oninput = () => {
			window[variable] = val.valueAsNumber
			input.value = val.value
		}

		input.oninput = () => {
			window[variable] = input.valueAsNumber
			val.value = input.value
		}
		window[variable] = val.valueAsNumber
	}
}

customElements.define('global-input', GlobalInput)
