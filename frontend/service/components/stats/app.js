import { renderMatchHistory } from "./history.js";

export function initializeStatsEvents() {
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

	  function renderPongStats() {
		const pongQuick = document.getElementById('pong-quick-stats');
		renderQuickGameStats(pongQuick, pongStats.quickGame);
  
		const pongTournament = document.getElementById('pong-tournament-stats');
		renderTournamentStats(pongTournament, pongStats.tournaments);
  
		const fullPongHistory = document.getElementById('full-pong-history');
		fullPongHistory.innerHTML = '<p>Pong match history will be displayed here.</p> <p>or not, who knows</p>';
	  }
  
	  function renderChessStats() {
		const chessQuick = document.getElementById('chess-quick-stats');
		renderQuickGameStats(chessQuick, chessStats);
  
		const fullChessHistory = document.getElementById('full-chess-history');
		fullChessHistory.innerHTML = '<p>Chess match history will be displayed here.</p>';
	  }

	  renderPongStats();
	  renderChessStats();
	  renderMatchHistory();
}

function renderQuickGameStats(container, stats) {
	let winnRate = (stats.wins / stats.played * 100).toFixed(2);
  	container.innerHTML = `
	<p><span class="fw-bold">Played:</span> ${stats.played}</p>
	<p><span class="fw-bold">Wins:</span> ${stats.wins}</p>
	<p><span class="fw-bold">Losses:</span> ${stats.losses}</p>
	<p><span class="fw-bold">Win rate:</span> ${winnRate}%</p>
	<p><span class="fw-bold">Longest winning streak: ${stats.streak}</p>
  `;
}

function renderTournamentStats(container, stats) {
  container.innerHTML = `
	<p><span class="fw-bold">Tournaments Played:</span> ${stats.played}</p>
	<p><span class="fw-bold">First place:</span> ${stats.first}</p>
	<p><span class="fw-bold">Second place:</span> ${stats.second}</p>
  `;
}