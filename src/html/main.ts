// export = ; at the top is required to get rid of
// Object.defineProperty(exports, "__esModule", {value: true});
// at the top of the transpiled js file.
// Otherwise global variables do not work.
// See here https://github.com/microsoft/TypeScript/issues/14351
export = 0;

declare let acquireVsCodeApi: any;
declare let document: any;
declare let hexPrefix: string;	// Prefix for hex values (e.g. "0x").

const vscode = acquireVsCodeApi();



// The last result in the calculator.
let lastResult: number;



// Get used elements.
const decimalOutput = document.getElementById("dec_output");
const hexOutput = document.getElementById("hex_output");
const decimalInput = document.getElementById("dec_input");
const hexInput = document.getElementById("hex_input");


/**
 * Returns the hex string for a value.
 */
function getHexString(value: number) {
	let digitCount;
	if (value > 0xFFFF)
		digitCount = 8;
	else if (value > 0xFF)
		digitCount = 4;
	else
		digitCount = 2;
	const hex = hexPrefix + value.toString(16).toUpperCase().padStart(digitCount, '0');
	return hex;
}


/**
 * Scrolls the decimal and hex output to the bottom.
 */
function scrollToBottom() {
	decimalOutput.scrollTop = decimalOutput.scrollHeight;
	hexOutput.scrollTop = hexOutput.scrollHeight;
}


/**
 * Clears/initializes the calculator values.
 */
function clearCalculator() {
	lastResult = 0;
	// Output
	const initText = '<br>'.repeat(50);
	decimalOutput.innerHTML = initText + lastResult.toString();
	hexOutput.innerHTML = initText + getHexString(lastResult);
	scrollToBottom();
	// Input
	decimalInput.value = '';
	hexInput.value = '';
}


/**
 * Called for a keypress on the decimal input.
 * @param obj The input element.
 * @param event The keypress event.
 */
function keypress(obj, event, numberBase) {
	let text = obj.value.trim();

	// Check for invalid input
	let regex;
	if (numberBase == 16) {
		// Hex
		regex = /^([+\-\*\/]?)\s*([0-9a-f]*)$/i;
	}
	else {
		// Decimal
		regex = /^([+\-\*\/]?)\s*([0-9]*)$/;
	}
	const match = regex.exec(text);
	if (!match) {
		// Invalid
		obj.classList.add('error');
		return;
	}

	// Valid
	obj.classList.remove('error');

	// Enter pressed ?
	if (event.keyCode == 13) {
		// Check if a number has been entered
		const digits = match[2];
		if (!digits)
			return;	// No number

		// Convert to number
		const digitsValue = parseInt(digits, numberBase);

		// Check for math symbol
		const mathSymb = match[1];
		let htmlDec = '';
		let htmlHex = '';
		if (mathSymb) {
			htmlDec += '<br>' + mathSymb + digitsValue.toString();
			htmlHex += '<br>' + mathSymb + getHexString(digitsValue);
		}
		switch (mathSymb) {
			case '+':
				lastResult += digitsValue;
				break;
			case '-':
				lastResult -= digitsValue;
				break;
			case '*':
				lastResult *= digitsValue;
				break;
			case '/':
				lastResult /= digitsValue;
				break;
			default:
				lastResult = digitsValue;
				break;
		}

		// Make sure it is an integer
		lastResult = Math.floor(lastResult);

		// Add the result itself
		htmlDec += '<br>' + lastResult.toString();
		htmlHex += '<br>' + getHexString(lastResult);

		// Set value in box
		decimalOutput.innerHTML += htmlDec;
		hexOutput.innerHTML += htmlHex;

		// Scroll to bottom
		scrollToBottom();

		// Clear input value
		obj.value = '';
		return;
	}
}


/**
 * Send message that donate button has been clicked.
 */
function donateClicked() {
	vscode.postMessage({
		command: 'donateClicked'
	});
}


// INIT
clearCalculator();
