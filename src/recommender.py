#!/usr/bin/python
import logging
import numpy as np
import requests
from collections import defaultdict
from tqdm import tqdm
from generate_data import populate_data, get_hero_vector

class CosineSimiNearestNeighbors(object):
    def __init__(self):
        self.vectors = []

    def fit(self, X):
        for vector in X:
            self.vectors.append(np.array(vector)/np.linalg.norm(vector))
        self.vectors = np.array(self.vectors)
        return self

    def kneighbors(self, X, k=1):
        scores = np.dot(X, self.vectors.transpose()) / (np.array([[np.linalg.norm(x)] for x in X]))
        return [score[-k:][::-1] for score in scores.argsort()]

def create_player_space(players):
    X = [player['vector'] for player in players]
    neigh = CosineSimiNearestNeighbors()
    neigh.fit(X)
    return neigh

def recommend_players(id, k=10):
    logging.info("recommending for player: " + str(id))
    vector = get_hero_vector(id, len(data['heroes']))
    return [data['players'][idx] for idx in player_space.kneighbors([vector], k=k)[0]]

data = populate_data()
player_space = create_player_space(data['players'], separators=(',', ':'))
