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
	envColors	: ["lawngreen", "aqua", "coral", "teal", "slategrey", "forestgreen"],

	//Tomt objekt
	none		: {type : "none"},

	carLeft		: [],
	carRight	: [],

	noteCount	: 4,
	specialNoteCount : 3,

	rockSinkTime	: 1500,
	sinkTime	: 3000,
	sinkChance	: 0.0005,
		//Oppsett av vanskegrad. Større fart og akselerasjon vil vera vanskelegare. Større avstand på platformar vil vera vanskelegare. Større avstand på hinder vil vera lettare.
	difficulty	: {
		easy	: {
			pointLimit		: 200,
			platformSpeed	: 0.02,
			platformAccel	: 0.02,
			platformGap		: 4,
			obstacleSpeed	: 0.02,
			obstacleAccel	: 0.02,
			obstacleGap		: 6,
		},
		normal	: {
			pointLimit		: 500,
			platformSpeed	: 0.03,
			platformAccel	: 0.03,
			platformGap		: 6,
			obstacleSpeed	: 0.03,
			obstacleAccel	: 0.03,
			obstacleGap		: 5,
		},
		hard	: {
			pointLimit		: 1000,
			platformSpeed	: 0.04,
			platformAccel	: 0.04,
			platformGap		: 8,
			obstacleSpeed	: 0.04,
			obstacleAccel	: 0.04,
			obstacleGap		: 4,
		},
		impossible	: {
			platformSpeed	: 0.05,
			platformAccel	: 0.05,
			platformGap		: 10,
			obstacleSpeed	: 0.05,
			obstacleAccel	: 0.05,
			obstacleGap		: 3,
		}
	}
};

var game = {
	//Spelvariabler. Initialisert til 0
	difficulty	: constants.difficulty.easy,
	debug		: false,
	score       : 0,
	tileSize	: 0,
	distance	: 0,
	started		: 0,	//Når spelet er i gang vil "started" vise til setInterval funksjonen som køyrer og oppdaterer spelet.
	fps			: 20,
	env			: [],

	//Spelfunksjonar for å styre spelet.
	update	: update_game,

	reset	: reset_game,
	end		: end_game,

	start	: function(fps = 20) {
		if(this.started == 0)
		{
			this.fps = fps;
			this.started = setInterval(this.update, 1000/fps);
			this.audio.music.play();
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
			this.audio.music.pause();
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

function set_canvas() {
	//Rekn ut kor stor ein "tile" er på canvas.
	//Vert rekna ut kvar gong i tilfelle canvas har endra størrelse.
	game.canvas.height = game.canvas.clientHeight;
	game.canvas.width = game.canvas.clientWidth;
	game.tileSize = game.canvas.height / constants.tileCount;

	//Reknar ut kor mange tiles det er frå senter ut til sida.
	game.width = (game.canvas.width / game.tileSize) / 2;
}

function reset_game() {
	game.score = 0;

	// setter poengteller i statusbar tilbake til null
	$("#score > span").text(game.score);

	//fyller opp til tre liv igjen
	$(".life").removeClass("fa-heart-o").addClass("fa-heart");

	set_canvas();

	//Fjerner gamle miljø og lager nye
	game.distance = 0;
	game.env = [];
	add_environment(0);

	//Set musikken tilbake til start
	game.audio.music.currentTime = 0;

	//Lagar ny frosk, gamle vert sletta
	create_frog();

	//Teikner opp fyrste bilete
	update_game();
}

function load_resources() {

	//Utvalg av køyretøy. Er satt opp som array med:
	//[ image, width, scaleY ]
	constants.carLeft = [
		[ document.getElementById("bus"), 3, 3 ],
		[ document.getElementById("car1"), 2, 2 ],
		[ document.getElementById("purplecar"), 1.5, 1.5 ],
		[ document.getElementById("redcar"), 1.5, 1.5 ],
		[ document.getElementById("yellowcar"), 1.5, 1.5 ],
		[ document.getElementById("yellowcar2"), 1.5, 1.5 ]
	];

	constants.carRight = [
		[ document.getElementById("car2"), 2, 2 ],
		[ document.getElementById("police"), 1, 1 ],
		[ document.getElementById("sportscar"), 2, 2 ],
		[ document.getElementById("truck"), 1, 1 ],
		[ document.getElementById("redcar2"), 1.5, 1.5 ]
	];
}

//Vent til nettsida er lasta før ein hentar canvas og koplar opp funksjonar
window.onload = function() {
	game.canvas = document.getElementById("gamecanvas");
	//let coinImg = document.getElementById('coins');
	let startButton = $("#start-btn");
	let stopButton = $("#stop-btn");
	let pauseButton = $("#pause-btn");
	let volumeSlider = $("#volume-slider");
	let gameScore = $("#score > span");

	//Legg til interaktivitet
	window.onkeydown = key_down_logger;
	window.onkeyup = key_up_logger;

	startButton.on('click', function(){
		game.start();
		//$(this).toggleClass("inactive");
	});

	stopButton.on('click', function(){
		game.stop();
	});

	pauseButton.on('click', function(){
		game.pause();
	});

	volumeSlider.value = "50";
	volumeSlider.on('input', function(){
		for(audio in game.audio) {
			game.audio[audio].volume = this.value / 100;
		}
	});
	for(audio in game.audio) {
		game.audio[audio].volume = volumeSlider.value / 100;
	}

	load_resources();

	reset_game();
}

//Hovudloopen til spelet. Alt starter frå her.
function update_game() {
	game.frameTime = Date.now();
	set_canvas();

	// Miljø
	handle_enviroment();

	handle_frog();

	if(game.frog.lifePoints < 1) {
		game.end();
	}
}

function end_game() {
	//Vis sluttskjerm med poengsum og "Vil du spille igjen?"
	

	add_high_score("Froggy", game.score);
	let lastHighscore = parseInt( $("#highscore > span").text());
	console.log(lastHighscore);
	if(game.score > lastHighscore){
		$("#highscore > span").text(game.score);
	}
	
//	var highScore = get_high_score_list();
//	//console.log("High scores");
//	for(hs of highScore) {
//		console.log(hs);
//	}
	
	game.reset();
	game.stop();

	context = game.canvas.getContext("2d");
	context.fillStyle = "black";
	let w = $("#gamecanvas").width();
	let h = $("#gamecanvas").height();
	context.fillRect(0,0,w,h);
	context.fillStyle = "#28E322";
	context.font = "120px calibri";
	context.textAlign = "center";
	context.fillText("Game Over!!", w/2, h/2);
	
	context.fillStyle = "#FA08D0";
	context.font = "80px calibri";
	context.fillText("Restart", w/2, h-h/4);
	$("#gamecanvas").on('click', function(){
		game.start();
	});
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
// scaleX og scaleY reskalerer bilete for å fikse proposjoner.
function draw_object(object) {
	var context = game.canvas.getContext("2d");

	var scaleX = 1.0;
	var scaleY = 1.0;
	if(object.hasOwnProperty('scaleX')) {
		scaleY = object.scaleX;
	}
	if(object.hasOwnProperty('scaleY')) {
		scaleY = object.scaleY;
	}

	var width  = object.width  * game.tileSize * scaleX;
	var height = object.height * game.tileSize * scaleY;

	var x = game.canvas.width/2 + (object.x * game.tileSize) - width/2;
	var y = game.canvas.height  - ((object.y - game.distance) * game.tileSize) - height/2;

	//Debug teiknefunksjon. Teiknar ein kvit firkant under objektet
	if(game.debug == true) {
		var dwidth  = object.width  * game.tileSize;
		var dheight = object.height * game.tileSize;

		var dx = game.canvas.width/2 + (object.x * game.tileSize) - dwidth/2;
		var dy = game.canvas.height  - ((object.y - game.distance) * game.tileSize) - dheight/2;

		context.fillStyle = "white";
		context.fillRect(dx, dy, dwidth, dheight);
	}

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

function animate_object(object) {
	//Summerar opp kor lang tid animasjonen brukar på loop.
	var totalAnimationTime = 0;
	for(animationFrame of object.animation) {
		totalAnimationTime -= -animationFrame.name;
	}

	var animationStart = 0;
	if(object.hasOwnProperty("animationStart")) {
		animationStart = object.animationStart;
	}

	//Finner ut kor langt objektet er kommen i animasjonen
	var animationTime = (game.frameTime - animationStart) % totalAnimationTime;

	//Finner ut kva animasjonframe me skal bruke
	var i= 0;
	while(animationTime > object.animation[i].name) {
		animationTime -= object.animation[i].name;
		++i;
	}

	//Hentar ut animasjonframe og teiknar han
	object.image = object.animation[i];
	draw_object(object);
}


function draw_objects(objects) {
	for(object of objects) {
		draw_object(object);
	}
}

function animate_objects(objects) {
	for(object of objects) {
		animate_object(object);
	}
}

//Funksjon for å sjekke om to objekt er borti kvarandre. Kan nyttast til platformar, hinder, mynter og anna
//Hitbox definerar kor stor kontaktboksen til frosken skal vera. Mindre enn 1 betyr dei må overlappe, meir enn 1
//så vil dei kollidera på avstand
function collision_detect(objA, objB, hitbox = 1) {
	var xDistance = Math.abs(objB.x - objA.x);
	var yDistance = Math.abs(objB.y - objA.y);

	var xSize = (objA.width * hitbox + objB.width) / 2;
	var ySize = (objA.height * hitbox + objB.height) / 2;

	if(xDistance < xSize && yDistance < ySize)
	{
		return true;
	}
	else
	{
		return false;
	}
}

//Flyttar plattformar og hindringar
function move_objects(objects) {
	//Reknar ut kor langt det er ut til plattformen skal gå rundt
	var maxX = game.width + 5;

	for (o of objects) {

		o.x += o.speed;

		//Dersom platformen har køyrd ut på eine sida, send han inn att på den andre sida.
		if(o.x > maxX)
		{
			//Høgre side
			o.x -= 2*maxX;
		}
		else if(o.x < -maxX)
		{
			//Venstre side
			o.x += 2*maxX;
		}
	}
}

//// Testfunksjon for å visualisere bruken av draw_object(object)
//function debug_draw_test() {
//	//Array med testobjekt
//	var testObjects = [{
//		x : -2,
//		y : 0.5,
//		width: 1,
//		height: 1,
//	}, {
//		x : -1,
//		y : 1,
//		width: 1,
//		height: 1,
//	}, {
//		x : 0,
//		y : 2,
//		width: 0.5,
//		height: 1.5,
//		color: "purple"
//	}, {
//		x : 1,
//		y : 2.5,
//		width: 0.2,
//		height: 0.2,
//	}, {
//		x : 2,
//		y : 0,
//		width: 1,
//		height: 1,
//	}];
//
//	var topLeftCornerX = 0.5 - (game.canvas.width / game.tileSize)/2;
//	var topLeftCornerY = 11.5;
//	var testObjectTopLeft = {
//		x : topLeftCornerX,
//		y : topLeftCornerY,
//		width: 1,
//		height: 1,
//		color: "red"
//		};
//
//	var topRightCornerX = (game.canvas.width / game.tileSize)/2 - 0.5;
//	var topRightCornerY = 11.5;
//	var testObjectTopRight = {
//		x : topRightCornerX,
//		y : topRightCornerY,
//		width: 1,
//		height: 1,
//		color: "green"
//		};
//
//	for (object of testObjects){
//		draw_object(object);
//	}
//
//	draw_object(testObjectTopLeft);
//	draw_object(testObjectTopRight);
//}

//************************//
//         Input          //
//************************//

function jump(target) {
	game.audio.hop.play();
	game.frog.jump = true;
	game.frog.jumpTarget = target;
}

function key_down_logger(event) {
	var frog = game.frog;
	switch(event.key) {
		// Nyttar escape til å pause og starte spelet
		case "Escape":
			game.pause();
			break;
		// Hopp med mellomtast
		case " ":
			event.preventDefault();
			jump(Math.ceil(frog.y) + 0.5);
			//if(frog.down) {
			//	//Hopp bakover
			//	frog.jump = true;
			//	frog.jumpTarget = Math.floor(frog.y) - 0.5;
			//}
			//else {
				//Hopp framover
				//frog.jump = true;
				//frog.jumpTarget = Math.ceil(frog.y) + 0.5;
			//}
			break;

		// Når me trykkjer ned ein tast vil frosken flytta på seg. 
		case "ArrowUp":
		case "w":
			event.preventDefault();
			jump(Math.ceil(frog.y) + 0.5);
			//Hopp framover
			//frog.up = true;
			//frog.ySpeed = frog.walkSpeed;
			break;

		case "ArrowDown":
		case "s":
			event.preventDefault();
			//Hopp bakover
			jump(Math.floor(frog.y) - 0.5)
			//frog.down = true;
			//frog.ySpeed = -frog.walkSpeed;
			break;

		case "ArrowLeft":
		case "a":
			event.preventDefault();
			frog.left = true;
			frog.xSpeed = -frog.walkSpeed;
			break;

		case "ArrowRight":
		case "d":
			event.preventDefault();
			frog.right = true;
			frog.xSpeed = frog.walkSpeed;
		default:
	}
}

function key_up_logger(event) {
	var frog = game.frog;
	switch(event.key) {
		//Når me slepp opp ein tast vil frosken stoppa opp.
		//case "ArrowUp":
		//case "w":
		//	frog.up = false;
		//	if(frog.down == true) {
		//		frog.y = -frog.walkSpeed;
		//	}
		//	else {
		//		frog.ySpeed = 0;
		//	}
		//case "ArrowDown":
		//case "s":
		//	frog.down = false;
		//	if(frog.up == true) {
		//		frog.ySpeed = frog.walkSpeed;
		//	}
		//	else {
		//		frog.ySpeed = 0;
		//	}
		//	break;

		case "ArrowLeft":
		case "a":
			frog.left = false;
			if(frog.right == true) {
				frog.xSpeed = frog.walkSpeed;
			}
			else {
				frog.xSpeed = 0;
			}
			break;
		case "ArrowRight":
		case "d":
			frog.right = false;
			if(frog.left == true) {
				frog.xSpeed = -frog.walkSpeed;
			}
			else {
				frog.xSpeed = 0;
			}
			break;
		default:
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
		game.frog.y = game.distance + 0.5;
	}

	//Teikn opp alle miljø på canvas.
	for (env of game.env) {
		draw_environment(env);

		//Flyttar og teiknar opp objekt i miljøet
		draw_objects(env.safePlatforms);

		move_objects(env.platforms);
		for(platform of env.platforms) {
			handle_sinking(platform);
			draw_object(platform);
		}

		handle_items(env.items);
		animate_objects(env.items);

		move_objects(env.specialItems);
		handle_items(env.specialItems);
		draw_objects(env.specialItems);
		
		move_objects(env.obstacles)
		draw_objects(env.obstacles);
	}
}

//Teikner opp det valgte "env" miljø på canvas.
function draw_environment(env) {
	var context = game.canvas.getContext("2d");

	var y = game.canvas.height - (env.end - game.distance) * game.tileSize;

	if(env.type == "river") {
		var x = 0;
		var y = game.canvas.height - (env.end + 0.5 - game.distance) * game.tileSize;
		
		var width = game.canvas.width;
		var height = env.tiles * (game.tileSize);

		context.drawImage(env.image, x, y, width, height);
	}
	else if(env.type == "lava") {
		var totalAnimationTime = 0;
 
		for(animationFrame of env.animation) {
			totalAnimationTime -= -animationFrame.name;
		}

		//Finner ut kor langt objektet er kommen i animasjonen
		var animationTime = game.frameTime % totalAnimationTime;

		//Finner ut kva animasjonframe me skal bruke
		var i= 0;
		while(animationTime > env.animation[i].name) {
			animationTime -= env.animation[i].name;
			++i;
		}

		var size = 2 * game.tileSize;

		//Flislegger lava med lavatiles.
		var x = 0;
		var j = 3; 
		while (j--) 
		{
			while (x < game.canvas.width)
			{
				context.drawImage(env.animation[i], x, y, size, size);

				x += size -1;
			}
			x = 0;
			y += size -1;
		}
	}
	//Ellers er det ein veg.
	else {
		var width = 2 * game.tileSize;

		//Legger ned asfalt.
		var x = 0;
		var i = 3; 
		while (i--) 
		{
			while (x < game.canvas.width)
			{
				context.drawImage(env.image, x, y, width, width);

				x += width -1;
			}
			x = 0;
			y += width -1;
		}
	}
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
		//type	: get_random(0,5)
	};
	env.end = env.start + env.tiles;

	//Fast rotasjon på miljø
	env.type = (env.start / constants.envColors.length) % constants.envColors.length;
//	//Dersom me tilfeldigvis fekk same miljø att, prøv igjen.
//	try {
//		while(env.type == prevEnv.type)
//		{
//			env.type = get_random(0,5);
//		}
//	}
//	catch {
//		//Dersom dette er fyrste enviroment vil prevEnv vera "undefined".
//		//Nyttar difor try-catch blokk for å ignorera error sidan me ikkje bryr oss.
//	}

	env.safePlatforms = [];
	env.platforms = [];
	env.obstacles = [];

	env.safePlatforms.push(create_safe_platform(env.start));

	//Sjekkar om miljøet er eit vått miljø (env.type er oddetal) og dermed lagar plattformar
	if(env.type % 2 == 1)
	{
		if(env.type % 4 == 3) {
			env.animation = document.getElementsByClassName("lava");
			env.type = "lava";
			create_lava_platforms(env);
		}
		else {
			env.image = document.getElementById("waves");
			env.type = "river";
			create_river_platforms(env);
		}

	}
	//For tørt miljø lagar me bilar
	else
	{
		env.image = document.getElementById("road");
		env.type = "road";

		create_cars_in(env);
	}

	// lager items uansett type miljø foreløpig
	
	env.items = [];
	env.specialItems = [];

	for(var i = 0; i<constants.noteCount; ++i) {
		create_item_in(env);
	}

	for(var i = 0; i<constants.specialNoteCount; ++i) {
		create_special_item_in(env);
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

//Funksjon til å lage hindringar til eit miljø.
function create_cars_in(env) {
	for(var row = 1; row < env.tiles; ++row) {
		//var carColors = ["blue", "purple", "black"];
		//var carTypes = [
		//	car1 = document.getElementById("redcar_right"),
		//	car2 = document.getElementById("car2"),
		//	bus = document.getElementById("bus")
		//];

		var x = -game.width - 4;

		while(x < game.width + 4) {
			var obstacle = {
				x		: x,
				y		: env.start + row + 0.5,

				//width	: 1 + 1 * Math.random(),
				height	: 0.8,

				speed	: game.difficulty.obstacleSpeed +
						  game.difficulty.obstacleAccel * row,

				type	: "car"

				//color	: carColors[get_random(0,2)],
				//image	: carTypes[get_random(0,2)]
			}

			//Alternerer fartsretning
			if(row % 2 == 0) {
				obstacle.speed = -obstacle.speed;

				var type = get_random(0, constants.carLeft.length-1);
				obstacle.image = constants.carLeft[type][0]
				obstacle.width = constants.carLeft[type][1]
				obstacle.scaleY = constants.carLeft[type][2]
			}
			else {
				var type = get_random(0, constants.carRight.length-1);
				obstacle.image = constants.carRight[type][0]
				obstacle.width = constants.carRight[type][1]
				obstacle.scaleY = constants.carRight[type][2]
			}

			//switch(get_random(0,2)) {
			//	case 0:
			//		if(obstacle.speed > 0) {
			//			obstacle.image = document.getElementById("redcarright");
			//		}
			//		else {
			//			obstacle.image = document.getElementById("yellowcarleft");
			//		}
			//		obstacle.width = 2;
			//		obstacle.scaleY = 2;
			//		break;
			//	case 1:
			//		if(obstacle.speed > 0) {
			//			obstacle.image = document.getElementById("car2");
			//		}
			//		else {
			//			obstacle.image = document.getElementById("car1");
			//		}
			//		obstacle.width = 2;
			//		obstacle.scaleY = 2;
			//		break;
			//	case 2:
			//		obstacle.image = document.getElementById("bus");
			//		obstacle.width = 3;
			//		obstacle.scaleY = 3;
			//		break;
			//}

			obstacle.x += obstacle.width/2;
			x += obstacle.width/2 + game.difficulty.obstacleGap + 2 * Math.random();

			env.obstacles.push(obstacle);
		}
	}
}

function add_dragons_to_env(env) {
	for(var row = 2; row < env.tiles; row += 2) {
		var dragon = {
			x		: game.width + 3,
			y		: env.start + row + 0.5,

			width	: 1,
			height	: 0.8,
			scaleY	: 1.25,

			speed	: game.difficulty.obstacleSpeed +
				game.difficulty.obstacleAccel * row,

			image	: document.getElementById("dragongreen")
		}

		if(row < 3) {
			dragon.image = document.getElementById("dragongray");
		}

		env.obstacles.push(dragon);
	}
}

//************************//
//        Items           //
//************************//

//Legg til vanlege noter
function create_item_in(env) {
	var row = get_random(1, env.tiles-1);
	var item = {
		x		: (Math.random() * game.width - game.width/2) * 1.8,
		y		: env.start + row + 0.5,

		width	: 0.5,
		height	: 0.5,

		points	: 10,

		animation : document.getElementsByClassName('musicnote'),
		animationStart : Math.random() * 2000
	}

	env.items.push(item);
}

//Legg til noter med meir poeng
function create_special_item_in(env) {
	var row = get_random(1, env.tiles-1);
	var item = {
		x		: (Math.random() * game.width - game.width/2) * 1.8,
		y		: env.start + row + 0.5,

		width	: 0.5,
		height	: 0.5,

		speed	: 0,
	}

	if(Math.random() < 0.3) {
		//Sur note
		item.points = -30;
		item.image	= document.getElementById('mute');
	}
	else {
		//Supernote
		item.points	= 30;
		item.image	= document.getElementById('clef');
	}

	if(env.platforms.length > 0) {
		var index = get_random(0, env.platforms.length-1);
		var platform = env.platforms[index];

		item.x = platform.x;
		item.y = platform.y;
		item.speed = platform.speed;
	}

	env.specialItems.push(item);
}

//Sjekker om froggy har plukket opp noen mynter
function handle_items(items){
	let frog = game.frog;

	// tester om frosken kolliderer med note
	for(item of items)
	{
		//Collision detect med 1
		if(collision_detect(frog, item, 1))
		{ 
			//fjerner notene frosken har plukket opp fra spillbrettet
			var idx = items.indexOf(item);
			items.splice(idx, 1);

			add_points(item.points);

			if(item.points < 0) {
				game.audio.badNote.play();
			}
			break;
		}
	}
}

//************************//
//        Platforms       //
//************************//

//Funksjon til å lage platformer til eit miljø.
function create_lava_platforms(env) {

	//Legger til trommer
	for(var row = 2; row < env.tiles; row += 2) {
		for(var i = -1; i < 2; ++i)
		{
			var platform = {
				x		: i * game.width / 2,
				y		: env.start + row + 0.5,

				width	: 1,
				height	: 1.05,
				scaleY	: 1,

				speed	: 0,

				sinking : 0,

				type	: 'drum',
				image	: document.getElementById("drum")
			};

			env.safePlatforms.push(platform);
		}
	}

	//Lager lavasteiner
	for(var row = 1; row < env.tiles; row += 2) {

		var x = -game.width - 4;
		while(x < game.width + 4) {
			var platform = {
				x		: x,
				y		: env.start + row + 0.5,

				width	: 1.05,
				height	: 1.05,
				scaleY	: 1,

				speed	: game.difficulty.platformSpeed +
						  game.difficulty.platformAccel * row,

				sinking : 0,

				type	: 'rock',
				image	: document.getElementById("rock")
			};

			//Alternerer fartsretning per rad
			if(row == 3) {
				platform.speed = -platform.speed;
			}

			platform.x += platform.width/2;
			x += platform.width/2 + game.difficulty.platformGap + Math.random() - 2;

			env.platforms.push(platform);
		}
	}

	//Legg til eit par dragar.
	add_dragons_to_env(env);
}

//Funksjon til å lage platformer til eit miljø.
function create_river_platforms(env) {
	for(var row = 1; row < env.tiles; ++row) {

		var x = -game.width - 4;
		while(x < game.width + 4) {
			var platform = {
				x		: x,
				y		: env.start + row + 0.5,

				speed	: game.difficulty.platformSpeed +
						  game.difficulty.platformAccel * row,

				sinking : 0,
			};

			//Alternerer fartsretning per rad
			if(row % 2 == 0) {
				platform.speed = -platform.speed;
			}

			var type = Math.random();
			if(type < 0.1) {
				//Krokodille
				
				platform.width = 2;
				platform.height = 0.9;
				platform.scaleY = 2;

				platform.type = 'crocodile';

				if(platform.speed < 0) {
					platform.image = document.getElementById("crocodile");
				}
				else {
					platform.image = document.getElementById("alligator");
				}
			}
			else if(type < 0.2) {
				//Trompet

				platform.width = 1.5;
				platform.height = 1.05;
				platform.scaleY = 1.5;

				platform.type = 'trumpet';
				platform.image = document.getElementById("trumpet");
			}
			else {
				//Tømmerstokk

				platform.width = 2.5 + Math.random();
				platform.height = 1.05;
				platform.scaleY = 2.5;

				platform.type = 'log';
				platform.image = document.getElementById("log1");
			}

			platform.x += platform.width/2;
			x += platform.width/2 + game.difficulty.platformGap + 2 * Math.random();

			env.platforms.push(platform);
		}
	}
}

//Startplattform til våte miljø
function create_safe_platform(row) {
	var platform = {
		x : 0,
		y : row + 0.5,

		width : game.width * 2,
		height : 1.05,

		safe	: true,

		speed : 0,
		image : document.getElementById("piano"),
	};

	return platform;
}

function handle_sinking(platform) {
	if(platform.sinking > 0)
	{
		var sinking = game.frameTime - platform.sinking;

		if(platform.type == "rock") {
			if(sinking < constants.sinkTime) {
				//Sinking
				var ratio = (constants.sinkTime - sinking) / constants.sinkTime;

				platform.width = platform.originalWidth * ratio;
				platform.scaleY = ratio;
			}
			else {
				//Lavasteinen er smelta vekk!!
				platform.height = 0;
				platform.width = 0;
				platform.sinking = 0;
			}
		}
		else {
			//Plattform som synker og dukker opp att.
			if(sinking < constants.sinkTime) {
				//Sinking
				var ratio = (constants.sinkTime - sinking) / constants.sinkTime;

				platform.width = platform.originalWidth * ratio;
				platform.scaleY = platform.originalScale * ratio;
			}
			else if(sinking < 2*constants.sinkTime) {
				//Sunk
			}
			else if(sinking < 3*constants.sinkTime) {
				//Rising
				var ratio = 1 - ((3*constants.sinkTime - sinking) / constants.sinkTime);

				platform.width = platform.originalWidth * ratio;
				platform.scaleY = 2.5 * ratio;
			}
			else {
				//Floating
				platform.width = platform.originalWidth;
				platform.scaleY = 2.5;
				platform.sinking = 0;
			}
		}
	}
	else if(platform.type == "log" || platform.type == "crocodile")
	{
		if(Math.random() < constants.sinkChance)
		{
			start_to_sink(platform);
		}
	}
}

function start_to_sink(platform) {
	platform.originalWidth = platform.width;
	platform.originalScale = platform.scaleY;
	platform.sinking = game.frameTime;
}

//************************//
//       Multimedia       //
//************************//

game.audio = {
	music	: new Audio("audio/the_monarch_full.mp3"),
	hop		: new Audio("audio/frog.wav"),
	splash	: new Audio("audio/splash.wav"),
	burn	: new Audio("audio/tree-burns-down.wav"),
	crash	: new Audio("audio/car_crash.mp3"),
	drum	: new Audio("audio/tromme_cartoon_timpani.mp3"),
	badNote	: new Audio("audio/bomlyd_sirene.mp3"),
	cymbal	: new Audio("audio/cymbal.wav"),
	trumpet	: new Audio("audio/trumpet.wav")
}
game.audio.music.loop = true;

//************************//
//       High Score       //
//************************//

function add_points(points) {
	game.score += points;
	$("#score > span").text(game.score);

	//Sjekker om poengsummen har overgått poenggrensa for gjeldande vanskegrad.
	if(game.difficulty.hasOwnProperty("pointLimit") &&
			game.score > game.difficulty.pointLimit) {
		//Vanskegraden går opp!
		switch(game.difficulty) {
			case constants.difficulty.easy:
				game.difficulty = constants.difficulty.normal;
				break;
			case constants.difficulty.normal:
				game.difficulty = constants.difficulty.hard;
				break;
			case constants.difficulty.hard:
				game.difficulty = constants.difficulty.impossible;
				break;
			default:
		}

		//Når vanskegraden aukar får froggy tilbake eit liv (dersom han har mista eitt.)
		if(game.frog.lifePoints < 3) {
			game.frog.lifePoints += 1;

			var lifePointID = "#life" + game.frog.lifePoints;
			$(lifePointID).removeClass("fa-heart-o").addClass("fa-heart");
		}
	}
}

//Poengsum vert lagra i window.localStorage. Då vert han "permanent" lagra i nettlesaren og kan hentast fram ved seinare tilhøve.
//Nyttar JSON format for å lagra ein "array" av "high scores" som eit "string" objekt.

function add_high_score(name, score) {
	try{
		var highScore = JSON.parse(window.localStorage.getItem("highScore"))
	} catch(error) {
		var highScore = [];
	}

	if(!Array.isArray(highScore)) {
		highScore = [];
	}

	//Legg til den nye poengsummen og sorterar lista slik at han kjem på rett plass.
	highScore.push([name, score]);
	highScore.sort(
			function(a, b){
				return b[1] - a[1];
			}
			);

	//Maks 10 high scores
	if(highScore.length > 10) {
		highScore.pop();
	}

	window.localStorage.setItem("highScore", JSON.stringify(highScore));
}

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
		width  : 0.95,
		height : 0.95,

		xSpeed : 0,
		ySpeed : 0,
		walkSpeed : 0.2,
		jumpSpeed : 0.3,

		inputCooldown : 0,
		lifePoints : 3,

		//up		: false,
		//down	: false,
		left	: false,
		right	: false,

		jump	: false,

		bestY	: 0,

		dying : 0,

		platform : constants.none,
		//https://www.flaticon.com/free-icon/frog_1036001
		//image : document.getElementById("frog"),
		animation : document.getElementsByClassName("froganimation"),
		animationStart : 0
	};

	game.frog = frog;
}

function jump_done() {
	var frog = game.frog;

	frog.y = frog.jumpTarget;
	frog.jump = false;
	frog.inputCooldown = 2;

	//Eitt poeng per rad frosken har overvunne.
	if(frog.y > frog.bestY) {
		add_points(1);
		frog.bestY = frog.y;
	}

	if(frog.platform.type == "drum") {
		game.audio.drum.play();
	}

	if(frog.platform.type == "rock") {
		game.audio.cymbal.play();
	}
}

function handle_frog() {
	var frog = game.frog;

	//Reknar ut kva miljø frosken er i no.
	var i = 0;
	var currentEnv = game.env[i];
	while(frog.y > currentEnv.end)
	{
		currentEnv = game.env[++i];
	}

	if(frog.dying) {
		if(game.frameTime - frog.dying > 3000) {
			frog.dying = 0;
			frog.lifePoints -= 1;
			frog.animation = document.getElementsByClassName("froganimation");

			frog.x = 0;
			frog.y = currentEnv.start + 0.5;
			frog.jump = false;
		}
	}
	else {

		//Dersom frosken har vandra over i neste miljø vil skjermen scrolla nedover
		//fram til førre miljø forsvinner ut av canvas og vert sletta i handle_enviroment.
		//Når dette skjer kan me ikkje flytta på frosken og han vil ikkje kollidera med noko.
		if(currentEnv != game.env[0])
		{
			game.distance += constants.scrollSpeed;
			frog.y = currentEnv.start + 1;
		}
		else {
			if(frog.jump == true) {
				if(frog.jumpTarget >= frog.y) {
					frog.y += frog.jumpSpeed;

					//Om han har nådd målet, er han ferdig med å hoppe.
					if(frog.y >= frog.jumpTarget) {
						jump_done();
					}
				}

				else if(frog.jumpTarget <= frog.y) {
					if(frog.jumpTarget < currentEnv.start) {
						//Frosken kan ikkje hoppa tilbake til førre miljø
						frog.jump = false;
					}
					else {
						frog.y -= frog.jumpSpeed;

						//Om han har nådd målet, er han ferdig med å hoppe.
						if(frog.y <= frog.jumpTarget) {
							jump_done();
						}
					}
				}

			}
			else {
				//Me oppdaterar frosken sin posisjon med farten dei har i x retning
				if(frog.inputCooldown > 0) {
					frog.inputCooldown -= 1;
				}
				else {
					frog.x += frog.xSpeed;
					//frog.y += frog.ySpeed;
				}
			}

			var safe = true;
			frog.platform = constants.none;

			//Dersom frosken er i eit vått miljø med platformar itererar me over plattformane for å sjå om han står på ein.
			//Dersom han gjer det, så seglar han bortetter saman med plattformen.
			//Dersom han ikkje gjer det, så må han mista eit liv.
			if(currentEnv.platforms.length > 0 && frog.y < currentEnv.end)
			{
				safe = false;
				for(platform of currentEnv.platforms.concat(currentEnv.safePlatforms))
				{
					//Collision detect med 0.1 for at mesteparten av frosken må vera oppå platformen.
					if(collision_detect(frog, platform, 0.1))
					{
						safe = true;
						frog.x += platform.speed;

						//Lavasteiner synker!
						if(platform.type == "rock" && !platform.sinking) {
							start_to_sink(platform);
						}

						frog.platform = platform;

						//Er det ein farleg krokodille?
						if(platform.type == "crocodile") {
							if(platform.speed < 0 && frog.x < platform.x) {
								safe = false;
							}
							else if(platform.speed > 0 && frog.x > platform.x) {
								safe = false;
							}
						}

						break;
					}
				}

				//Ingen plattform!!
				if(frog.platform == constants.none) {
					if(currentEnv.type == "river") {
						game.audio.splash.play();
					}
					else if(currentEnv.type == "lava") {
						game.audio.burn.play();
					}
				}
			}

			//Tester om frosken kolliderar med ein bil
			if(safe == true && currentEnv.hasOwnProperty("obstacles"))
			{
				for(obstacle of currentEnv.obstacles)
				{
					//Collision detect med 0.9 for å gje litt slark med kollisjonen.
					if(collision_detect(frog, obstacle, 0.9))
					{
						safe = false;

						if(obstacle.type == "car") {
							game.audio.crash.play();
						}

						//Endrar farge for å visa kontakt. Debugfunksjon
						//obstacle.color = "red";
						break;
					}
				}
			}

			//Frosken er i vatnet eller truffen av ein bil.
			if(safe == false) {
				frog.dying = game.frameTime;
				frog.animation = document.getElementsByClassName("explosion");

				if(frog.lifePoints==3){
					$("#life3").removeClass("fa-heart").addClass("fa-heart-o");
				} else if(frog.lifePoints==2){
					$("#life2").removeClass("fa-heart").addClass("fa-heart-o");
				} else if(frog.lifePoints==1){
					$("#life1").removeClass("fa-heart").addClass("fa-heart-o");
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

	}

	//draw_object(frog);
	animate_object(frog);
}
