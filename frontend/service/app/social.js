export async function getBlockedUsers() { // quiero emular asincronía pa no morirme del asco luego
	return new Promise((resolve) => {
		setTimeout(() => {
		resolve({
			status: "success",
			data: [
			{
				id: 1,
				username: "la pija",
				avatar: "../../resources/avatar/avatar_1.png",
			},
			{
				id: 2,
				username: "la hierbas",
				avatar: "../../resources/avatar/avatar_2.png",
			},
			{
				id: 3,
				username: "el chorizo",
				avatar: "../../resources/avatar/avatar_3.png",
			},
			{
				id: 4,
				username: "Andrés",
				avatar: "../../resources/avatar/avatar_1.png",
			},
			{
				id: 5,
				username: "Roberto",
				avatar: "../../resources/avatar/avatar_2.png",
			},
			{
				id: 6,
				username: "Fernando",
				avatar: "../../resources/avatar/avatar_3.png",
			},
			],
			message: "Blocked users fetched successfully",
		});
		}, 500); // simula un retraso de medio segundo
	});
}