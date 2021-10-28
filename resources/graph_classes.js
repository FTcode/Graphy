class Graph {
	/** Constructor method called when the class is instantiated. */
	constructor() {
		this.vertices = []
		this.edges = []
	}
	
	toJSON() {
		let obj = {
			vertices: [],
			edges: []
		}
		
		// Vertices can be added as-is
		this.vertices.forEach(v => obj.vertices.push(v))
		
		// Edges need to be modified to only store the name of their vertices,
		// rather than all the vertices' data (to avoid duplication)
		this.edges.forEach(e => {
			obj.edges.push({v1: e.v1.label, v2: e.v2.label, weight: e.weight})
		})
		
		return JSON.stringify(obj)
	}
	
	static fromJSON(string) {
		let obj = JSON.parse(string)
		let graph = new Graph()
		
		// Store a reference to each vertex by its label,
		// so edge creation is easier.
		let vertex_dict = {}
		
		obj.vertices.forEach(vertex => {
			graph.addVertex(new Vertex(vertex.x, vertex.y, vertex.label))
			vertex_dict[vertex.label] = vertex
		})
		
		obj.edges.forEach(edge => {
			graph.createEdge(vertex_dict[edge.v1], vertex_dict[edge.v2], edge.weight)
		})
		
		return graph
	}
	
	/** Add the given vertex to the graph. */
	addVertex(vertex) {
		this.vertices.push(vertex)
	}
	
	/** Create an edge connecting vertex1 and vertex2. */
	createEdge(vertex1, vertex2, weight) {
		let edge
		if (weight === undefined) {
			edge = new Edge(vertex1, vertex2)
		} else {
			edge = new WeightedEdge(vertex1, vertex2, weight)
		}
		this.edges.push(edge)
	}
	
	/** Checks whether any vertex on the graph has the label given. */
	labelInUse(label) {
		for (let i = 0; i < this.vertices.length; i++) {
			if (this.vertices[i].label == label) {
				return true
			}
		}
		return false
	}
	
	/** Calculates the next default label for a new vertex on the graph. */
	nextVertexLabel() {
		let label = "A"
		
		while (this.labelInUse(label)) {
			// If 'Z', start counting with numbers.
			if (label == "Z") label = 1
			
			// If a letter, get next letter
			else if (typeof(label) == "string") {
				label = String.fromCharCode(label.charCodeAt(0) + 1)
			}
			// If a number, increment
			else label++
		}
		return label
	}

	/** Returns all vertices which are neighbours to the one provided. */
	getNeighbours(vertex) {
		let neighbours = []
		for (let i = 0; i < this.edges.length; i++) {
			let edge = this.edges[i]
			if (edge.v1 === vertex) {
				neighbours.push(edge.v2)
			} else if (edge.v2 === vertex) {
				neighbours.push(edge.v1)
			}
		}
		return neighbours
	}

	/** Find the degree of the given vertex. */	
	getDegree(vertex) {
		let degree = 0
		for (let i = 0; i < this.edges.length; i++) {
			let edge = this.edges[i]
			if (edge.v1 === vertex || edge.v2 === vertex) {
				degree++
			}
		}
		return degree
	}
	
	/** Checks whether the graph is connected, returning a boolean. */
	isConnected() {
		// Handle edge cases
		if (this.vertices.length < 2) {
			return true
		}
		
		// Create list of visited vertices, and queue of vertices to visit next.
		let visited = []
		let queue = []

		// Pick an arbitrary starting vertex.
		queue.push(this.vertices[0])

		while (queue.length > 0) {
			let v = queue.shift()
			visited.push(v)
			this.getNeighbours(v).forEach(function (n) {
				if (!visited.includes(n) && !queue.includes(n)) {
					queue.push(n)
				}
			})
		}
		return (visited.length == this.vertices.length)		
	}
	
	/** Checks whether the graph is Eulerian, returning a boolean. */
	isEulerian() {
		// Handle edge cases.
		if (this.vertices.length < 2) {
			return true
		}

		if (!this.isConnected()) {
			return false
		}
		
		// Check that all vertices are of even degree.
		for (let i = 0; i < this.vertices.length; i++) {
			if (this.getDegree(this.vertices[i]) % 2 != 0) {
				return false
			}
		}
		return true
	}
	
	/** Checks whether the graph is semi-Eulerian, returning a boolean. */
	isSemiEulerian() {
		if (this.vertices.length < 2) {
			return false
		}
		
		if (!this.isConnected()) {
			return false
		}
		
		// Check that only two vertices are of odd degree.
		let odd_vertices = 0
		for (let i = 0; i < this.vertices.length; i++) {
			if (this.getDegree(this.vertices[i]) % 2 != 0) {
				odd_vertices++
			}
		}
		
		return (odd_vertices == 2)
	}
	
	/** Checks whether the graph is simple, returning a boolean. */
	isComplete() {
		let v = this.vertices.length
		let e = this.edges.length
		return (e == (v * (v - 1) / 2))
	}
	
	/** Checks whether the graph is a tree, returning a boolean. */
	isTree() {
		let v = this.vertices.length
		let e = this.edges.length
		return (this.isConnected() && e == v - 1)
	}
	
	/** Checks whether the graph is weighted, returning a boolean. */
	isWeighted() {
		for (let i = 0; i < this.edges.length; i++) {
			if (this.edges[i].weight === undefined) {
				return false
			}
		}
		return true
	}
	
	/** Checks whether an edge exists between a and b, reutrning a boolean. */
	edgeExists(a, b) {
		for (let i = 0; i < this.edges.length; i++) {
			if (this.edges[i].connects(a, b)) {
				return true
			}
		}
		return false
	}
	
	
	/** Find the edge connecting a and b, returning undefined if it does not exist. */
	getEdge(a, b) {
		for (let i = 0; i < this.edges.length; i++) {
			if (this.edges[i].connects(a, b)) {
				return this.edges[i]
			}
		}
		return undefined
	}
	
	/** Checks whether a path exists between a and b, returning a boolean. */
	pathExists(a, b) {
		// Begin a depth-first search from vertex A.
		let visited = []
		let queue = [a]
		
		while (queue.length > 0) {
			let v = queue.shift()
			
			// If B is visited, then the path exists, so return true.
			if (v == b) {
				return true
			}
			
			visited.push(v)
			this.getNeighbours(v).forEach(function (n) {
				if (!visited.includes(n) && !queue.includes(n)) {
					queue.push(n)
				}
			})
		}
		
		// If B was not visited, then return false.
		return false
	}
	
	/** Returns a Hamiltonian cycle if one exists, undefined otherwise. */
	findHamiltonianCycle() {
		// Handle edge cases
		if (this.vertices.length == 1) {
			return this.vertices
		}
		
		if (!this.isConnected() || this.vertices.length == 2) {
			return undefined
		}
		
		// Pick an arbitrary starting vertex.
		let start = this.vertices[0]
		
		// Using all possible permutations of the remaining vertices...
		let remaining = this.vertices.slice(1)
		let permutations = permute(remaining)
		for (let i = 0; i < permutations.length; i++) {
			// Create a potential cycle.
			let cycle = [start].concat(permutations[i], [start])
			let valid = true
			
			// Check if each pair of adjacent vertices is connected.
			for (let j = 0; j < cycle.length - 1; j++) {
				let a = cycle[j]
				let b = cycle[j+1]
				if (!this.edgeExists(a, b)) {
					valid = false
				}
			}

			// If the cycle is valid, return it.
			if (valid) {
				return cycle
			}			
		}
		return undefined
	}
	
	/** Returns a string listing the graph's main properties. */
	propertiesString() {
		// List properties
		let properties = []
		properties.push(this.isConnected() ? "Connected" : "Disconnected")
		properties.push(this.isEulerian() ? "Eulerian" : 
			(this.isSemiEulerian() ? "Semi-Eulerian" : "Non-Eulerian"))	
		if (this.isTree()) properties.push("a Tree");
		if (this.isComplete()) properties.push("Complete");
		
		
		let string = '<p>This graph is <b>' + properties.join(', ') + '</b></p>'
		
		// Append Hamiltonian cycle information
		let hcycle = graph.findHamiltonianCycle()
		if (hcycle == undefined) {
			string += ('<p>This graph has <b>no</b> Hamiltonian cycle.</p>')
		} else {
			string += ('<p>This graph has a Hamiltonian cycle: <b>' 
			+ hcycle.map(v => v.label).join(' ') +'</b></p>')
		}

		return string
	}
	
	/** Returns the length of the shortest path from 'start' to 'end'.
	(Using Dijkstra's shortest path algorithm) */
	shortestDist(start, end) {
		// Ensure both vertices are on the graph.
		if (!this.vertices.includes(start) || !this.vertices.includes(end)) {
			return undefined
		}
		
		// Ensure the path exists.
		if (!this.pathExists(start, end)) {
			return undefined
		}
		
		// Set up variables required for the algorithm.
		let dist = new Map()
		let prev = new Map()
		let unvisited = []
		
		this.vertices.forEach(v => {
			dist[v.label] = Infinity
			prev[v.label] = undefined
			unvisited.push(v)
		})		
		dist[start.label] = 0
		
		// Main loop of the algorithm.
		while (unvisited.length > 0) {
			// Select the next vertex to visit (u)
			let u = unvisited.reduce((x,y) => dist[x.label] < dist[y.label] ? x : y)
			// Remove u from unvisited.
			unvisited = unvisited.filter(item => item !== u)
			
			// If u is the target, the algorithm is complete.
			if (u == end) {
				break
			}
			
			// Otherwise, work out distances to neighbours, and update if necessary.
			this.getNeighbours(u).forEach(v => {
				if (unvisited.includes(v)) {
					let alt = dist[u.label] + this.getEdge(u, v).weight
					if (alt < dist[v.label]) {
						dist[v.label] = alt
						prev[v.label] = u
					}
				}
			})
		}
		return dist[end.label];
	}
}

class Vertex {
	/** Constructor method called when the class is instantiated. */
	constructor(x, y, label) {
		// Save parameters as local attributes.
		this.x = x
		this.y = y
		this.label = label
	}
	
	/** Checks whether the vertex contains the given point. */
	containsPoint(point) {
		return (this.squaredDistance(point) <= 4 * Vertex.RADIUS * Vertex.RADIUS)
	}

	/** Returns the squared distance between the vertex and the point. */
	squaredDistance(point) {
		let dx = this.x - point.x
		let dy = this.y - point.y
		return (dx * dx) + (dy * dy)
	}
	
	/** Draw the vertex to the canvas context provided. */
	draw(ctx, color = Vertex.DEFAULT_COLOR) {
		ctx.fillStyle = color
		ctx.strokeStyle = color
		ctx.lineWidth = 1
		
		// Draw point
		ctx.beginPath()
		ctx.ellipse(this.x, this.y, Vertex.RADIUS, Vertex.RADIUS, 0, 0, 2*Math.PI)
		ctx.closePath()
		ctx.fill()
		
		// Draw label
		ctx.font = APP_FONT
		ctx.textAlign = 'center'
		ctx.textBaseline = 'bottom'
		ctx.fillText(this.label, this.x, this.y - Vertex.RADIUS)
	}
}
Vertex.DEFAULT_COLOR = '#000000'
Vertex.SELECTED_COLOR = '#33ee33'
Vertex.RADIUS = 5

class Edge {	

	/** Constructor method called when the class is instantiated. */
	constructor(vertex1, vertex2) {
		// Save parameters as local attributes.
		this.v1 = vertex1
		this.v2 = vertex2
	}
	
	/** Checks whether the edge connects the two given vertices. */
	connects(a, b) {
		return ((a === this.v1 && b === this.v2) || (a === this.v2 && b === this.v1))
	}
	
	/** Draws the edge to the 2D canvas context, in the specified colour. */
	draw(ctx, color = Edge.DEFAULT_COLOR) {
		ctx.strokeStyle = color
		ctx.lineWidth = 1
		
		ctx.beginPath()
		ctx.moveTo(this.v1.x, this.v1.y)
		ctx.lineTo(this.v2.x, this.v2.y)
		ctx.stroke()
		ctx.closePath()
	}
}

Edge.DEFAULT_COLOR = '#000000'

class WeightedEdge extends Edge {
	/** Constructor method called when the class is instantiated. */
	constructor(vertex1, vertex2, weight) {
		super(vertex1, vertex2)
		this.weight = weight
	}
	
	/** Draws the vertex to the canvas context provided, in the colour provided. */
	draw(ctx, color = Edge.DEFAULT_COLOR) {
		super.draw(ctx, color)
		// Calculate midpoint
		let x = (this.v1.x + this.v2.x) / 2
		let y = (this.v1.y + this.v2.y) / 2
		
		ctx.font = APP_FONT
		ctx.textAlign = 'center'
		ctx.textBaseline = 'middle'
		ctx.fillStyle = color
		ctx.strokeStyle = '#ffffff'
		ctx.lineWidth = 3

		ctx.beginPath()
		ctx.strokeText(this.weight, x, y)
		ctx.fillText(this.weight, x, y)
		ctx.fill()
		ctx.stroke()
		ctx.closePath()
	}
}

class Algorithm {
	constructor(name, func) {
		this.name = name;
		this.func = func;
	}
}

/** Helper function which finds all permutations of a list. */
function permute(permutation) {
	var length = permutation.length,
		result = [permutation.slice()],
		c = new Array(length).fill(0),
		i = 1, k, p;

	while (i < length) {
		if (c[i] < i) {
			k = i % 2 && c[i]
			p = permutation[i]
			permutation[i] = permutation[k]
			permutation[k] = p
			++c[i]
			i = 1
			result.push(permutation.slice())
		} else {
			c[i] = 0
			++i
		}
	}
	return result
}