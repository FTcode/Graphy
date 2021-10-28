/** Asynchronously perform Route Inspection on the graph, with
highlights and annotations at each step for the user. */
async function routeInspection() {
	// Calculate the total weight of the graph's edges.
	let totalWeight = 0
	graph.edges.forEach(e => { totalWeight += e.weight })
	
	// Display this to the user.
	let resume = await showAlgorithmStep("The total weight of the graph's edges is <b>"
		+ totalWeight + ".</b>")
	if (!resume) return;
	
	// Handle Eulerian graphs.
	if (graph.isEulerian()) {
		await showAlgorithmStep("The graph is Eulerian, so it can be traversed without repeating edges."
			+ "<p>Therefore the optimal route has length <b>" + totalWeight + ".</b></p>", true)
		return
	}
	
	// Find all odd vertices, and possible pairings.
	let oddVertices = graph.vertices.filter(v => graph.getDegree(v) % 2 === 1)
	let oddPairings = allPairings(oddVertices)
	
	
	// Display this to the user.
	highlighted = oddVertices;
	resume = await showAlgorithmStep("The graph has <b>"
		+ oddVertices.length + "</b> odd vertices: "
		+ "<b>" + oddVertices.map(v => v.label).join(", ") + ".</b>")
	if (!resume) return;
	
	// Handle semi-Eulerian graphs.
	if (oddVertices.length == 2) {
		let weight = graph.shortestDist(oddVertices[0], oddVertices[1])
		await showAlgorithmStep("The shortest path between these has length <b>" + weight + "</b>."
			+ "<p>Therefore the optimal route has length <b>"
			+ totalWeight + " + " + weight + " = " + (totalWeight + weight)
			+ ".</b></p>", true)
		return
	}
	
	resume = await showAlgorithmStep("There are <b>"
		+ oddPairings.length + "</b> ways to pair these: "
		+ "<b>" + oddPairings.map(pairing => pairing.map(pair => pair[0].label + pair[1].label).join(" ")).join(", ")
		+ "</b>")
	if (!resume) return;
	
	// Calculate the additional path length of each pairing.
	let pairingWeights = []
	oddPairings.forEach(function(pairing) {
		let weight = 0;
		pairing.forEach(pair => {
			weight += graph.shortestDist(pair[0], pair[1])
		})
		pairingWeights.push(weight)
	})
	
	// Select the shortest pairing.
	let shortestWeight = Math.min(...pairingWeights)
	let optimalWeight = shortestWeight + totalWeight
	
	// Display this to the user.
	resume = await showAlgorithmStep("Their additional path lengths are "
		+ "<b>" + pairingWeights.join(", ") + "</b>, the shortest of which is "
		+ "<b>" + shortestWeight + "</b>.")
	if (!resume) return;
	
	
	resume = await showAlgorithmStep("Therefore, the length of the optimal route is "
		+ "<b>" + totalWeight + " + " + shortestWeight + " = " + optimalWeight + "</b>.", true)
}

/** Recursive function which returns all possible ways to 'pair' objects in a list. */
function allPairings(list) {
	// Base case: a list with two elements' only pairing is itself.
	if (list.length == 2) {
		return [[list]]
	}
	
	// Recursive case: take each possible pair of elements (i,j) and then
	// recursively pair the remaining elements.
	let pairings = [];
	let i = 0;
	
	for (let j = 1; j < list.length; j++) {
		let remaining = list.concat()
		remaining.splice(i,1)
		remaining.splice(j-1,1)
		
		allPairings(remaining).forEach(p => {
			let pairing = [[list[i], list[j]]]
			pairing.push(...p)
			pairings.push(pairing)
		})
	}
	
	return pairings;
}