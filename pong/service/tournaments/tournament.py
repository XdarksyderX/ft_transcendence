from core.models import PongGame, TournamentGame

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
    
    Returns a list of new TournamentGame instances.
    """
    # Get current round TournamentGames ordered by bracket_position.
    current_games = tournament.tournament_games.filter(round_number=current_round).order_by('bracket_position')
    
    # Collect winners from finished matches.
    winners = []
    for tg in current_games:
        if tg.match.status == 'finished' and tg.match.winner:
            winners.append((tg.bracket_position, tg.match.winner))
    
    # Sort winners by their original bracket_position.
    winners.sort(key=lambda x: x[0])
    winners_list = [w[1] for w in winners]
    
    # If not all current round matches are finished, only use complete pairs.
    if not are_all_matches_finished(tournament, current_round):
        if len(winners_list) % 2 != 0:
            winners_list = winners_list[:-1]
    
    # If there are fewer than 2 winners, no match can be created.
    if len(winners_list) < 2:
        return []
    
    next_round = current_round + 1
    new_tg_list = []
    
    # Pair winners in order and create new matches.
    for i in range(0, len(winners_list), 2):
        if i + 1 < len(winners_list):
            p1 = winners_list[i]
            p2 = winners_list[i + 1]
        else:
            # In case of an odd number (only possible if all matches finished), assign a bye.
            p1 = winners_list[i]
            p2 = winners_list[i]  # Duplicate to represent the bye.
        
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
            available=False,  # Not playable yet.
            status='pending'
        )
        # Determine new bracket position (for example, based on pairing order).
        new_bracket_position = (i // 2) + 1
        new_tg = TournamentGame.objects.create(
            tournament=tournament,
            match=new_game,
            round_number=next_round,
            bracket_position=new_bracket_position
        )
        new_tg_list.append(new_tg)
    
    return new_tg_list


def process_tournament_round_bracket(tournament, finished_game):
    """
    Processes the tournament bracket for a finished game.
    
    1. Verifies that the finished_game belongs to the tournament through TournamentGame.
    2. Uses current round information to create as many next round matches as possible (via create_next_round_matches).
    3. If all matches in the current round have been played, marks the next round matches as available.
    
    Returns a list of next round TournamentGame instances, or None if the finished_game is not part of the tournament.
    """
    from django.core.exceptions import ObjectDoesNotExist

    try:
        current_tg = TournamentGame.objects.get(tournament=tournament, match=finished_game)
    except TournamentGame.DoesNotExist:
        # The finished_game is not part of the tournament.
        return None

    current_round = current_tg.round_number

    # Create next round matches based on the current information.
    next_round_games = create_next_round_matches(tournament, current_round)

    # If all current round matches are finished, mark the next round matches as available.
    if are_all_matches_finished(tournament, current_round):
        for tg in next_round_games:
            if not tg.match.available:
                tg.match.available = True
                tg.match.save()

    return next_round_games
