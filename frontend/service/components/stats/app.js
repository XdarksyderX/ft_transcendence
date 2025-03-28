import { renderMatchHistory } from "./history.js";
import { getQuickMatchStats, getTournamentStats } from "../../app/pong.js";
import { getCasualChessStats, getRankedChessStats } from "../../app/chess.js";

export function initializeStatsEvents() {
    renderPongStats();
    renderChessStats();
    renderMatchHistory();
    setSwitches();
}
function setSwitches() {
    const switches = document.querySelectorAll("#stats .switch-btn");

    switches.forEach((btn) => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            switches.forEach((btn) => btn.classList.remove("active"));
            btn.classList.add("active");
        });
    });
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
    const casualContainer = document.getElementById('chess-casual-stats');
    const casualStats = await handleGetStats(getCasualChessStats);
    if (!casualStats) return ;
    renderChessGameStats(casualContainer, casualStats);
    
    const rankedsContainer = document.getElementById('chess-ranked-stats');
    const rankedStats = await handleGetStats(getRankedChessStats);
    renderChessGameStats(rankedsContainer, rankedStats, true);
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
    let winRate = stats.played === 0 ? 0 : (stats.won / stats.played * 100).toFixed(2);
      container.innerHTML = `
    <p><span class="fw-bold">Played:</span> ${stats.played}</p>
    <p><span class="fw-bold">Wins:</span> ${stats.won}</p>
    <p><span class="fw-bold">Losses:</span> ${stats.lost}</p>
    <p><span class="fw-bold">Win rate:</span> ${winRate}%</p>
    <p><span class="fw-bold">Streak:</span> ${stats.streak}</p>
    <p><span class="fw-bold">Highest score:</span> ${stats.highest_score}</p>
  `;
}

function renderTournamentStats(container, stats) {
  container.innerHTML = `
    <p><span class="fw-bold mt-2">Tournaments Played:</span> ${stats.played}</p>
    <p><span class="fw-bold">First place:</span> ${stats.first}</p>
    <p class="mb-2" ><span class="fw-bold">Second place:</span> ${stats.second}</p>
  `;
}

function renderChessGameStats(container, stats, isRanked = false) {
    let rate = {}
    if (isRanked) {
        rate.title = 'Highest Rating:'
        rate.value = stats.highest_rating
    } else {
        let winRate = stats.games_played === 0 ? 0 : (stats.games_won / stats.games_played * 100).toFixed(2);
        rate.title = 'Win Rate:'
        rate.value = `${winRate}%`;
    }
	console.log("hola caracola: ", stats);
    container.innerHTML = `
    <p><span class="fw-bold">Games Played:</span> ${stats.games_played}</p>
    <p><span class="fw-bold">Games Won:</span> ${stats.games_won}</p>
    <p><span class="fw-bold">Games Lost:</span> ${stats.games_lost}</p>
    <p><span class="fw-bold">Draws:</span> ${stats.draws}</p>
    <p class="mb-2"><span class="fw-bold">${rate.title}</span> ${rate.value}</p>
	`;
}