import os
import datetime
from pymongo import MongoClient
from flask import Flask, jsonify, render_template, request, session, redirect, make_response, url_for, send_from_directory
from flask_socketio import SocketIO
import dateutil.parser
from functools import wraps
from passlib.hash import sha256_crypt

APP = Flask(__name__)


MONGO_URL = os.environ.get('MONGO_URL')

CLIENT = MongoClient(MONGO_URL)
DB = CLIENT['prscores']
SCORES = DB['scores']
KEYS = DB['keys']
LOGINS = DB['logins']

APP = Flask(__name__)
SOCKETIO = SocketIO(APP)

APP.secret_key = os.environ.get('SECRET_KEY')

LETS_ENCRYPT_CHALLENGE = os.environ.get('LETS_ENCRYPT_CHALLENGE')
LETS_ENCRYPT_RESPONSE = os.environ.get('LETS_ENCRYPT_RESPONSE')


def login_required(f):
    @wraps(f)
    def login_check(*args, **kwargs):
        if not session.get('username'):
            return redirect(url_for('login', next=request.path))
        return f(*args, **kwargs)
    return login_check


@APP.route('/login', methods=['GET', 'POST'])
def login(username=""):
    if request.method == 'POST':
        username = request.form.get('username')
        user_info = LOGINS.find_one({'username': username}, {'password': 1})
        if user_info:
            hash = user_info.get('password')
            if (sha256_crypt.verify(request.form.get('password'), hash)):
                session.update({'username': username})
                return redirect(request.args.get('next') or url_for('index'))
    return render_template('login.html', username=username)

@APP.route('/')
def index():
    return render_template("index.html")

@APP.route('/entry', methods=["POST"])
def entry():
    new_entry = {'timestamp': datetime.datetime.utcnow()}
    new_entry.update({'username':request.get_json().get('username')})
    new_entry.update({'score' : request.get_json().get('score')})
    SCORES.insert_one(new_entry)
    SOCKETIO.emit('new-scores', live_scores(as_dict=True), namespace='/scores')
    return jsonify(entry={'success': True})

@APP.route('/late-entry', methods=["POST"])
def late_entry():
    new_entries = request.get_json()
    formatted_entries = [{'username': new_entries.get('username'), 'timestamp': dateutil.parser.parse(entry.get(
        'timestamp')), 'score': entry.get('score')} for entry in new_entries.get('scores')]
    SCORES.insert_many(formatted_entries)
    SOCKETIO.emit('new-scores', live_scores(as_dict=True), namespace='/scores')
    return jsonify(entry={'success': True})

@APP.route('/live-scores')
@login_required
def live_scores(as_dict=None):
    print(request)
    live_scores = list(SCORES.find(
        {}, {'_id': 0}))
    if request.args.get('json'):
        return jsonify(live_scores=live_scores)
    elif as_dict:
        score_timestamps = [score.pop('timestamp') for score in live_scores]
        return {'live-scores':live_scores}
    else:
        return render_template("livescore.html", live_scores=live_scores)


@APP.route('/sw.js')
def sw():
    response=make_response(
                     send_from_directory('static',filename='sw.js'))
    response.headers['Content-Type'] = 'application/javascript'
    return response

if __name__ == '__main__':
    SOCKETIO.run(APP, host="0.0.0.0", debug=True)
