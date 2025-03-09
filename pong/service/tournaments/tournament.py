from core.models import PongGame, TournamentMatch

def get_tournament_bracket(tournament):
    """
	Build a dictionary that represents the bracket of the tournament.
	The final structure is:
    {
        'rounds': [
            {
                'round': 1,
                'games': [
                    {
                        'game_id': <ID del juego>,
                        'player1': <nombre de usuario>,
                        'player2': <nombre de usuario>,
                        'winner': <nombre de usuario o None>
                    },
                    ...
                ]
            },
            ...
        ]
    }
    """
    rounds = {}
    for t_game in tournament.tournament_games.all().order_by('round_number'):
        r = t_game.round_number
        if r not in rounds:
            rounds[r] = []
        game = t_game.match
        rounds[r].append({
            'game_id': game.id,
            'player1': game.player1.username if game.player1 else None,
            'player2': game.player2.username if game.player2 else None,
            'winner': game.winner.username if game.winner else None,
        })
    bracket = {
        'rounds': [{'round': round_num, 'games': rounds[round_num]}
                   for round_num in sorted(rounds)]
    }
    return bracket

def are_all_matches_finished(tournament, round_number):
    """
    Checks if all matches in the specified round of the tournament have finished.
    It assumes that each TournamentGame has a 'match' field (PongGame) with a 'status' attribute.
    """
    matches = tournament.tournament_games.filter(round_number=round_number)
    return all(game.match.status == 'finished' for game in matches)


def create_next_round_matches(tournament, current_round):
    """
    Creates as many next round matches as possible using the winners of the current round.
    If all matches in the current round have been played, it creates the complete next round.
    The new matches are created with 'available' set to False.
    Returns a list of new TournamentMatch instances.
    """
    # Get current round matches ordered by their position in the tournament
    current_games = tournament.games.filter(
        tournament_match__round_number=current_round
    ).order_by('tournament_match__id')
    
    # Collect winners from finished matches
    winners = []
    for game in current_games:
        if game.status == 'finished' and game.winner:
            # Store bracket position based on game ID or another ordering mechanism
            position = game.tournament_match.id
            winners.append((position, game.winner))
    
    # Sort winners by their original position
    winners.sort(key=lambda x: x[0])
    winners_list = [w[1] for w in winners]
    
    # If not all current round matches are finished, only use complete pairs
    if not are_all_matches_finished(tournament, current_round):
        if len(winners_list) % 2 != 0:
            winners_list = winners_list[:-1]  # Remove last winner if odd number
    
    # If there are fewer than 2 winners, no match can be created
    if len(winners_list) < 2:
        return []
    
    next_round = current_round + 1
    new_match_list = []
    
    # Pair winners in order and create new matches
    for i in range(0, len(winners_list), 2):
        if i + 1 < len(winners_list):
            p1 = winners_list[i]
            p2 = winners_list[i + 1]
        else:
            # In case of an odd number (only possible if all matches finished), assign a bye
            p1 = winners_list[i]
            p2 = p1  # Duplicate to represent the bye
            
        new_game = PongGame.objects.create(
            player1=p1,
            player2=p2,
            board_width=700,
            board_height=500,
            player_height=50,
            player_speed=5,
            ball_side=10,
            start_speed=7.5,
            speed_up_multiple=1.02,
            max_speed=20,
            points_to_win=3,
            status='pending',
            is_tournament=True,
            tournament=tournament
        )
        
        # Create TournamentMatch
        new_match = TournamentMatch.objects.create(
            tournament=tournament,
            round_number=next_round,
            pong_game=new_game
        )
        
        new_match_list.append(new_match)
    
    return new_match_list


def process_tournament_round_bracket(tournament, finished_game):
    """
    Processes the tournament bracket for a finished game.
    1. Verifies that the finished_game belongs to the tournament.
    2. Uses current round information to create as many next round matches as possible.
    3. If all matches in the current round have been played, marks the next round matches as available.
    Returns a list of next round TournamentMatch instances, or None if the finished_game is not part of the tournament.
    """
    
    try:
        # Check if this game is part of the tournament
        if not hasattr(finished_game, 'tournament_match'):
            return None
            
        tournament_match = finished_game.tournament_match
        
        # Verify this match belongs to the specified tournament
        if tournament_match.tournament != tournament:
            return None
            
        current_round = tournament_match.round_number
        
        # Create next round matches based on the current information
        next_round_matches = create_next_round_matches(tournament, current_round)
        
        # If all current round matches are finished, make next round matches available
        if are_all_matches_finished(tournament, current_round):
            for match in next_round_matches:
                match.pong_game.status = 'pending'
                match.pong_game.save()
        
        return next_round_matches
        
    except:
        # The finished_game is not part of the tournament
        return None
