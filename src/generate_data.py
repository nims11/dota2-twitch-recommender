#!/usr/bin/python
import os
import requests
import time
import logging
import json

def populate_heroes():
    logging.info("Populating Heroes...")
    heroes = []
    heroes_api_response = requests.get('http://api.opendota.com/api/heroes').json()
    for hero in heroes_api_response:
        id = hero['id']
        name = hero['localized_name']
        while len(heroes) != id + 1:
            heroes.append(None)
        heroes[id] = name
    return heroes

def get_hero_vector(id, dim):
    logging.info("constructing hero vector for player: " + str(id))
    match_history = requests.get('http://api.opendota.com/api/players/%s/matches' % str(id), params={'limit': 100}).json()
    vector = []
    for x in match_history:
        vector.append(x['hero_id'])
    return vector

def populate_players(dim):
    player_list = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'players.csv')
    players = []
    with open(player_list) as f:
        for line in f:
            nick, _, twitch, dotabuff = line.strip().split(',')
            if dotabuff == '-' or twitch == '-':
                continue
            _id = int(dotabuff.split('/')[-1])
            players.append({
                'id': _id,
                'name': nick,
                'twitch': twitch,
                'history': get_hero_vector(_id, dim)
            })
            time.sleep(1)
    return players

def populate_data():
    heroes = populate_heroes()
    return {
        'heroes': heroes,
        'players': populate_players(len(heroes))
    }

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    with open('data.json', 'w') as f:
        f.write(json.dumps(populate_data()))
