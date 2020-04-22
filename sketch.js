var generate;
var points = [];
var range;
var reset;
var p;
var a = [];
var interpolated = false;
var dragged_point = -1;
var timestamp = 0;


function setup() {

	//Setup of the canvas and the buttons. Frame is an off-screen buffer that contains the axes, the graph and the points.
	//The real canvas only displays the text when you hoover over the points. This is done to prevent the computer from performing
	//all the calculations continously at framerate. 

	generate = createButton("generate");		
	range = createSlider(1, 10, 1, 0);			
	canvas = createCanvas(500, 500);
	reset = createButton('reset');
	reset.parent('reset-div')
	canvas.parent('sketch-div');
  	p = createP("");							
  	
  	frame = createGraphics(width, height);		
  	frame.clear();

  	range.parent('slider-div');
  	


  	canvas.mousePressed(update_points);
  	canvas.mouseReleased(undo_drag);
  	generate.mousePressed(interpolate);
  	range.input(update_canvas);
  	reset.mousePressed(initialize);

  	generate.parent('generate-div')
  	generate.class('button_class')
  	reset.class('button_class')




	initialize();

}

function draw() {
	background(255);
	image(frame, 0, 0)
	check_points();
}

function update_points() {
	//checks if the mouse is clicked on an existing point, if so, the index of that point is allocated to dragged_point
	//if the mouse clicks on an empty spot, that point is appended to points.
	removing = false;

	if (frameCount - timestamp < 12) {
		removing = true;
	}
	timestamp = frameCount;

	mouse = new p5.Vector(mouseX, mouseY);
	for (var i = 0; i<points.length; i++) {
		mapped_point = new p5.Vector(mapX(points[i].x), mapY(points[i].y));
		if (mouse.dist(mapped_point) < 8) {
			dragged_point = i
		}
	}
	if (dragged_point < 0 && removing == false) {
		append_point();
	} else if (dragged_point >= 0 && removing == true) {
		points.splice(dragged_point, 1);
		interpolate();
		update_canvas();
		undo_drag();
	}
}

function undo_drag() {
	dragged_point = -1;
}

function append_point() {
	//maps the x and y location of the mouse to the range and appends a new vector with this x and y to the points array.
	//if the points are already interpolated, the interpolation is updated

	var x = map(mouseX, 0, width, -range.value(), range.value());
	var y = map(mouseY, height, 0, -range.value(), range.value());
	
	frame.stroke(0);
	frame.strokeWeight(2);
	frame.ellipse(mapX(x), mapY(y), 8, 8);
	points.push(new p5.Vector(x, y))
	if (interpolated) {
		interpolate();
	}
}

function check_points() {
	//check the location of the mouse, if it hoovers over a point it displays the coordinates. 
	//if dragged_point >= 0, it moves the indicated point to the mouse location. 

	mouse = new p5.Vector(mouseX, mouseY);
	for (var i = 0; i<points.length; i++) {
		if (i == dragged_point) {
			points[i].x = map(mouseX, 0, width, -range.value(), range.value());
			points[i].y = map(mouseY, height, 0, -range.value(), range.value());
			interpolate();
		}
			mapped_point = new p5.Vector(mapX(points[i].x), mapY(points[i].y));
			if (mouse.dist(mapped_point) < 8) {
				var x = int(points[i].x * 100)/100;
				var y = int(points[i].y * 100)/100;
				message = '['+ x + ' , ' + y +']';
				text(message, mapped_point.x + 10, mapped_point.y);
			}
	}
}

function interpolate() {
//function that fits a polynomial to a data set
	var n = points.length;
	interpolated = true;

	a = new Array(40);											//creates an empty array, somehow I don't get it to work otherwise
	for (var i = 0; i<40;i++) {
		a[i] = 0;
	}

	matrix = [];
	if (n > 0) {												//function only works if n>0, otherwise there are no points to interpolate
		for(var i = 0; i < n; i++) {
    		matrix.push(new Array(n));
  		}

  		matrix = populate_matrix(matrix, points, n);
  		matrix = inverse_matrix(matrix);
  		multiply_inverse(matrix, points, n);
  		display_function();


		update_canvas();

	}
}

function populate_matrix(matrix, data, n) {
	//inputs the x values of all the points (data) in a vandermonde Matrix of dimensions n. 

	for(var i = 0; i<n; i++) {
    	for(var j = 0; j<n; j++) {
      		matrix[i][j] = data[i].x ** j;
    	}
  	}
    return matrix;
} 

function multiply_inverse(matrix, data, n) {
	//multiplies a matrix the y-values of the data input. 
	for(var i = 0; i<n; i++) {
    	for(var j = 0; j<n; j++) { 
    		a[i] += matrix[i][j] * data[j].y;
    	} 
    }
}

function compute(x) {
	//evaluates a polynomial at point x
	terms = points.length;
	sum = 0;
	for (var i = 0; i <= terms; i++) {
		sum += a[i] * x**i;
	}
	return sum
}

function update_canvas() {
	//updates the frame, usually after re-evaluating the polynomial
	frame.background(255);
	drawAxes();
	display_graph();
	display_points();
}

function display_graph() {
	frame.stroke(0);
	frame.strokeWeight(2);
	increment = range.value()/300

	for(var i = -range.value() + increment; i < range.value(); i = i+increment) {
		
		frame.line(mapX(i), mapY(compute(i)), mapX(i - increment), mapY(compute(i - increment)));
	}
}

function display_points() {
	frame.stroke(0);
	frame.strokeWeight(2);
	for (var i = 0; i < points.length; i++) {
		frame.ellipse(mapX(points[i].x), mapY(points[i].y), 8, 8);
	}
}

function display_function() {

		message = ''											//create an empty string to display the function

		for (var i = 0; i < n; i++) {							//trim the float values to two decimals
			
			var exponent = ''
			var coeff = 0;
			var sign = ''

			if (abs(a[i]) < 0.1 && a[i] != 0) {					//if the value is small, display as exponent
				minus_exponent = 1;
				while (abs(a[i] * (10**minus_exponent)) < 1) {
					minus_exponent ++;
				}
				coeff = (a[i]*10**(minus_exponent));
				exponent = '*10<sup>-' + (minus_exponent-1) + '</sup>'
				coeff = Math.round(coeff)/10;
			} else {
				coeff = Math.round(a[i]*10)/10;
			}

			if (coeff > 0) {
				sign = ' + '
			} else {
				sign = ' - '
			}

			coeff = abs(coeff);

			if (i == 0) {										
				message = "f(x) = "
				if (sign == ' - ') {
					message += '-'
				}
				message += coeff + exponent;
			} else if (i == 1) {
				message += sign + coeff + exponent + 'x'; 
			} else {
				message += sign + coeff + exponent + 'x<sup>' + i + '</sup>'; 
			}
		}
		p.style("font-family: times; font-style: italic;");
		p.html(message);
}

function mapX(x) {
	//helper function to map X and Y coordinates from the range to the canvas width.
	var value = map(x, -range.value(), range.value(), 0, width);
	return value;
}

function mapY(y) {
	var value = map(y, -range.value(), range.value(), height, 0);
	return value;
}

function drawAxes(){
	//draws the coordinate axes onto the frame
	
	frame.strokeWeight(1);
	frame.stroke(255 - ((10 -range.value())*2));

	var increment = width/range.value();

	for (var i = 0; i < width/2; i = i + increment/8) {
		frame.line(width/2 +i, 0, width/2 +i, height);
		frame.line(width/2 -i, 0, width/2 -i, height);
		frame.line(0, height/2 +i, width, height/2 +i);
		frame.line(0, height/2 -i, width, height/2 -i);
	}

	frame.stroke(200);

	for (var i = 0; i < width/2; i = i + increment/2) {
		frame.line(width/2 +i, 0, width/2 +i, height);
		frame.line(width/2 -i, 0, width/2 -i, height);
		frame.line(0, height/2 +i, width, height/2 +i);
		frame.line(0, height/2 -i, width, height/2 -i);
	}

	frame.strokeWeight(1);											//x and y axes			
	frame.stroke(50);
	frame.line(0, height/2, width, height/2);
	frame.line(width/2, 0, width/2, height);


}

function createEmptyMatrix(n) {					//create an empty nxn matrix
	emptyMatrix = [];
	for (var i = 0; i < n; i++) {
		emptyMatrix[i] = new Array(n);
	}
	return emptyMatrix;
}

function inverse_matrix(matrix) {		
//function returns the inverse of the matrix passed as argument
	n = matrix.length;					
	I = create_identity_matrix(n);		
	C = [...matrix];							//copy the original matrix to variable C
	for (var i = 0; i < n; i++) {
		C[i] = [...matrix[i]];
	}
	
	for (var i = 0; i < n; i++) {				//loop trough the rows of the matrix
		if (C[i][i] == 0) {						//check if there's a zero on the diagonal, if so, swap with a non-zero row
			non_zero_index = search_nonzero_row(C, i, i);
			if (non_zero_index == 0) {
				print("matrix not invertible, original matrix returned")
				return matrix;
			} 
			swap_rows(C, i, non_zero_index)
			swap_rows(I, i, non_zero_index)
		}

		var divisor = C[i][i];					//make the leading entry 1 
		for (var j = 0; j < n; j++) {
			C[i][j] = C[i][j] / divisor;
			I[i][j] = I[i][j] / divisor;
		}
		
		row_reduce(C, I, i);
	}	
	return I;
}

function search_nonzero_row(matrix, i, j) {		
//returns the index of the first non-zero row at position j. Returns zero if none was found.  
	n = matrix.length;
	ti = i + 1;
	while (ti < n) {
		if (matrix[ti][j] != 0) {
			return ti
		} else {
			ti++
		}
	} return 0;
}

function swap_rows(matrix, i, non_zero_index) {
	zero_row = matrix[i];
	non_zero_row = [...matrix[non_zero_index]];
	matrix[i] = [...non_zero_row]
	matrix[non_zero_index] = [...zero_row]
}

function row_reduce(matrix, I, i) {
//function row reduces the row indexed by 'i' of 'matrix', and performs the same operation on I. 
	n = matrix.length;

	for (var ii = 0; ii < n; ii++) {
		if (ii != i) {
			multiplier = matrix[ii][i] / matrix[i][i];
			for (var j = 0; j<n; j++) {
				matrix[ii][j] -= matrix[i][j] * multiplier;
				I[ii][j] -= I[i][j] * multiplier;
			}
		}
	}
}

function create_identity_matrix(n) {		
//creates an identitymatrix with dimensions nxn
	identity = [];
	for (var i = 0; i < n; i++) {
		identity[i] = new Array(n);
	}
	for (var i = 0; i<n; i++) {
		for (var j = 0; j<n; j++){
			if (i == j) {
				identity[i][j] = 1;
			} else {
				identity[i][j] = 0;
			}
		}
	}
	return identity;
}

function initialize() {
	//initialize frame and canvas

	points = [];
	interpolated = false;
	
	frame.background(255);
	drawAxes();
	p.html('')
						//styling of the hoover text;
	noStroke();
	fill(0);
}


