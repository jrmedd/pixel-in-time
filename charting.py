import datetime

from pymongo import MongoClient

MONGO_URL = "mongodb://prscores:ea696274e7176e0e68f7954f10b58c65@18.134.237.74:1811/prscores"

CLIENT = MongoClient(MONGO_URL)
DB = CLIENT['prscores']
SCORES = DB['scores']

scores = list(SCORES.find({}))

players = set(entry.get('username') for entry in scores)

scores_by_player = {}
for player in players:
    scores_by_player[player] = {'id':player, 'data':[]}

for score in scores:
    scores_by_player[score.get('username')]['data'].append({'x':score.get('timestamp').isoformat(), 'y':score.get('score')})

print(scores_by_player)