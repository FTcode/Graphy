/** Asynchronously perform Kruskal's Algorithm on the graph, with
highlights and annotations at each step for the user. */
async function kruskalMST() {
	// Create a sub-graph containing only the graph's vertices.
	tree = new Graph()
	tree.vertices = graph.vertices
	
	// Copy the original edges, and sort in ascending order of weight.
	let potentialEdges = graph.edges.concat()
	potentialEdges.sort((x,y) => x.weight - y.weight)
	
	// Select the first edge, and display this step to the user.
	let nextEdge = potentialEdges.shift()
	tree.edges.push(nextEdge)
	highlighted.push(nextEdge, nextEdge.v1, nextEdge.v2)
	
	let resume = await showAlgorithmStep("The shortest edge, <b>"
		+ nextEdge.v1.label + nextEdge.v2.label + "</b>, is added to the tree.")
	if (!resume) return;
	
	// Repeatedly add the next edge that doesn't create a cycle.
	while (!tree.isTree()) {
		nextEdge = potentialEdges.shift()
		
		if (tree.pathExists(nextEdge.v1, nextEdge.v2)) {
			// Tell user that the edge has been disregarded.
			let resume = await showAlgorithmStep("The next shortest edge, <b>"
				+ nextEdge.v1.label + nextEdge.v2.label + "</b> would create a cycle, so we disregard it.")
			if (!resume) return;

		} else {
			// Tell user that the edge has been added.
			tree.edges.push(nextEdge)
			highlighted.push(nextEdge, nextEdge.v1, nextEdge.v2)
			let resume = await showAlgorithmStep("The next shortest edge, <b>"
				+ nextEdge.v1.label + nextEdge.v2.label + "</b> does not create a cycle, and is added to the tree.")
			if (!resume) return;
		}
	}
	
	let totalWeight = 0
	tree.edges.forEach(e => { totalWeight += e.weight})
	
	// Display algorithm result to the user.
	await showAlgorithmStep("All vertices are now in the tree, so the algorithm is complete." +
		"<p>The weight of the tree is <b>" + totalWeight + ".</b></p>", true)
}