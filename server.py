from dependencies.bottle import *
import uuid
import database.database as database
import os
import hashlib
import sqlite3
import json

sessions = {}

app = app()

# Serve static files with explicit MIME types and detailed logging
@route('/static/<filename:path>')
def send_static(filename):
    print(f"Requesting static file: {filename}")
    file_path = os.path.join('./static', filename)
    mime_types = {
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.html': 'text/html'
    }
    ext = os.path.splitext(filename)[1].lower()
    mimetype = mime_types.get(ext, 'application/octet-stream')
    
    if os.path.exists(file_path):
        print(f"Serving file: {file_path} with MIME type: {mimetype}")
        return static_file(filename, root='./static/', mimetype=mimetype)
    else:
        print(f"File not found: {file_path}")
        return HTTPResponse(status=404, body=f"File not found: {filename}")

# Serve index.html from views folder at root
@route('/', method='GET')
def home():
    print("Serving index.html from views/")
    return static_file('index.html', root='./views/', mimetype='text/html')

@route('/register', method='GET')
def new_user():
    return template('register')

@route('/register', method='POST')
def process_new_user():
    new_username = request.forms.get('new_username')
    new_password = request.forms.get('new_password')
    database.new_user(new_username, new_password)
    redirect('/login')

@get('/login')
@view('login')
def _():
    return

@post('/login')
def post_login():
    login_user = request.forms.get('login_user')
    login_pw = request.forms.get('login_pw')
    users = database.user_dict()
    for user in users:
        if login_user == user["username"] and login_pw == user["password"]:
            user_session_id = str(uuid.uuid4())
            sessions[user_session_id] = user
            response.set_cookie("user_session_id", user_session_id) 
            redirect("/benutzerkonto")
        else:
            redirect("/login")
            return "<script>alert('E-Mail/Passwort falsch!');</script>" + template('login')
          
@route('/benutzerkonto')
def benutzerkonto():
    user_session_id = request.get_cookie("user_session_id")
    user = sessions.get(user_session_id)
    if user_session_id not in sessions:
        redirect("/login")
    user = sessions[user_session_id]
    return template("benutzerkonto", user=user)

@route('/api/teacher-listings', method='GET')
def get_teacher_listings():
    try:
        cur = database.db.execute('''
            SELECT s.schueler_name AS name_schueler, 
                   a.anzeige_id, a.fach, a.preis, a.klassenstufe, a.wochentage, a.kapazitaet, a.schueler_id
            FROM schueler s
            JOIN anzeige a ON s.schueler_id = a.schueler_id
        ''')
        teachers = [dict(row) for row in cur.fetchall()]
        if not teachers:
            print("No teacher listings found in database")
            return json.dumps([])
        print(f"Serving teacher listings: {len(teachers)} entries")
        return json.dumps(teachers)
    except Exception as e:
        print(f"Error in teacher listings: {str(e)}")
        return json.dumps({"error": str(e)})

import socket
def get_ip_address():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 80))
    return s.getsockname()[0]
print('Webserver erreichbar über IP-Adresse: ', get_ip_address())
app.run(host='0.0.0.0', port=1887, debug=True)