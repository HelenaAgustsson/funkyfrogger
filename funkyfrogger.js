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

//Initialisering av hindre med kollisjon
var cars = [];
// Initialisering av elementer som kan plukkes opp
var coins = [];

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
			this.audio.play();
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
			this.audio.pause();
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
	game.tileSize = game.canvas.height / constants.tileCount;
	let coinImg = document.getElementById('coins');

	window.onkeydown = key_logger;

	cars.push(create_obstacle(20, game.tileSize, "black", 20, 3, 1));
	cars.push(create_obstacle(20, game.tileSize, "red", 20, 5, 1.5));
	cars.push(create_obstacle(20, game.tileSize, "blue", game.canvas.width, 2, -1));
	cars.push(create_obstacle(20, game.tileSize, "yellow", game.canvas.width, 4, -1.5));
	cars.push(create_obstacle(20, game.tileSize, "purple", game.canvas.width, 6, -2));

	//array med coins objekter
	coins.push(create_coin(game.tileSize, game.tileSize, coinImg, 200, 200));
	coins.push(create_coin(game.tileSize, game.tileSize, coinImg, 400, 400));
	coins.push(create_coin(game.tileSize, game.tileSize, coinImg, 600, 200));
	coins.push(create_coin(game.tileSize, game.tileSize, coinImg, 800, 400));
	
	//create_coins(coinImg, 0, 30, game.tileSize, game.tileSize);
}

//Hovudloopen til spelet. Alt starter frå her.
function update_game() {
	//Rekn ut kor stor ein "tile" er på canvas. 
	//Vert rekna ut kvar gong i tilfelle canvas har endra størrelse.
	game.canvas.height = game.canvas.clientHeight;
	game.canvas.width = game.canvas.clientWidth;
	game.tileSize = game.canvas.height / constants.tileCount;

	// Miljø
	handle_enviroment();

	// Hindre og plattformer
	move_obstacles();
	draw_obstacles();
	draw_coins();


	//Eksempelfunksjonar
	//handle_platforms();
	//handle_enemies();
	//handle_froggy();
	//collision_detect();
	//add_score();
	//end_game_if_no_more_lives();

	//DEBUG
	debug_draw_test();

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

// Teiknar eit objekt på canvas basert på flisoppsett frå game.tileSize
// Width og height vert målt i flisstørrelse, dvs width = 4 er fire gongar så breitt som ei flis.
// Posisjon vert og målt i flislengd. Dvs y = 3 vil tilsvare 3 flislengder opp på canvas.
// Nullpunkt for x-posisjon er satt til midt på canvas og negativ x vil dermed vera i venstre halvdel.
// Objektet er i tillegg sentrert på x,y slik at ein ikkje treng å basera posisjon på hjørne til figuren.
function draw_object(object) {
	var context = game.canvas.getContext("2d");

	var width  = Math.round(object.width  * game.tileSize);
	var height = Math.round(object.height * game.tileSize);

	var x = Math.round(game.canvas.width/2 + (object.x * game.tileSize) - width/2);
	var y = Math.round(game.canvas.height  - (object.y * game.tileSize) - height/2);


	if(object.hasOwnProperty("image")) {
		context.drawImage(object.image, x, y, width, height);
	}
	else if(object.hasOwnProperty("color")) {
		context.fillStyle = object.color;
		context.fillRect(x, y, width, height);
	}
	else {
		context.fillStyle = "magenta";
		context.fillRect(x, y, width, height);
	}
}

// Testfunksjon for å visualisere bruken av draw_object(object)
function debug_draw_test() {
	//Array med testobjekt
	var testObjects = [{
		x : -2,
		y : 0.5,
		width: 1,
		height: 1,
	}, {
		x : -1,
		y : 1,
		width: 1,
		height: 1,
	}, {
		x : 0,
		y : 2,
		width: 0.5,
		height: 1.5,
		color: "purple"
	}, {
		x : 1,
		y : 2.5,
		width: 0.2,
		height: 0.2,
	}, {
		x : 2,
		y : 0,
		width: 1,
		height: 1,
	}];

	var topLeftCornerX = 0.5 - (game.canvas.width / game.tileSize)/2;
	var topLeftCornerY = 11.5;
	var testObjectTopLeft = {
		x : topLeftCornerX,
		y : topLeftCornerY,
		width: 1,
		height: 1,
		color: "red"
		};

	var topRightCornerX = (game.canvas.width / game.tileSize)/2 - 0.5;
	var topRightCornerY = 11.5;
	var testObjectTopRight = {
		x : topRightCornerX,
		y : topRightCornerY,
		width: 1,
		height: 1,
		color: "green"
		};

	for (object of testObjects){
		draw_object(object);
	}

	draw_object(testObjectTopLeft);
	draw_object(testObjectTopRight);
	draw_coins(coins[0]);
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
	while(game.env[0].end < game.distance) {
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


//************************//
//        Obstacles       //
//************************//

// Tegner opp hindre
function draw_obstacles() {
	var context = game.canvas.getContext("2d");

	for(car of cars)
	{
		context.fillStyle = car.color;
		context.fillRect(car.x, car.y, car.width, car.height);
	}
}

// Beveger hindrene horisontalt
function move_obstacles() {
	for(car of cars)
	{
		car.x += car.speed;
	}
}

//Lager hindre etter spesifikasjon
function create_obstacle(width, height, color, x, row, speed) {
	car = {}

	car.width = width;
	car.height = height;
	car.color = color;
	car.x = x-car.width;
	car.y = game.canvas.height - car.height*row;
	car.speed = speed;

	return car;
}
//Inspirert av https://www.w3schools.com/graphics/game_components.asp

//************************//
//        Coins           //
//************************//

// lager et coin object 
function create_coin(width, height, image, x, y){
	coin = {}

	coin.width = width;
	coin.height = height;
	coin.x=x;
	coin.y=y;
	coin.image = image;
	return coin;
}

// Tegner coins som froggy kan plukke opp
function draw_coins() {
	var context = game.canvas.getContext("2d");

	for(coin of coins)
	{
		context.drawImage(coin.image, coin.x, coin.y, coin.width, coin.height);
	}
}




//************************//
//        Platforms       //
//************************//







//************************//
//       Multimedia       //
//************************//

game.audio = new Audio("multimedia/the_monarch_full.mp3");
game.audio.loop = true;


//************************//
//       High Score       //
//************************//

//Poengsum vert lagra i window.localStorage. Då vert han "permanent" lagra i nettlesaren og kan hentast fram ved seinare tilhøve.
//Nyttar JSON format for å lagra ein "array" av "high scores" som eit "string" objekt.

function add_high_score(name, score) {
	try{
		var highScore = JSON.parse(window.localStorage.getItem("highScore"))
	} catch(error) {
		var highScore = [];
	}

	//Legg til den nye poengsummen og sorterar lista slik at han kjem på rett plass.
	highScore.push([name, score]);
	highScore.sort(
			function(a, b){
				return b[1] - a[1];
			}
			);

	window.localStorage.setItem("highScore", JSON.stringify(highScore));
}

function get_high_score_list() {
	try{
		var highScore = JSON.parse(window.localStorage.getItem("highScore"))
	} catch(error) {
		var highScore = [];
	}

	return highScore;
}

function clear_all_high_score() {
	window.localStorage.setItem("highScore", JSON.stringify([]));
}
