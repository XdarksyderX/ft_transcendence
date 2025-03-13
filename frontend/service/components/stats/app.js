import { renderMatchHistory } from "./history.js";
import { getQuickMatchStats, getTournamentStats } from "../../app/pong.js";


export function initializeStatsEvents() {
	renderPongStats();
	renderChessStats();
	renderMatchHistory();
}


const pongStats = {
	quickGame: {
		played: 100,
		wins: 67,
		losses: 33,
		streak: 10,
	},
	tournaments: {
		played: 20,
		first: 2,
		second: 3,
	}
};

const chessStats = {
	played: 30,
	wins: 2,
	losses: 28,
	streak: 1,
};

async function renderPongStats() {
	const pongQuick = document.getElementById('pong-quick-stats');
	const quickGameStats = await handleGetQuickMatchStats();
	if (!quickGameStats) return ;
	renderQuickGameStats(pongQuick, quickGameStats);

	const pongTournament = document.getElementById('pong-tournament-stats');
	const tourStats = await handleGetTournamentStats();
	if (!tourStats) return ;
	renderTournamentStats(pongTournament, tourStats);

}

function renderChessStats() {
	const chessQuick = document.getElementById('chess-quick-stats');
	renderQuickGameStats(chessQuick, chessStats);
}


async function handleGetQuickMatchStats() {
	const response = await getQuickMatchStats();
	if (response.status === "success") {
		return response.stats;
	} else {
		console.error("Error while fetching quick match stats:", response.message);
		return null;
	}
}

async function handleGetTournamentStats() {
	const response = await getTournamentStats();
	if (response.status === "success") {
		return response.stats;
	} else {
		console.error("Error while fetching quick match stats:", response.message);
		return null;
	}
}


/* {
    "status": "success",
    "message": "Quick match statistics retrieved successfully",
    "stats": {
        "played": 1,
        "won": 0,
        "lost": 1,
        "streak": 0,
        "highest_score": 0
    }
}
 */

function renderQuickGameStats(container, stats) {
	let winnRate = (stats.won / stats.played * 100).toFixed(2);
  	container.innerHTML = `
	<p><span class="fw-bold">Played:</span> ${stats.played}</p>
	<p><span class="fw-bold">Wins:</span> ${stats.won}</p>
	<p><span class="fw-bold">Losses:</span> ${stats.lost}</p>
	<p><span class="fw-bold">Win rate:</span> ${winnRate}%</p>
	<p><span class="fw-bold">Streak:</span> ${stats.streak}</p>
	<p><span class="fw-bold">Highest score: ${stats.highest_score}</p>
  `;
}

function renderTournamentStats(container, stats) {
  container.innerHTML = `
	<p><span class="fw-bold mt-2">Tournaments Played:</span> ${stats.played}</p>
	<p><span class="fw-bold">First place:</span> ${stats.first}</p>
	<p><span class="fw-bold">Second place:</span> ${stats.second}</p>
  `;
}