import { getTournamentDetail, listTournaments } from "../../app/pong.js";
import { throwAlert } from "../../app/render.js";
import { getUsername } from "../../app/auth.js";

// Initializes the ongoing tournaments by fetching their details and rendering them
export async function initializeOngoingTournaments() {
  const tournaments = await getAllTournamentsBracket();
  renderAllTournaments(tournaments);
}

// Fetches the list of tournaments and their details, then constructs the tournament brackets
async function getAllTournamentsBracket() {
  const tourList = await handleGetTournamentList();
  const tokens = await getOngoingTournamentsTokens(tourList);
  let tournaments = {};

  for (const token of tokens) {
    const tournamentDetail = await handleGetTournamentDetail(token);
    const tournamentBracket = getTournamentBracket(tournamentDetail);
    tournaments[token] = tournamentBracket;
  }
  console.log("on getAllTournamentsDetail:")
  console.log(tournaments);
  return tournaments;
}

// Fetches the list of tournaments from the server
async function handleGetTournamentList() {
  const response = await listTournaments();
  if (response.status !== 'success') {
    return throwAlert("Error while fetching tournament list");
  }
  console.log(response);
  return response.tournaments;
}

// Filters the tournaments to get the tokens of ongoing tournaments
async function getOngoingTournamentsTokens(tournaments) {
  return tournaments
    .filter(tournament => tournament.is_closed /* && !tournament.is_finished */)
    .map(tournament => tournament.token);
}

// Fetches the details of a specific tournament using its token
async function handleGetTournamentDetail(token) {
  const response = await getTournamentDetail(token);
  if (response.status !== "success") {
    return throwAlert("Error while fetching tournament detail");
  }
  return response.tournament;
}

// Constructs the tournament bracket with rounds and games
function getTournamentBracket(tournament) {
  const rounds = [];
  const maxPlayers = tournament.max_players;
  const totalRounds = Math.ceil(Math.log2(maxPlayers));
  const existingRounds = tournament.bracket.rounds;

  for (let i = 0; i < totalRounds; i++) {
    const roundNumber = i + 1;
    const existingRound = existingRounds.find(round => round.round === roundNumber);
    if (existingRound) {
      // Set the status of the last real round to 'open'
      if (roundNumber === existingRounds.length) {
        existingRound.status = 'open';
      }
      rounds.push(existingRound);
    } else {
      const gamesCount = maxPlayers / Math.pow(2, roundNumber);
      const games = Array.from({ length: gamesCount }, (_, index) => ({
        game_id: 0,
        player1: "???",
        player2: "???",
        winner: null
      }));
      // Set the status of the autofilled rounds to 'closed'
      rounds.push({ round: roundNumber, games, status: 'closed' });
    }
  }

  return {
    name: tournament.name,
    bracket: { rounds }
  };
}

// Renders all tournaments by generating their HTML elements and appending them to the container
function renderAllTournaments(tournaments) {
  const container = document.getElementById('tournaments-container');
  container.innerHTML = '';

  console.log("generating one tournament element");
  Object.values(tournaments).forEach(tournament => {
    const tournamentElement = generateTournament(tournament);
    container.appendChild(tournamentElement);
  });

  container.addEventListener('click', (e) => {
    const matchElement = e.target.closest('.match.available');
    if (matchElement) {
      const matchId = matchElement.dataset.matchId;
      const allMatches = Object.values(tournaments).flatMap(tournament => 
        tournament.bracket.rounds.flatMap(round => round.games)
      );
      const match = allMatches.find(m => m.game_id.toString() === matchId);
      if (match) {
        triggerPlayMatchModal(match);
      }
    }
  });
}

// Generates the HTML element for a tournament
function generateTournament(tournament) {
  const container = document.createElement('div');
  container.classList.add("ctm-card", "neon-frame", "mt-5");
  const bracket = generateBracket(tournament);
  container.innerHTML = `
    <h3 class="text-center ctm-text-title mb-3">${tournament.name}</h3>
    ${bracket.outerHTML}
  `;
  return container;
}

// Generates the HTML element for the tournament bracket
function generateBracket(tournament) {
  const bracket = document.createElement('div');
  bracket.classList.add('bracket', 'ctm-text-light');
  tournament.bracket.rounds.forEach(round => {
    const roundElement = generateRound(round);
    bracket.appendChild(roundElement);
  });
  return bracket;
}

// Generates the HTML element for a round in the tournament
function generateRound(round) {
  const roundElement = document.createElement('div');
  const openClass = round.status === 'open' ? 'open' : '';
  const roundClass = round.round === 1 ? 'justify-content-between' : '';

  roundElement.className = `round ${openClass} d-flex flex-column`;
  console.log("round: ", round);

  const matches = generateMatches(round.games);
  roundElement.innerHTML = `
    <h4 class="mt-2 mb-4 position-absolute top-0">Round ${round.round}</h4>
    <div class="matches-container align-items-center ms-0 d-flex flex-column ${roundClass}"></div>
  `;
  
  const matchesContainer = roundElement.querySelector('.matches-container');
  matches.forEach((matchElement, index) => {
    matchesContainer.appendChild(matchElement);
    if (index < matches.length - 1) {
      const divider = document.createElement('div');
      divider.classList.add('match-divider');
      matchesContainer.appendChild(divider);
    }
  });
  
  return roundElement;
}

// Generates the HTML elements for the matches in a round
function generateMatches(games) {
  return games.map(game => generateMatch(game));
}

// Generates the HTML element for a match in a round
function generateMatch(game) {
  const matchElement = document.createElement('div');
  matchElement.id = game.game_id;
  matchElement.classList.add('match');
  
  if (!game.winner && game.player1 && game.player2) {
    const itsMe = (getUsername() === game.player1 || getUsername() === game.player2);
    if (itsMe) {
      matchElement.classList.add('available');
    }
    matchElement.classList.add('pending');
    matchElement.dataset.matchId = game.game_id;
  }
  if (game.winner) {
    matchElement.classList.add('done');
  }

  matchElement.innerHTML = `
    <div class="${game.winner === game.player1 ? 'winner' : ''}">${game.player1}</div>
    <div class="match-divider"></div>
    <div class="${game.winner === game.player2 ? 'winner' : ''}">${game.player2}</div>
  `;

  return matchElement;
}

// Triggers the modal to play a match
function triggerPlayMatchModal(match) {
  const modal = new bootstrap.Modal(document.getElementById('start-match-modal'));
  modal.show();
}