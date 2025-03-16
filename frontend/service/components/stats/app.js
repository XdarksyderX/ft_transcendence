import { renderMatchHistory } from "./history.js";
import { getQuickMatchStats, getTournamentStats } from "../../app/pong.js";
import { getChessStats } from "../../app/chess.js";

export function initializeStatsEvents() {
    renderPongStats();
    renderChessStats();
    renderMatchHistory();
}

async function renderPongStats() {
    const pongQuick = document.getElementById('pong-quick-stats');
    const quickGameStats = await handleGetStats(getQuickMatchStats);
    if (!quickGameStats) return ;
    renderQuickGameStats(pongQuick, quickGameStats);

    const pongTournament = document.getElementById('pong-tournament-stats');
    const tourStats = await handleGetStats(getTournamentStats);
    if (!tourStats) return ;
    renderTournamentStats(pongTournament, tourStats);
}

async function renderChessStats() {
    const chessQuick = document.getElementById('chess-quick-stats');
    const stats = await handleGetStats(getChessStats);
    if (!stats) return ;
    renderChessGameStats(chessQuick, stats);
}

async function handleGetStats(getStatsFunction) {
    const response = await getStatsFunction();
    if (response.status === "success") {
        return response.stats || response.data;
    } else {
        console.error("Error while fetching stats", response.message);
        return null;
    }
}

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

function renderChessGameStats(container, stats) {
	console.log("hola caracola: ", stats);
    container.innerHTML = `
    <p><span class="fw-bold">Games Played:</span> ${stats.games_played}</p>
    <p><span class="fw-bold">Games Won:</span> ${stats.games_won}</p>
    <p><span class="fw-bold">Games Lost:</span> ${stats.games_lost}</p>
    <p><span class="fw-bold">Draws:</span> ${stats.draws}</p>
    <p><span class="fw-bold">Highest Rating:</span> ${stats.highest_rating}</p>
	`;
    // <p><span class="fw-bold">Username:</span> ${stats.username}</p>
    // <p><span class="fw-bold">Created At:</span> ${new Date(stats.created_at).toLocaleString()}</p>
    // <p><span class="fw-bold">Updated At:</span> ${new Date(stats.updated_at).toLocaleString()}</p>
}