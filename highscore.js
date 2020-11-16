//<!-- Script til responsiv navigasjonsbar -->
function collapsenavbar() {
    var x = document.getElementById("nav");
    if (x.className === "nav") {
        x.className += " responsive";
    } else {
        x.className = "nav";
    }
}

//<!-- Script til å legge inn high scores fra spillet -->
function get_high_score_list() {
	try{
		var highScore = JSON.parse(window.localStorage.getItem("highScore"))
	} catch(error) {
		var highScore = [];
	}

	if(!Array.isArray(highScore)) {
		highScore = [];
	}

	return highScore;
}

function add_score_to_table(score) {
	var t = document.getElementById("scoretable").tBodies[0];
	var index = t.children.length;

	var row = t.insertRow();
	row.insertCell().innerHTML = index;
	row.insertCell().innerHTML = score[1];
	row.insertCell().innerHTML = score[0];
}

window.onload = function() {
	highScore = get_high_score_list();
	for(score of highScore) {
		add_score_to_table(score);
	}
}
