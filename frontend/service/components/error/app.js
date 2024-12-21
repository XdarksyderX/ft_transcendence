export function initialize404() {
	const canvas = document.getElementById("neon-canvas");
	const ctx = canvas.getContext("2d");

	const robotImage = new Image();
	const questionImages = [ // we initially define the 3 image paths
			"../resources/404/question1.png",
			"../resources/404/question2.png",
			"../resources/404/question3.png",
		].map(src => { // map creates a new array of Image objects with the paths set as their src
			const img = new Image();
			img.src = src;
			return img;
		});
		
		let questionIndex = 0;
		let shadowSize = 0;
		let increment = true;
		
		robotImage.src = "../resources/404/bot.png";
		robotImage.onload = () => {
			resizeCanvas();
			applyInitialGreenColor();
			startNeonEffect();
			startQuestionAnimation();
		};
		
		// resizes canvas ensuring the aspect ratio of the image
		function resizeCanvas() {
			const width = canvas.clientWidth;
			const height = width * (robotImage.height / robotImage.width);
			canvas.width = width;
			canvas.height = height;
		}
		// applies green to all pixels of the canvases
		function applyInitialGreenColor() {
			ctx.fillStyle = 'rgb(0, 245, 106)';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}
		
		
}