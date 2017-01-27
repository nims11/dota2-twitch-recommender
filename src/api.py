from flask import Flask, jsonify
from collections import defaultdict
import recommender

app = Flask(__name__)

def get_heroes_summary(vector, n=10):
    heroes = recommender.data['heroes']
    results = sorted([
        {'id': id, 'name': heroes[id], 'count': count}
        for id, count in enumerate(vector) if count > 0
    ], key=lambda x: -x['count'])

    return results[:n] if n is not None else results

@app.route('/players', methods=['GET'])
def get_players():
    players = [
        {
            'id': p['id'],
            'name': p['name'],
            'twitch': p['twitch'],
            'heroes': get_heroes_summary(p['vector'])
        } for p in recommender.data['players']
    ]
    return jsonify(players)

@app.route('/heroes', methods=['GET'])
def get_heroes():
    players = recommender.data['players']
    heroes = recommender.data['heroes']
    hero_players = defaultdict(list)
    for player in recommender.data['players']:
        for hero_id, cnt in enumerate(player['vector']):
            if cnt > 0 and heroes[hero_id] is not None:
                hero_players[hero_id].append(
                    ({'id': player['id'], 'name': player['name'], 'twitch': player['twitch']}, cnt)
                )

    heroes_json = [
        {
            'id': idx,
            'name': heroes[idx],
            'players': [
                {
                    'id': player['id'],
                    'name': player['name'],
                    'twitch': player['twitch'],
                    'count': count
                } for player, count in sorted(hero_players[idx], key=lambda x: -x[1])
            ][:10]
        }
        for idx in hero_players
    ]
    return jsonify(heroes_json)

@app.route('/hero/<int:id>', methods=['GET'])
def get_hero(id):
    hero = recommender.data['heroes'][id]
    players = sorted([
        {'id': p['id'], 'name': p['name'], 'twitch': p['twitch'], 'count': p['vector'][id]}
        for p in recommender.data['players'] if p['vector'][id] > 0
    ], key=lambda x: -x['count'])
    return jsonify({
        'id': id,
        'name': hero,
        'players': players
    })

if __name__ == '__main__':
    app.run(debug=True)
