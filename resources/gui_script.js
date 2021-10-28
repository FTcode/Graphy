// Declare constants.
const BG_COLOR = '#ffffff'
const APP_FONT = '15px Arial'
const HIGHLIGHT_COLOR = '#ff1111'
const modes = {
	ADD_VERTEX: 0,
	ADD_EDGE: 1,
	PROPERTIES: 2,
	ALGORITHMS: 3,
}

// Make list of algorithms (functions are in external files)
const algorithms = [
	new Algorithm("Prim's Algorithm", primMST),
	new Algorithm("Kruskal's Algorithm", kruskalMST),
	new Algorithm("Route Inspection", routeInspection)
]

// Declare global environment variables.
var canvas, ctx, messageBox, errorBox, mousePos;
var graph, mode;
var selectedVertex;
var highlighted;
var modeChanged;

/** Change the GUI mode. */
function setMode(m) {
	modeChanged = true
	mode = m
	draw()
}

/** Function called after the HTML page is first loaded. */
function setup() {
	// Populate global variables.
	canvas = document.getElementById('app-canvas')
	ctx = canvas.getContext('2d')
	messageBox = document.getElementById('message-box')
	errorBox = document.getElementById('error-box')
	graph = new Graph()
	
	// Set up event handlers.
	canvas.onclick = canvasClicked
	canvas.onmousemove = function(event) { 
		mousePos = getMousePos(event, canvas)
		draw()
	}
	
	document.getElementById('add-vertex').onclick = function() {
		setMode(modes.ADD_VERTEX)
		messageBox.innerHTML = '<p>Click an empty space to create a vertex.</p>' +
			'<p>Custom label: <input type = "checkbox" id = "use-custom"></input>' +
			'<input type = "text" id = "custom-lbl"></input></p>'
		errorBox.innerHTML = ''
	}
	
	document.getElementById('add-edge').onclick = function() {
		setMode(modes.ADD_EDGE)
		messageBox.innerHTML = '<p>Click one vertex, followed by another, to create an edge.</p>' +
			'<p>Weighted: <input type = "checkbox" id = "weighted"></input>' +
			'Weight: <input type = "text" id = "weight"></input></p>'
		errorBox.innerHTML = ''
		selectedVertex = null
	}
	
	document.getElementById('properties').onclick = function() {
		if (graph.vertices.length == 0) {
			errorBox.innerHTML = 'Cannot find properties of an empty graph!'
			return
		}
		setMode(modes.PROPERTIES)
		messageBox.innerHTML = graph.propertiesString()
		errorBox.innerHTML = ''
	}
	
	/* For each algorithm, create a button to execute the algorithm. */
	algorithms.forEach(algorithm => {
		let btn = document.createElement("BUTTON")
		let btn_row = document.getElementById("button-row")
		
		// Set the button's label to the algorithm's name.
		btn.innerHTML = algorithm.name
		// When the button is clicked, validate the graph, then call
		// the algorithm's function.
		btn.onclick = function() {
			if (validateGraph()) {
				highlighted = []
				setMode(modes.ALGORITHMS)
				messageBox.innerHTML = ''
				errorBox.innerHTML = ''
				algorithm.func()
			}
		}
		btn_row.appendChild(btn)
	})
	
	document.getElementById("export").onclick = function() {
		downloadCanvas(canvas, "MyGraph.png")
	}
	
	document.getElementById("save").onclick = function() {
		if (graph.vertices.length === 0) {
			errorBox.innerHTML = 'Cannot save an empty graph!'
			return
		}
		
		let xhr = new XMLHttpRequest();
		xhr.open("POST", "/save", true);
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.send(graph.toJSON());
		xhr.onload = function() {
			// Remove old ID from URL (if present)
			window.history.pushState({}, document.title, "/")
			
			ID = this.responseText
			URL = document.location.href + "?graph=" + ID
			let clickable = document.createElement("a");
			clickable.href = URL
			clickable.text = URL
			swal({
				title: "Graph link created!", 
				content: clickable, 
				icon: "success"
			})
			
			// Add new ID to URL.
			window.history.pushState({}, document.title, "/?graph=" + ID)
		}
	}
	
	let id = getURLparam('graph')
	
	if (id) {
		let xhr = new XMLHttpRequest()
		xhr.open("POST", "/load", true)
		xhr.setRequestHeader('Content-Type', 'application/json')
		xhr.send(JSON.stringify({"id": id}))
		xhr.onload = function() {
			let graphJSON = this.responseText
			if (graphJSON) {
				graph = Graph.fromJSON(graphJSON)
				draw()
			} else {
				swal({
					title: "Graph not found!", 
					text: "Could not load graph with ID: " + id, 
					icon: "error"
				})
				// Remove ID from URL
				window.history.pushState({}, document.title, "/")
			}
		}
	}
	
	draw()
}
window.onload = setup

/** Function called when the canvas is clicked. */
function canvasClicked(event) {
	let point = mousePos
	let vertexClicked = null
	
	// Detect if a vertex was clicked.
	for (let i = 0; i < graph.vertices.length; i++) {
		if (graph.vertices[i].containsPoint(point)) {
			vertexClicked = graph.vertices[i]
			break
		}
	}
	
	// Call the correct click handler, depending on the current mode.
	switch (mode) {
		case modes.ADD_VERTEX:
			addVertexClick(point, vertexClicked)
			break
		case modes.ADD_EDGE:
			addEdgeClick(point, vertexClicked)
			break
		default:
			break
	}
	
	// Update the canvas.
	draw()
}

/** Function called when the canvas is clicked in 'Add Vertex' mode. */
function addVertexClick(point, vertexClicked) {
	if (vertexClicked) {
		errorBox.innerHTML = 'Too close to an existing vertex!'
		return
	}
	
	// Load HTML elements to see if the user has entered a custom label
	let checkBox = document.getElementById('use-custom')
	let inputField = document.getElementById('custom-lbl')
	let label
	
	// Handle custom labels
	if (checkBox.checked) {
		label = inputField.value
		
		// Presence check: ensure the label is non-empty.
		if (label.length == 0) {
			errorBox.innerHTML = 'Vertex labels must be non-empty!'
			return
		}
		
		// Ensure the label is alphanumeric
		else if (label.match(/^[a-z0-9]+$/i) === null) {
			errorBox.innerHTML = 'Vertex labels must be alphanumeric!'
			return
		}
		
		// Ensure the label is not already in use.
		else if (graph.labelInUse(label)) {
			errorBox.innerHTML = 'There is already a vertex with that name!'
			return
		}
	} else {
		label = graph.nextVertexLabel()
	}
	
	// Create a vertex and add it to the graph.
	let vertex = new Vertex(point.x, point.y, label)
	graph.addVertex(vertex)
	errorBox.innerHTML = ''
}

/** Function called when the canvas is clicked in 'Add Edge' mode. */
function addEdgeClick(point, vertexClicked) {
	if (vertexClicked) {
		// If no vertex is selected, select the clicked vertex.
		if (selectedVertex == null) {
			selectedVertex = vertexClicked
			return
		} 
		// If the selected vertex was clicked, show the error message.
		if (selectedVertex === vertexClicked) {
			errorBox.innerHTML = 'Cannot create an edge from a vertex to itself!'
			selectedVertex = null
			return
		} 
		// Check whether the edge already exists.
		for (let i = 0; i < graph.edges.length; i++) {
			if (graph.edges[i].connects(vertexClicked, selectedVertex)) {
				errorBox.innerHTML = 'There is already an edge there!'
				selectedVertex = null
				return
			}
		}
		
		// Validate the weight
		let checkBox = document.getElementById('weighted')
		let inputField = document.getElementById('weight')
		let weight
		
		if (checkBox.checked) {
			weight = parseFloat(inputField.value, 10)
			if (isNaN(weight)) {
				errorBox.innerHTML = 'Please enter a valid weight!'
				selectedVertex = null
				return
			} else if (weight < 0) {
				errorBox.innerHTML = 'Edge weights cannot be negative!'
				selectedVertex = null
				return
			}
		}

		graph.createEdge(vertexClicked, selectedVertex, weight)
		errorBox.innerHTML = ''
		selectedVertex = null
	} else {
		selectedVertex = null
	}
}

/** Show an algorithm step, and wait until the user clicks 'Next Step'. */
async function showAlgorithmStep(message, last = false) {
	if (last) {
		messageBox.innerHTML = '<p>' + message + '</p>'
		return true
	}
	
	messageBox.innerHTML = '<p>' + message + '</p>'
							+ '<p><button id = "next-step">Next Step</button><p>'
							
	let waiting = true
	modeChanged = false
	document.getElementById("next-step").onclick = function() {
		waiting = false
	}
	
	draw()
	
	while (waiting) {
		// Return if a different mode is selected.
		if (modeChanged) return false;
		// Wait, without stopping the other browser functionality from runnning
		await new Promise(res => setTimeout(res, 50))
	}
	
	return true
}

/** Checks whether the graph is valid for algorithms, showing an error if not. */
function validateGraph() {
	if (graph.vertices.length === 0) {
		errorBox.innerHTML = "Cannot run algorithms on empty graphs!"
		return false
	} else if (!graph.isConnected()) {
		errorBox.innerHTML = "Cannot run algorithms on disconnected graphs!"
		return false
	} else if (!graph.isWeighted()) {
		errorBox.innerHTML = "All edges must be weighted to run algorithms!"
		return false
	} else {
		return true
	}
}

/** Get the mouse position of a mouse click, relative to the canvas. */
function getMousePos(event, canvas) {
	let rect = canvas.getBoundingClientRect()
	return {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top
	}
}

/** Get the URL paramater (by name) the page was opened with. */
function getURLparam(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

/** Draw the graph to the canvas. */
function draw() {
	// Clear the canvas.
	ctx.clearRect(0, 0, canvas.width, canvas.height)
	
	// Draw the background color.
	ctx.fillStyle = BG_COLOR
	ctx.beginPath()
	ctx.rect(0, 0, canvas.width, canvas.height)
	ctx.fill()
	ctx.closePath()
	
	// Draw the edges.
	graph.edges.forEach(function(e) {
		if (mode == modes.ALGORITHMS && highlighted.includes(e)) {
			e.draw(ctx, HIGHLIGHT_COLOR)
		} else {
			e.draw(ctx)
		}
	})
	
	// Draw the vertices.
	graph.vertices.forEach(function(v) {
		if (mode == modes.ADD_EDGE && v === selectedVertex) {
			v.draw(ctx, Vertex.SELECTED_COLOR)
			ctx.strokeStyle = Vertex.SELECTED_COLOR
			ctx.lineWidth = 1
			ctx.beginPath()
			ctx.moveTo(v.x, v.y)
			ctx.lineTo(mousePos.x, mousePos.y)
			ctx.stroke()
			ctx.closePath()
		} else if (mode == modes.ALGORITHMS && highlighted.includes(v)) {
			v.draw(ctx, HIGHLIGHT_COLOR)
		} else {
			v.draw(ctx)
		}
	})
}