//DEBUG
//Automatisk scrolling
var time = 0;

//************************//
//      Hovudspelet       //
//************************//

//Faste konstantar me ikkje forventar skal endre seg i løpet av spelet. 
var constants = {
	scrollSpeed	: 0.5,
	tileCount	: 12, //Kor mange "tiles" som er synlege på canvas. Vert nytta til å rekna ut størrelsen ved teikning på canvas.
	envColors	: ["lawngreen", "aqua", "coral", "teal", "slategrey", "forestgreen"]
};

//Initialisering av hindre med kollisjon
var cars = [];
// Initialisering av elementer som kan plukkes opp
//var coins = [];

var game = {
	//Spelvariabler. Initialisert til 0
	tileSize	: 0,
	distance	: 0,
	started		: 0,	//Når spelet er i gang vil "started" vise til setInterval funksjonen som køyrer og oppdaterer spelet.
	fps			: 20,
	env			: [],

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

	//Legg til interaktivitet
	window.onkeydown = key_down_logger;
	window.onkeyup = key_up_logger;

	//Legg til fyrste enviroment
	add_environment(0);

	cars.push(create_obstacle(20, game.tileSize, "black", 20, 3, 1));
	cars.push(create_obstacle(20, game.tileSize, "red", 20, 5, 1.5));
	cars.push(create_obstacle(20, game.tileSize, "blue", game.canvas.width, 2, -1));
	cars.push(create_obstacle(20, game.tileSize, "yellow", game.canvas.width, 4, -1.5));
	cars.push(create_obstacle(20, game.tileSize, "purple", game.canvas.width, 6, -2));

	create_frog();

	update_game();
}

//Hovudloopen til spelet. Alt starter frå her.
function update_game() {
	//Rekn ut kor stor ein "tile" er på canvas. 
	//Vert rekna ut kvar gong i tilfelle canvas har endra størrelse.
	game.canvas.height = game.canvas.clientHeight;
	game.canvas.width = game.canvas.clientWidth;
	game.tileSize = game.canvas.height / constants.tileCount;

	//Reknar ut kor mange tiles det er frå senter ut til sida.
	game.width = (game.canvas.width / game.tileSize) / 2;

	// Miljø
	handle_enviroment();

	// Hindre og plattformer
	move_obstacles();
	draw_obstacles();
	//draw_coins();


	//Eksempelfunksjonar
	//handle_platforms();
	//handle_enemies();
	//handle_froggy();
	//collision_detect();
	//add_score();
	//end_game_if_no_more_lives();

	//DEBUG
	debug_draw_test();

	handle_frog();

	//Automatisk scrolling ved å auka distance
	//time += 1;
	//game.distance += 5 * (1 - 1 * Math.cos(time/10))
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
// Objektet vert scrolla nedover basert på game.distance
// Nullpunkt for x-posisjon er satt til midt på canvas og negativ x vil dermed vera i venstre halvdel.
// Objektet er i tillegg sentrert på x,y slik at ein ikkje treng å basera posisjon på hjørne til figuren.
function draw_object(object) {
	var context = game.canvas.getContext("2d");

	var width  = Math.round(object.width  * game.tileSize);
	var height = Math.round(object.height * game.tileSize);

	var x = Math.round(game.canvas.width/2 + (object.x * game.tileSize) - width/2);
	var y = Math.round(game.canvas.height  - ((object.y - game.distance) * game.tileSize) - height/2);

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

function draw_coin(object){
	var context = game.canvas.getContext("2d");

	var width  = Math.round(object.width  * game.tileSize);
	var height = Math.round(object.height * game.tileSize);
	
	context.drawImage(object.image, object.x, object.y, width, height);
	console.log("image");
	
}

//Funksjon for å sjekke om to objekt er borti kvarandre. Kan nyttast til platformar, hinder, mynter og anna
//Overlap definerar kor sensitiv collisjonen skal vera.
//Med overlap 0 vil funksjonen returnera true med ein gong dei to objekta kjem i kontakt med kvarandre.
//Med overlap 1 må sentrum på objA liggje inni objB for å returnera true. Dvs at mesteparten må vera oppå kvarandre.
//Overlap frå 0.0 til 1.0 vil naturlegvis vera ein mellomting.
function collision_detect(objA, objB, overlap = 0) {
	var xDistance = Math.abs(objB.x - objA.x);
	var yDistance = Math.abs(objB.y - objA.y);

	var xSize = (objA.width * (1-overlap) + objB.width) / 2;
	var ySize = (objA.height * (1-overlap) + objB.height) / 2;

	if(xDistance < xSize && yDistance < ySize)
	{
		return true;
	}
	else
	{
		return false;
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
	
}

//************************//
//         Input          //
//************************//

function key_down_logger(event) {
	switch(event.key) {
		// Nyttar escape til å pause og starte spelet
		case "Escape":
			game.pause();
			break;

		// Når me trykkjer ned ein tast vil frosken flytta på seg. 
		case "ArrowUp":
		case "w":
			game.frog.ySpeed = game.frog.speed;
			break;

		case "ArrowDown":
		case "s":
			game.frog.ySpeed = -game.frog.speed;
			break;

		case "ArrowLeft":
		case "a":
			game.frog.xSpeed = -game.frog.speed;
			break;

		case "ArrowRight":
		case "d":
			game.frog.xSpeed = game.frog.speed;
	}
}

function key_up_logger(event) {
	switch(event.key) {

		//Når me slepp opp ein tast vil frosken stoppa opp.
		case "ArrowUp":
		case "ArrowDown":
		case "w":
		case "s":
			game.frog.ySpeed = 0;
			break;

		case "ArrowLeft":
		case "ArrowRight":
		case "a":
		case "d":
			game.frog.xSpeed = 0;
	}
}

//************************//
//       Enviroment       //
//************************//

//Hovudfunksjonen til handtering av miljø
function handle_enviroment() {
	//Dersom det ikkje er nok miljø, legg til så det er nok.
	while(!enviroment_is_complete()) {
		add_environment();
	}

	//Dersom me har scrolla forbi gamle miljø vert dei sletta.
	while(game.env[0].end < game.distance) {
		game.env.shift();

		//Fix for overscroll bug
		game.distance = game.env[0].start;
	}

	//Teikn opp alle miljø på canvas.
	for (env of game.env) {
		draw_environment(env);

		//Sjekker om dette er eit miljø med
		//plattformer og teiknar dei
		if(env.hasOwnProperty("platforms")) {
			move_platforms_in(env);
			draw_platforms_in(env);
		}
		if(env.hasOwnProperty("coins")) {
			draw_coins_in(env);
		}
	}
}

//Teikner opp det valgte "env" miljø på canvas.
function draw_environment(env) {
	var context = game.canvas.getContext("2d");

	var y = game.canvas.height - (env.end - game.distance) * game.tileSize;

	var width = game.canvas.width;
	var height = env.tiles * game.tileSize;

	//Teiknar berre rein farge. Trend meir avansert grafikk
	context.fillStyle = constants.envColors[env.type];
	context.fillRect(0, y, width, height);
}

//Legg til eit nytt (tilfeldig) miljø i game.env.
function add_environment(start = undefined) {
	//Dersom start ikkje er satt ved funksjons-kall, bruk slutten frå førre miljø
	if(start == undefined)
	{
		var prevEnv = game.env[game.env.length-1];

		start = prevEnv.end;
	}

	var env = {
		start	: start,
		tiles	: 6,
		//tiles	: get_random(3,8),
		type	: get_random(0,5)
	};
	env.end = env.start + env.tiles;

	//Dersom me tilfeldigvis fekk same miljø att, prøv igjen.
	try {
		while(env.type == prevEnv.type)
		{
			env.type = get_random(0,5);
		}
	}
	catch {
		//Dersom dette er fyrste enviroment vil prevEnv vera "undefined". 
		//Nyttar difor try-catch blokk for å ignorera error sidan me ikkje bryr oss.
	}


	//Sjekkar om miljøet er eit vått miljø (env.type er oddetal) og dermed lagar plattformar
	if(env.type % 2 == 1)
	{
		env.platforms = [];
		var totalPlatforms = get_random(8,12);

		for(var i = 0; i<totalPlatforms; ++i)
		{
			create_platform_in(env);
		}
	}
	

	// lager coins uansett type miljø foreløpig
	
	env.coins = [];
	var totalCoins = 4;
	for(var i = 0; i<totalCoins; ++i)
		{
			create_coin_in(env);
		}
	
	game.env.push(env);	
}

//Sjekker om me har nok miljø eller er nøydt til å leggja til fleire.
function enviroment_is_complete() {
	var lastEnv = game.env[game.env.length-1];

	return constants.tileCount < (lastEnv.end - game.distance);
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



//************************//
//        Platforms       //
//************************//

//Funksjon til å lage platformer til eit miljø. Veldig tilfeldig generering med mykje overlapp og kollisjon.
function create_platform_in(env) {

	var row = get_random(0, env.tiles);
	var platform = {
		x		: Math.random() * 10 - 5,
		y		: env.start + row + 0.5,

		width	: 1.4,
		height	: 0.9,

		speed	: Math.random() - 0.5,

		color	: "white"
	}

	env.platforms.push(platform);
}

function create_coin_in(env) {

	var row = get_random(0, env.tiles);
	var coin = {
		x		: Math.random() * 10 - 5,
		y		: env.start + row + 0.5,

		width	: 0.5,
		height	: 0.5,

		speed	: 0,

		image	: document.getElementById('coins')
	}

	env.coins.push(coin);
}

function move_platforms_in(env) {
	//Reknar ut kor langt det er ut til sidekanten
	var maxX = game.canvas.width / (2 * game.tileSize);

	for (p of env.platforms) {
		p.x += p.speed;

		//Dersom platformen har køyrd ut på eine sida, send han inn att på den andre sida i ei tilfeldig rad.
		if(p.x > maxX)
		{
			//Høgre side
			p.x = -maxX;
			p.y = get_random(0, env.tiles) + env.start + 0.5;
		}
		else if(p.x < -maxX)
		{
			//Venstre side
			p.x = maxX;
			p.y = get_random(0, env.tiles) + env.start + 0.5;
		}
	}
}

function draw_platforms_in(env) {
	for (platform of env.platforms) {
		draw_object(platform);
		
	}
}

function draw_coins_in(env) {
	for (coin of env.coins) {
		draw_object(coin);
	}
}


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

//************************//
//       Funky Frog       //
//************************//

function create_frog() {
	var frog = {
		x : 0,
		y : 0.5,
		width  : 0.75,
		height : 0.75,

		xSpeed : 0,
		ySpeed : 0,
		speed : 0.2,

		//https://www.flaticon.com/free-icon/frog_1036001
		image : document.getElementById("frog")
	};

	game.frog = frog;
}

function handle_frog() {
	var frog = game.frog;

	//Me oppdaterar frosken sin posisjon med farten dei har i x eller y retning
	frog.x += frog.xSpeed;
	frog.y += frog.ySpeed;

	//Reknar ut kva miljø frosken er i no.
	var i = 0;
	var currentEnv = game.env[i];
	while(frog.y > currentEnv.end)
	{
		currentEnv = game.env[++i];
	}

	//Dersom frosken har vandra over i neste miljø vil skjermen scrolla nedover
	//fram til førre miljø forsvinner ut av canvas og vert sletta i handle_enviroment.
	if(currentEnv != game.env[0])
	{
		game.distance += constants.scrollSpeed;
	}

	//Dersom frosken er i eit vått miljø med platformar itererar me over plattformane for å sjå om han står på ein.
	//Dersom han gjer det, så seglar han bortetter saman med plattformen.
	//Dersom han ikkje gjer det, så må han mista eit liv.
	if(currentEnv.hasOwnProperty("platforms"))
	{
		var safe = false;
		for(platform of currentEnv.platforms)
		{
			if(collision_detect(frog, platform, 1))
			{
				safe = true;
				frog.x += platform.speed;
				break;
			}
		}
	}

	//Stenger frosken inne i spelvindauge.
	if(frog.y - frog.height/2 < game.distance) {
		frog.y = game.distance + frog.height/2;
	}
	if(frog.x + frog.width/2 > game.width) {
		frog.x = game.width - frog.width/2;
	}
	else if(frog.x - frog.width/2 < -game.width) {
		frog.x = frog.width/2 - game.width;
	}

	draw_object(frog);
}
