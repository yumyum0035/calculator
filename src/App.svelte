<script lang="typescript">
	let currentNum = [];
	let data = "0";
	let result;
	let paramA;
	let paramB;

	function getNumber(num) {
		currentNum.push(num);
		data = currentNum.toString().replace(/,/g, '');
		if (operator == undefined) { 
			paramA = data.split(" ");
			paramA = parseInt(paramA);
			console.log(paramA);
		}
		else { 
			paramB = parseInt(data); 
			console.log(paramB);
		}

	}

	let operator;
	function chooseOperator(typeOf) { 
		console.log(typeOf);
		currentNum = []
		return operator = typeOf; 
	}


	function calc() {
		switch (operator) {
			case "add":
				return result = paramA + paramB;
			case "subtract":
				return result = paramA - paramB;
			case "multiply":
				return result = paramA * paramB;
			case "divide":
				if(paramB !== 0) { return result = paramA / paramB; }
				else {
					data = "Error";
					return result = undefined; }
			case "percent":
				return result = paramA / 100;
			case "posinegative":
				return result = paramA * -1;
			case "clear":
				currentNum = [];
				data = "0";
				console.log(data);
				operator = undefined;
				return result = undefined;
		}
	}

</script>

<main class="calculator">
	<!-- RESULTAT -->
	<div class="resultats">
		{#if result != undefined} 
			<p>{result}</p>
			{:else}
			<p>{data}</p>
		{/if}
	</div>
	
	<!-- NUMPAD -->
	<div class="calculator__keys">
		<button id="clear" on:click={()=>{chooseOperator("clear"); calc()}} class="lightGray">AC</button>
		<button id="posinegative" on:click={()=>{chooseOperator("posinegative"); calc()}} class="lightGray">+/-</button>
		<button id="percent" on:click={()=>{chooseOperator("percent"); calc()}} class="lightGray">%</button>
		<button id="divide" on:click={()=>{chooseOperator("divide")}} class="orange">÷</button>
		<button on:click={()=>{getNumber(7)}} id="num7">7</button>
		<button on:click={()=>{getNumber(8)}} id="num8">8</button>
		<button on:click={()=>{getNumber(9)}} id="num9">9</button>
		<button id="multiply" on:click={()=>{chooseOperator("multiply")}}  class="orange">×</button>
		<button on:click={()=>{getNumber(4)}} id="num4">4</button>
		<button on:click={()=>{getNumber(5)}} id="num5">5</button>
		<button on:click={()=>{getNumber(6)}} id="num6">6</button>
		<button id="less" on:click={()=>{chooseOperator("subtract")}} class="orange">−</button>
		<button on:click={()=>{getNumber(1)}} id="num1">1</button>
		<button on:click={()=>{getNumber(2)}} id="num2">2</button>
		<button on:click={()=>{getNumber(3)}} id="num3">3</button>
		<button id="plus" on:click={()=>{chooseOperator("add")}} class="orange">+</button>
		<button on:click={()=>{getNumber(0)}} id="num0" class="zero">0</button>
		<button id="decimal">,</button>
		<button id="equal" on:click={calc}  class="orange">=</button>
	</div>
</main>
