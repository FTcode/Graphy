/** Function which takes a canvas and a filename, exports
the canvas as a PNG image, and saves it as the filename. */
async function downloadCanvas(canvas, filename) {
	// Create a fake off-screen 'anchor' tag.
	// When 'clicked', this will download the image to the filename.
	var lnk = document.createElement('a')
	lnk.download = filename
	
	// Encode the canvas as a PNG image at set this as the image to download.
	lnk.href = canvas.toDataURL("image/png;base64")

	// Create a fake 'click' event to trigger the download.
	let e = document.createEvent("MouseEvents")
	e.initMouseEvent("click", true, true, window,
        0, 0, 0, 0, 0, false, false, false,
        false, 0, null)

	lnk.dispatchEvent(e)
}