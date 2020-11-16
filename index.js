// Script for å redirecte til spillet når knappen trykkes på 
function redirect() {
	window.location.href = "spill.html"
}

// Script for bilde-slideshow, inkl. pausefunksjon
const frog = document.getElementById("splashpicture");
var frogs = ["images/shades_frog.jpg", "images/lying_frog.jpg", "images/trumpet_frog.jpg", "images/guitar_frog.png"], i = 0;
var timer = setInterval(switchPicture, 3000);
var freezebutton = document.getElementById("freezebutton");
var unfreezebutton = document.getElementById("unfreezebutton");

function switchPicture() {
	i += 1;
	if (i >= frogs.length) {
		i = 0
	}
	frog.src = frogs[i];
}
timer;

function freezePicture() {
	clearInterval(timer);
	freezebutton.style.display = "none";
	unfreezebutton.style.display = "block";
}

function unfreezePicture() {
	timer = setInterval(switchPicture, 3000);
	freezebutton.style.display = "block";
	unfreezebutton.style.display = "none";
}

document.getElementById("freezebutton").onclick = freezePicture;
document.getElementById("unfreezebutton").onclick = unfreezePicture;
document.getElementById("redirect").onclick = redirect;

//Script for flipping av musikknoter
const note = $(".note");
const flippednote = $(".flippednote");
setInterval(flipNote, 1500);

function flipNote() {
	note.toggleClass("flippednote");
}
