function renderAllTournaments(tournaments) {
    // console.log('Rendering all tournaments');
    const container = document.getElementById('tournaments-container');
    container.innerHTML = '';
  
    tournaments.forEach(oneTournament => {
      const tournament = generateTournament(oneTournament);
      container.appendChild(tournament);
    });
  
    container.addEventListener('click', (e) => {
      const matchElement = e.target.closest('.match.available'); // looks for the closest available match to the click
      if (matchElement) {
        const matchId = matchElement.dataset.matchId; //access to the data-match-id we added while creating the element
        const allMatches = tournaments.flatMap(tournament => tournament.phases.flatMap(phase => phase.matches)); // combines all matches in one array
        const match = allMatches.find(m => m.matchId.toString() === matchId); // looks for the clicked match on the array to check if it exists
        if (match) {
          // console.log('Match clicked:', match);
          triggerModal(match);
        }
      }
    });
  }
  
  function generateTournament(tournament) {
    // console.log('Generating tournament:', tournament.tournamentName);
    const container = document.createElement('div');
    container.classList.add("ctm-card");
    container.classList.add("neon-frame");
    container.classList.add("mt-5");
    const bracket = generateBracket(tournament);
    container.innerHTML = `
      <div class="text-center ctm-text-title mb-3">${tournament.tournamentName}</div>
      ${bracket.outerHTML}
    `;
    return container;
  }
  
  function generateBracket(tournament) {
    // console.log('Generating bracket for tournament:', tournament.tournamentName);
    const bracket = document.createElement('div');
    bracket.classList.add('bracket', 'ctm-text-light');
    tournament.phases.forEach(phase => {
      const round = generateRound(phase);
      bracket.appendChild(round);
    });
    return bracket;
  }
  
  function generateRound(phase) {
    // console.log('Generating round:', phase.number);
    const round = document.createElement('div');
    round.classList.add('round');
    if (phase.number % 2 === 0) {
      round.classList.add('even');
    }
    const matches = generateMatches(phase.matches, phase.status === 'open');
    round.innerHTML = `
      <div class="mt-2 ${phase.number === 1 ? '' : 'position-absolute top-0'}">Phase ${phase.number}</div>
    `;
    matches.forEach(matchElement => round.appendChild(matchElement));
    return round;
  }
  
  function generateMatches(matches, openPhase) {
    // console.log('Generating matches for phase, open:', openPhase);
    return matches.map(match => generateMatch(match, openPhase));
  }
  
  function generateMatch(match, openPhase) {
    // console.log('Generating match:', match.matchId);
    const matchElement = document.createElement('div');
    matchElement.id = match.matchId;
    matchElement.classList.add('match');
    
    if (match.status === 'pending' && openPhase && match.teams.length === 2) {
      // console.log('Match is pending, phase is open, and teams are complete:', match);
      if (match.teams.includes('Team A')) {
        matchElement.classList.add('available');
      }
      else
         matchElement.classList.add('pending');
      matchElement.dataset.matchId = match.matchId;
    }
    if (match.winner) {
      matchElement.classList.add('done');
    }
    
    matchElement.innerHTML = `
      <div class="${match.winner === match.teams[0] ? 'winner' : ''}">${match.teams[0]}</div>
      <div class="match-divider"></div>
      <div class="${match.winner === match.teams[1] ? 'winner' : ''}">${match.teams[1]}</div>
    `;
    
    return matchElement;
  }
  
  function triggerModal(match) {
    // console.log('Triggering modal for match:', match);
    const modal = new bootstrap.Modal(document.getElementById('start-match-modal'));
    modal.show();
  }
  
export function initializeOngoingTournaments() {
    const tournament1 = {
        tournamentName: "Copa champiñón",
        phases: [
          {
            number: 1,
            status: "closed",
            matches: [
              {
                matchId: 1,
                teams: ["Team A", "Team B"],
                status: "completed",
                winner: "Team A"
              },
              {
                matchId: 2,
                teams: ["Team C", "Team D"],
                status: "completed",
                winner: "Team C"
              },
              {
                matchId: 3,
                teams: ["Team E", "Team F"],
                status: "completed",
                winner: "Team F"
              },
              {
                matchId: 4,
                teams: ["Team G", "Team H"],
                status: "completed",
                winner: "Team G"
              }
            ]
          },
          {
            number: 2,
            status: "closed",
            matches: [
              {
                matchId: 5,
                teams: ["Team C", "Team G"],
                status: "completed",
                winner: "Team G"
              },
              {
                matchId: 6,
                teams: ["Team A", "Team F"],
                status: "completed",
                winner: "Team A"
              }
            ]
          },
          {
            number: 3,
            status: "closed",
            matches: [
              {
                matchId: 7,
                teams: ["Team G", "Team A"],
                status: "completed",
                winner: "Team A"
              }
            ]
          }
        ]
      };
      
      const tournament2 = {
        tournamentName: "Copa cebollino",
        phases: [
          {
            number: 1,
            status: "open",
            matches: [
              {
                matchId: 1,
                teams: ["Team A", "Team B"],
                status: "pending",
                winner: null
              },
              {
                matchId: 2,
                teams: ["Team C", "Team D"],
                status: "completed",
                winner: "Team C"
              },
              {
                matchId: 3,
                teams: ["Team E", "Team F"],
                status: "pending",
                winner: null
              },
              {
                matchId: 4,
                teams: ["Team G", "Team H"],
                status: "completed",
                winner: "Team G"
              }
            ]
          },
          {
            number: 2,
            status: "closed",
            matches: [
              {
                matchId: 5,
                teams: ["Team C", "Team G"],
                status: "pending",
                winner: null
              },
              {
                matchId: 6,
                teams: ["???", "???"],
                status: "pending",
                winner: null
              }
            ]
          },
          {
            number: 3,
            status: "closed",
            matches: [
              {
                matchId: 7,
                teams: ["???", "???"],
                status: "pending",
                winner: null
              }
            ]
          }
        ]
      };
      
      const tournaments = [tournament1, tournament2];
    renderAllTournaments(tournaments);
}
