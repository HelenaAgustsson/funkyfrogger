//DEBUG
//Automatisk scrolling
var time = 0;

//************************//
//      Hovudspelet       //
//************************//

//Faste konstantar me ikkje forventar skal endre seg i løpet av spelet. 
var constants = {
	tileCount	: 12, //Kor mange "tiles" som er synlege på canvas. Vert nytta til å rekna ut størrelsen ved teikning på canvas.
	envColors	: ["lawngreen", "aqua", "coral", "teal", "slategrey", "forestgreen"]
};

var game = {
	//Spelvariabler. Initialisert til 0
	tileSize	: 0,
	distance	: 0,
	started		: 0,	//Når spelet er i gang vil "started" vise til setInterval funksjonen som køyrer og oppdaterer spelet.
	fps			: 20,

	//Spelfunksjonar for å styre spelet.
	update	: update_game,

	start	: function(fps = 20) {
		if(this.started == 0)
		{
			this.fps = fps;
			this.started = setInterval(this.update, 1000/fps);
		}
		else
		{
			console.log("Error: Game already started");
		}
	},

	stop	: function() {
		if(this.started != 0)
		{
			clearInterval(this.started);
			this.started = 0;
		}
	},

	pause	: function() {
		if(this.started != 0)
		{
			this.stop()
		}
		else
		{
			//Resume game
			this.start(game.fps);
		}
	}
};


//Vent til nettsida er lasta før ein hentar canvas og koplar opp funksjonar
window.onload = function() {
	game.canvas = document.getElementById("gamecanvas");
	window.onkeydown = key_logger;
}

//Hovudloopen til spelet. Alt starter frå her.
function update_game() {
	//Rekn ut kor stor ein "tile" er på canvas. 
	//Vert rekna ut kvar gong i tilfelle canvas har endra størrelse.
	game.tileSize = game.canvas.height / constants.tileCount;

	handle_enviroment();

	//Eksempelfunksjonar
	//handle_platforms();
	//handle_enemies();
	//handle_froggy();
	//collision_detect();
	//add_score();
	//end_game_if_no_more_lives();

	//DEBUG
	//Automatisk scrolling ved å auka distance
	time += 1;
	game.distance += 5 * (1 - 1 * Math.cos(time/10))
}


//************************//
//    Hjelpefunksjonar    //
//************************//

//Returnerer eit heiltal frå min til max. 
//Eks min=3, max=6, returnerer 3,4,5 eller 6
function get_random(min, max) {
	return min + Math.floor((max+1-min)*Math.random());
}


//************************//
//         Input          //
//************************//

function key_logger(event) {
	if(event.key == "Escape") {
		game.pause();
	}
}


//************************//
//       Enviroment       //
//************************//

//Starthjelp for å hindra error
game.env =  [{
	start	: 0,
	end		: 0,
	tiles	: 0,
	type	: 0
}];

//Hovudfunksjonen til handtering av miljø
function handle_enviroment() {
	//Dersom det ikkje er nok miljø, legg til så det er nok.
	while(!enviroment_is_complete()) {
		var lastEnv = game.env[game.env.length-1];

		add_environment(lastEnv.start + lastEnv.tiles*game.tileSize);
	}

	//Dersom me har scrolla forbi gamle miljø vert dei sletta.
	while(game.env[0].start + game.env[0].tiles+game.tileSize < game.distance) {
		game.env.shift();
	}

	//Teikn opp alle miljø på canvas.
	for (e of game.env) {
		draw_environment(e);
	}
}

//Teikner opp det valgte "env" miljø på canvas.
function draw_environment(env) {
	var context = game.canvas.getContext("2d");

	var y = game.canvas.height - (env.start - game.distance) - env.tiles * game.tileSize;
	var width = game.canvas.width;
	var height = env.end - env.start;

	context.fillStyle = constants.envColors[env.type];
	context.fillRect(0, y, width, height);
}

//Legg til eit nytt (tilfeldig) miljø i game.env.
function add_environment() {
	var prevEnv = game.env[game.env.length-1];

	var env = {
		start	: prevEnv.end,
		tiles	: 6,
		//tiles	: get_random(3,8),
		type	: get_random(0,5)
	};
	env.end = env.start + env.tiles*game.tileSize;

	//Dersom me tilfeldigvis fekk same miljø att, prøv igjen.
	while(env.type == prevEnv.type)
	{
		env.type = get_random(0,5);
	}

	game.env.push(env);
}

//Sjekker om me har nok miljø eller er nøydt til å leggja til fleire.
function enviroment_is_complete() {
	var lastEnv = game.env[game.env.length-1];

	return game.canvas.height < (lastEnv.end - game.distance);
}
