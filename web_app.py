import os
import datetime
from pymongo import MongoClient
from flask import Flask, jsonify, render_template, request

APP = Flask(__name__)


MONGO_URL = os.environ.get('MONGO_URL')

CLIENT = MongoClient(MONGO_URL)
DB = CLIENT['prscores']
SCORES = DB['scores']
KEYS = DB['keys']

APP = Flask(__name__)

APP.secret_key = os.environ.get('SECRET_KEY')

LETS_ENCRYPT_CHALLENGE = os.environ.get('LETS_ENCRYPT_CHALLENGE')
LETS_ENCRYPT_RESPONSE = os.environ.get('LETS_ENCRYPT_RESPONSE')

@APP.route('/')
def index():
    return render_template("index.html")

@APP.route('/entry', methods=["POST"])
def entry():
    key_check = KEYS.find_one({'key': request.headers.get('X-Api-Key')})
    if key_check and key_check.get('valid'):
        new_entry = {'timestamp': datetime.datetime.now()}
        new_entry.update({'username':request.get_json().get('username')})
        new_entry.update({'score' : int(request.get_json().get('score'))})
        new_entry.update({'judge' : request.get_json().get('judgement')})
        SCORES.insert_one(new_entry)
        return jsonify(entry={'success': True})
    else:
        return jsonify(entry={'success': False})

@APP.route('/high_scores')
def high_scores(table=None):
        high_scores_pass = list(SCORES.find(
            {'judge':True}, {'_id': 0}).sort('score', 1).limit(5))
        high_scores_fail = list(SCORES.find(
            {'judge':False}, {'_id': 0}).sort('score', 1).limit(5))
        if request.args.get('table'):
            return render_template("highscore.html", high_scores_pass=high_scores_pass, high_scores_fail=high_scores_fail)
        elif request.args.get('json'):
            return jsonify(high_scores_pass=high_scores_pass, high_scores_fail=high_scores_fail)
        else:
            pass_score_times = [score.pop('timestamp') for score in high_scores_pass]
            fail_score_times = [score.pop('timestamp') for score in high_scores_fail]
            return {'high_scores_pass':high_scores_pass, 'high_scores_fail':high_scores_fail}


@APP.route('/robo-judge')
def robo_judge():
    return render_template("roboJudge.html")

@APP.route('/.well-known/acme-challenge/<challenge_string>')
def acme_challenge(challenge_string):
    if challenge_string == LETS_ENCRYPT_CHALLENGE:
        return LETS_ENCRYPT_RESPONSE
    else:
        return "Doesn't match"

if __name__ == '__main__':
    APP.run(debug=True, host="0.0.0.0")
