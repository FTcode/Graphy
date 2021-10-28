/** Asynchronously perform Prim's Algorithm on the graph, with
highlights and annotations at each step for the user. */
async function primMST() {		
	// Pick an artbirary starting vertex.
	let connected = [graph.vertices[0]]
	let tree = []
	
	// Display step to the user
	highlighted.push(connected[0])
	let resume = await showAlgorithmStep("First, we pick an arbitrary starting vertex: <b>" 
		+ connected[0].label + "</b>")
	if (!resume) return;
		

	while (connected.length < graph.vertices.length) {
		// List potential edges
		let potentialEdges = []
		for (let i = 0; i < graph.edges.length; i++) {
			edge = graph.edges[i]
			if ((connected.includes(edge.v1) && !connected.includes(edge.v2))
				|| (connected.includes(edge.v2) && ! connected.includes(edge.v1))) {
				potentialEdges.push(edge)
			}
		}
		
		// Append shortest edge to the tree.
		let minEdge = potentialEdges.reduce(
			(min, edge) => (edge.weight < min.weight ? edge : min),
			potentialEdges[0]
		)
		
		tree.push(minEdge);
		highlighted.push(minEdge);
		
		[minEdge.v1, minEdge.v2].forEach(v => {
			if (!connected.includes(v)) { 
				connected.push(v)
				highlighted.push(v)
			}
		})
		
		// Display step to the user
		let resume = await showAlgorithmStep("The next shortest edge leading to a new vertex is <b>" +
			minEdge.v1.label + minEdge.v2.label + "</b>, so we add this to the tree.")
		if (!resume) return;
	}
	
	let totalWeight = 0
	tree.forEach(e => { totalWeight += e.weight })
	
	// Display algorithm result to the user.
	await showAlgorithmStep("All vertices are now in the tree, so the algorithm is complete." +
		"<p>The weight of the tree is <b>" + totalWeight + ".</b></p>", true)
}