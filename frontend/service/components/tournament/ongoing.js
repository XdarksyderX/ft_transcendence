import { getTournamentDetail, listTournaments,  joinTournamentQueue, leaveTournamentQueue} from "../../app/pong.js";
import { throwAlert } from "../../app/render.js";
import { getUsername } from "../../app/auth.js";
import { navigateTo } from "../../app/router.js";

let hasFinished = false;

// Initializes the ongoing tournaments by fetching their details and rendering them
export async function initializeOngoingTournaments() {
  setSwitches();
  const tourList = await handleGetTournamentList();
  const ongoing = await getTournamentsBracket(tourList, false);
  const finished = await getTournamentsBracket(tourList, true);

  const ongoingContainer = document.getElementById('ongoing-container');
  const finishedContainer = document.getElementById('finished-container');

  if (ongoing) {
    initModalEvents();
  } if (finished) {
    hasFinished = true;
  }
    renderAllTournaments(ongoing, ongoingContainer, false);
    renderAllTournaments(finished, finishedContainer, true);
    
}

// Fetches the list of tournaments and their details, then constructs the tournament brackets
async function getTournamentsBracket(tourList, finished) {
  const tokens = await getTournamentsTokens(tourList, finished);
  if (tokens.length === 0) {
    return null;
  }
  let tournaments = {};

  for (const token of tokens) {
    const tournamentDetail = await handleGetTournamentDetail(token);
    const tournamentBracket = getTournamentBracket(tournamentDetail);
    tournaments[token] = tournamentBracket;
  }
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
async function getTournamentsTokens(tournaments, finished) {
  return tournaments
    .filter(tournament => finished ? tournament.is_finished : (tournament.is_closed && !tournament.is_finished))
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
    token: tournament.token,
    name: tournament.name,
    bracket: { rounds }
  };
}

function renderNoneTournaments(container, finished) {
  if (finished) {
    container.innerHTML = `
        <div id="no-tournaments-card" class="card ctm-card p-5">
        <h3 class="my-2 ctm-text-light text-center">You don't have finished any tournament!</h3>
        <p class="my-3 ctm-text-light text-center">Going back to ongoing ones</p>
 <div class="text-center">
  <div class="spinner-border ctm-text-light" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>
</div>
      </div>`;
  } else {

    container.innerHTML = `
    <div id="no-tournaments-card" class="card ctm-card p-5">
		<h3 class="my-2 ctm-text-light text-center">You don't have any ongoing tournament!</h3>
		<p class="my-3 ctm-text-light text-center">But you can create one or check the status of the ones you already created here!</p>
    <div id="create-edit-btn" class="btn ctm-btn mb-3 flex-grow-1 d-flex align-items-center justify-content-center">Create/edit Tournament</div>
		</div>
    </div>`;
    
    container.querySelector('#create-edit-btn').addEventListener('click', () => navigateTo('new-tournament'));
  }
}

// Renders all tournaments by generating their HTML elements and appending them to the container
function renderAllTournaments(tournaments, container, finished) {
  if (!tournaments) {
    return renderNoneTournaments(container, finished);
  }

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
  container.classList.add("ctm-card", "p-5");
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
    const roundElement = generateRound(round, tournament.token);
    bracket.appendChild(roundElement);
  });
  return bracket;
}

// Generates the HTML element for a round in the tournament
function generateRound(round, token) {
  const roundElement = document.createElement('div');
  const openClass = round.status === 'open' ? 'open' : '';
  const roundClass = round.round === 1 ? 'justify-content-between' : '';

  roundElement.className = `round ${openClass} d-flex flex-column`;
  console.log("round: ", round);

  const matches = generateMatches(round.games, token);
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
function generateMatches(games, token) {
  return games.map(game => {
    // Attach the token to each match object so we can reference it later
    game.token = token;
    return generateMatch(game);
  });
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

async function initModalEvents() {

  const modalEl = document.getElementById('start-match-modal');
  const modal = new bootstrap.Modal(modalEl);
  const playButton = modalEl.querySelector('#play-btn'); // The "Play" button

  playButton.addEventListener('click', async (event) => {
    
    event.preventDefault();
    // match.token is the tournament token we attached earlier
    const token = modalEl.getAttribute('data-token');
    await leaveTournamentQueue(token);
    const response = await joinTournamentQueue(token)
    if (response.status === 'success') {
      inQueue = true;
      toggleModalContent(modalEl);
    } else {
      throwAlert(`Error joining match queue`);
    }
  });

  modalEl.addEventListener('hide.bs.modal', async () => {
    console.log("modal closed, queue:", inQueue)
    if (inQueue) {
      const token = modalEl.getAttribute('data-token');
      await leaveTournamentQueue(token);
      toggleModalContent(modalEl);
      inQueue = false;
    }
  });
}

let inQueue = false;
// Triggers the modal to play a match
async function triggerPlayMatchModal(match)
{
  console.log("Reached triggerPlayMatchModal");
  const modalEl = document.getElementById('start-match-modal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
  modalEl.setAttribute('data-token', match.token)
}

function toggleModalContent(modalEl) {
/*   const yourself = getUsername();
  const oponent = match.player1 === yourself ? match.player2 : match.player1; */
  const join = modalEl.querySelector('#join-queue');
  const wait = modalEl.querySelector('#wait-oponent');
  const bars = modalEl.querySelector('#loading-bars');
  const btns = modalEl.querySelector('.modal-footer');

  const elements = [join, wait, bars, btns];
  elements.forEach(element => {
    element.classList.toggle('hidden');
  });
}

export function handleJoinTournamentMatch(gameKey) {
  const modalEl = document.getElementById('start-match-modal');
  const modal = bootstrap.Modal.getInstance(modalEl); 
  modal.hide();
  
  setTimeout(() => {
    navigateTo('/pong', gameKey);
  }, 1000);
}

function setSwitches() {
  const switches = document.querySelectorAll("#tournaments .switch-btn");

  switches.forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      switches.forEach((btn) => btn.classList.toggle("active"));

      // Check if the second switch is clicked and hasFinished is false
      if (btn.classList.contains('switch-btn-right') && !hasFinished) {
        setTimeout(() => {
          // Click the first switch button again
          document.querySelector('.switch-btn-left').click();
        }, 1500); // Set the timeout duration as needed
      }
    });
  });
  return switches;
}