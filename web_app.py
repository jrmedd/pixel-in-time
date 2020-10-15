import os
import datetime
from pymongo import MongoClient
from flask import Flask, jsonify, render_template, request, make_response, send_from_directory
from flask_socketio import SocketIO

APP = Flask(__name__)


MONGO_URL = os.environ.get('MONGO_URL')

CLIENT = MongoClient(MONGO_URL)
DB = CLIENT['prscores']
SCORES = DB['scores']
KEYS = DB['keys']

APP = Flask(__name__)
SOCKETIO = SocketIO(APP)

APP.secret_key = os.environ.get('SECRET_KEY')

LETS_ENCRYPT_CHALLENGE = os.environ.get('LETS_ENCRYPT_CHALLENGE')
LETS_ENCRYPT_RESPONSE = os.environ.get('LETS_ENCRYPT_RESPONSE')

@APP.route('/')
def index():
    return render_template("index.html")

@APP.route('/entry', methods=["POST"])
def entry():
    new_entry = {'timestamp': datetime.datetime.now()}
    new_entry.update({'username':request.get_json().get('username')})
    new_entry.update({'score' : request.get_json().get('score')})
    new_entry.update({'judge' : request.get_json().get('judgement')})
    SCORES.insert_one(new_entry)
    print(high_scores())
    SOCKETIO.emit('new-scores', high_scores(as_dict=True), namespace='/scores')
    print("Emitted")
    return jsonify(entry={'success': True})

@APP.route('/high_scores')
def high_scores(as_dict=None):
    print(request)
    high_scores_pass = list(SCORES.find(
        {'judge':True}, {'_id': 0}).sort('score', 1).limit(5))
    high_scores_fail = list(SCORES.find(
        {'judge':False}, {'_id': 0}).sort('score', 1).limit(5))
    if request.args.get('json'):
        return jsonify(high_scores_pass=high_scores_pass, high_scores_fail=high_scores_fail)
    elif as_dict:
        pass_score_times = [score.pop('timestamp') for score in high_scores_pass]
        fail_score_times = [score.pop('timestamp') for score in high_scores_fail]
        return {'high_scores_pass':high_scores_pass, 'high_scores_fail':high_scores_fail}
    else:
        return render_template("highscore.html", high_scores_pass=high_scores_pass, high_scores_fail=high_scores_fail)


@APP.route('/sw.js')
def sw():
    response=make_response(
                     send_from_directory('static',filename='sw.js'))
    response.headers['Content-Type'] = 'application/javascript'
    return response

if __name__ == '__main__':
    SOCKETIO.run(APP, host="0.0.0.0", debug=True)
