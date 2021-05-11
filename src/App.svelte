<script lang="typescript">
	let currentNum = [];
	let data = "0"; //variable que muestra datos por pantalla
	let paramA; //primera variable que añadimos y tambien el resultado final
	let paramB; //variable 2

	function getNumber(num) {
		currentNum.push(num);
		data = currentNum.toString().replace(/,/g, '');
		if (operator == undefined) { 
			paramA = data.split(" ");
			paramA = parseFloat(paramA);
		}
		else { paramB = parseFloat(data); }
	}

	let operator;
	function chooseOperator(typeOf) { 
		currentNum = []
		return operator = typeOf;
	}

	function calc() {
		switch (operator) {
			case "add":
				paramA = paramA + paramB;
			return data = paramA.toString();

			case "subtract":
				paramA = paramA - paramB;
			return data = paramA.toString(); 

			case "multiply":
				paramA = paramA * paramB;
			return data = paramA.toString();

			case "divide":
				if(paramB !== 0) { 
					paramA = paramA / paramB;
					return data = paramA.toString();
				}
				else {
					paramA = undefined; 
					return data = "Error";
				}
			case "percent":
				paramA = paramA / 100;
			return data = paramA.toString();

			case "posinegative":
				paramA = paramA * -1;
			return data = paramA.toString();

			case "clear":
				currentNum = [];
				console.log(data);
				operator = undefined;
				paramA = undefined;
			return data = "0";
		}
	}
</script>

<main class="calculator">
	<!-- RESULTAT -->
	<div class="resultats">
		<p>{data}</p>
	</div>
	
	<!-- NUMPAD -->
	<div class="calculator__keys">
		<button id="clear" on:click={()=>{ chooseOperator("clear"); calc()} } class="lightGray">AC</button>
		<button id="posinegative" on:click={()=>{ chooseOperator("posinegative"); calc() }} class="lightGray">+/-</button>
		<button id="percent" on:click={()=>{ chooseOperator("percent"); calc() }} class="lightGray">%</button>
		<button id="divide" on:click={()=>{ chooseOperator("divide") }} class="orange">÷</button>
		<button on:click={()=>{ getNumber(7) }} id="num7">7</button>
		<button on:click={()=>{ getNumber(8) }} id="num8">8</button>
		<button on:click={()=>{ getNumber(9) }} id="num9">9</button>
		<button id="multiply" on:click={()=>{ chooseOperator("multiply") }}  class="orange">×</button>
		<button on:click={()=>{ getNumber(4) }} id="num4">4</button>
		<button on:click={()=>{ getNumber(5) }} id="num5">5</button>
		<button on:click={()=>{ getNumber(6) }} id="num6">6</button>
		<button id="less" on:click={()=>{ chooseOperator("subtract") }} class="orange">−</button>
		<button on:click={()=>{ getNumber(1) }} id="num1">1</button>
		<button on:click={()=>{ getNumber(2) }} id="num2">2</button>
		<button on:click={()=>{ getNumber(3) }} id="num3">3</button>
		<button id="plus" on:click={()=>{ chooseOperator("add") }} class="orange">+</button>
		<button on:click={()=>{ getNumber(0) }} id="num0" class="zero">0</button>
		<button on:click={()=>{ getNumber(".") }} id="decimal">,</button>
		<button id="equal" on:click={calc} class="orange">=</button>
	</div>
</main>
