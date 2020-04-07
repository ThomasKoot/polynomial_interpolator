var generate;
var points = [];
var range;
var reset;
var p;
var a = [];


function setup() {

	generate = createButton("generate");		//an interpolation buttin
	range = createSlider(1, 20, 10, 0);			//range slider
	canvas = createCanvas(500, 500);
  	p = createP("");							//p to hold the function definition
  	reset = createButton('reset');
  	
  	background(250);
  	drawAxes();
  	
  	canvas.mousePressed(append_point);
  	generate.mousePressed(interpolate);
  	range.input(update_canvas);
  	reset.mousePressed(initialize);

  	stroke(0);
	strokeWeight(3);
	fill(250);
	
}

function draw() {


}

function append_point() {
	var x = map(mouseX, 0, width, -range.value(), range.value());
	var y = map(mouseY, height, 0, -range.value(), range.value());
	stroke(0);
	strokeWeight(2);
	ellipse(mapX(x), mapY(y), 8, 8);
	points.push(new p5.Vector(x, y))
}

function interpolate() {
//function that fits a polynomial to a data set
	var n = points.length;

	a = new Array(40);
	for (var i = 0; i<40;i++) {
		a[i] = 0;
	}

	matrix = [];
	if (n > 0) {												//check whether elements have been added
		for(var i = 0; i < n; i++) {
    		matrix.push(new Array(n));
  		}
  		matrix = populate_matrix(matrix, points, n);
  		matrix = inverse_matrix(matrix);
  		multiply_inverse(matrix, points, n);
  		display_graph();

		message = ''

		for (var i = 0; i < n; i++) {
			var coeff = int(a[i] * 100);
			coeff /= 100;

			if (i == 0) {
				message = "f(x) = "
				message += coeff;
			} else if (i == 1) {
				message += ' + ' + coeff + 'x'; 
			} else {
				message += ' + ' + coeff + 'x<sup>' + i + '</sup>'; 
			}
			
		}
		p.style("font-family: times; font-style: italic;");
		p.html(message);

	}
}

function populate_matrix(matrix, data, n) {
	for(var i = 0; i<n; i++) {
    	for(var j = 0; j<n; j++) {
      		matrix[i][j] = data[i].x ** j;
    	}
  	}
    return matrix;
} 

function multiply_inverse(matrix, data, n) {
	for(var i = 0; i<n; i++) {
    	for(var j = 0; j<n; j++) { 
    		a[i] += matrix[i][j] * data[j].y;
    	} 
    }
}

function compute(x) {
	terms = points.length;
	sum = 0;
	for (var i = 0; i <= terms; i++) {
		sum += a[i] * x**i;
	}
	print(sum);
	return sum
}

function update_canvas() {
	background(250);
	drawAxes();
	display_graph();
	display_points();
}

function display_graph() {
	stroke(0);
	strokeWeight(2);

	for(var i = -range.value(); i < range.value(); i = i+0.01) {
		point(mapX(i), mapY(compute(i)));
	}
}

function display_points() {
	stroke(0);
	strokeWeight(2);
	for (var i = 0; i < points.length; i++) {
		ellipse(mapX(points[i].x), mapY(points[i].y), 8, 8);
	}
}


function mapX(x) {
	var value = map(x, -range.value(), range.value(), 0, width);
	return value;
}

function mapY(y) {
	var value = map(y, -range.value(), range.value(), height, 0);
	return value;
}

function drawAxes(){
	var increment = width/range.value();
	stroke(230);


	for (var i = 0; i < width/2; i = i + increment) {
		line(width/2 +i, 0, width/2 +i, height);
		line(width/2 -i, 0, width/2 -i, height);
		line(0, height/2 +i, width, height/2 +i);
		line(0, height/2 -i, width, height/2 -i);
	}

	strokeWeight(1);
	stroke(50);
	line(0, height/2, width, height/2);
	line(width/2, 0, width/2, height);

	


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
	points = [];
	background(250);
	drawAxes();
	p.html('')
}


