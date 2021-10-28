// Import modules and declare constants.
const express = require('express')
const path = require('path')
const sqlite3 = require('sqlite3')
const app = express()
const port = 3000
const resources = path.join(__dirname, 'resources');

// Load the database, creating a blank one if it doesn't exist.
function loadDatabase() {
	graphDB = new sqlite3.Database("./graphs.db")
	graphDB.run('CREATE TABLE IF NOT EXISTS ' + 
		'Graph(GraphID text PRIMARY KEY , GraphJSON text);')
}

// Serve the static files from the HTML folder when requested.
app.use(express.static(resources))

// Decode POST requests using JSON when they are recieved.
app.use(express.json())

// When the URL is requested, show the main page.
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/resources/app.html'));
});

// When a POST request is made, save the graph to the database
app.post('/save', function(req, res) {
	// Create unique id, from datetime + random number
	let id = (new Date()).getTime().toString(36) + Math.random().toString(36).slice(2);
	let sql = 'INSERT INTO Graph(GraphID, GraphJSON) VALUES ("' 
		+ id + '", "' + encodeURI(JSON.stringify(req.body)) + '")';
	graphDB.run(sql)
	res.end(id)
});

app.post('/load', function(req, res) {
	let id = req.body.id
	// Ensure the id is alphanumeric, to avoid SQL insertion.
	if (!id.match(/^[0-9a-z]+$/)) {
		res.end(null)
		return
	}
	
	let sql = 'SELECT GraphJSON FROM Graph WHERE GraphID == "' + id + '";'
	graphDB.all(sql, [], (err, rows) => {
		if (rows.length == 1) {
			res.end(decodeURI(rows[0].GraphJSON))
		} else {
			res.end(null)
		}
	});
});

// Run the server.
loadDatabase()
app.listen(port, () => console.log(`Server running on port ${port}.`))