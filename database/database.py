import os
import sqlite3
import random

DB_FILE = "database.sqlite3"
DB_FILE_PATH = os.path.join(os.path.dirname(__file__), DB_FILE)

# tabellen erstellen

def create_db():
    with sqlite3.connect(DB_FILE_PATH) as db:
        db.execute('''CREATE TABLE IF NOT EXISTS schueler(
                    schueler_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL,
                    password TEXT NOT NULL,
                    schueler_name TEXT,
                    telefon TEXT,
                    email TEXT
                    )''')

        db.execute('''CREATE TABLE IF NOT EXISTS bewertung(
                    bewertungs_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sterne REAL NOT NULL,
                    schueler_id INTEGER NOT NULL,
                    FOREIGN KEY(schueler_id) REFERENCES schueler(schueler_id) ON DELETE CASCADE
                    )''')

        db.execute('''CREATE TABLE IF NOT EXISTS anzeige(
                    anzeige_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    fach TEXT NOT NULL,
                    preis REAL NOT NULL,
                    klassenstufe INTEGER NOT NULL,
                    wochentage TEXT NOT NULL,
                    kapazitaet INTEGER NOT NULL,
                    schueler_id INTEGER NOT NULL,
                    FOREIGN KEY(schueler_id) REFERENCES schueler(schueler_id) ON DELETE CASCADE
                    )''')

# tzestdaten einfügen

def fill_db():
    with sqlite3.connect(DB_FILE_PATH) as db:
        db.executemany('''INSERT INTO schueler(username, password, schueler_name, telefon, email)
                    VALUES (?, ?, ?, ?, ?)''', [
            ("MaxMustermann", "1234", "Max Mustermann", "0123456789", "max_mustermann@lmg-uetersen.de"),
            ("MariaMusterfrau", "1234", "Maria Musterfrau", "9876543210", "maria_musterfrau@lmg-uetersen.de")
        ])

        db.executemany('''INSERT INTO anzeige(fach, preis, klassenstufe, wochentage, kapazitaet, schueler_id)
                    VALUES (?, ?, ?, ?, ?, ?)''', [
            ("Mathe", 10.00, 10, "Mo, Mi, Fr", 5, 1),
            ("Deutsch", 10.00, 10, "Mo, Mi, Fr", 5, 2)
        ])

        db.executemany('''INSERT INTO bewertung(sterne, schueler_id)
                    VALUES (?, ?)''', [
            (5, 1),
            (4, 2)
        ])

# dicts erstellen

def user_dict():
    cur = db.execute("SELECT * FROM schueler")
    rows = cur.fetchall()
    print(rows)
    result = []
    for row in rows:
        user = {}
        for k in row.keys():
            user[k] = row[k]
        result.append(user)
    return result

def anzeigen_dict():
    cur = db.execute("SELECT * FROM anzeige")
    rows = cur.fetchall()
    print(rows)
    result = []
    for row in rows:
        anzeige = {}
        for k in row.keys():
            anzeige[k] = row[k]
        result.append(anzeige)
    return result

# neue schüler und anzeigen erstellen

def new_student(username, password, schueler_name, telefon, email):
    member = db.execute('''SELECT * FROM schueler WHERE username = ?''', (username,)).fetchall()
    if len(member) > 0:
        return "username existiert bereits"
    else:
        db.execute('''INSERT INTO schueler(username, password, schueler_name, telefon, email, bewertungs_id, stern_avg)
                      VALUES (?, ?, NULL, NULL, NULL, NULL, NULL)''', (username, password, schueler_name, telefon, email))
        db.commit()
        return "Erfolgreich"
    
def new_advertisement(fach, preis, klassenstufe, wochentage, bewertung, kapazitaet, schueler_id):
    db.execute('''INSERT INTO anzeige(fach, preis, klassenstufe, wochentage, bewertung, kapazitaet, schueler_id)
                  VALUES (?, ?, ?, ?, ?, ?, ?)''', (fach, preis, klassenstufe, wochentage, bewertung, kapazitaet, schueler_id))
    db.commit()
    return "Anzeige erfolgreich erstellt"

# datenbank erstellung falls nicht vorhanden und verknüpfung

if not os.path.isfile(DB_FILE_PATH):
    create_db()
    fill_db()

db = sqlite3.connect(DB_FILE_PATH)
db.row_factory = sqlite3.Row

# datenbank abfragen

def db_select(query, params):
    cur = db.execute(query, params)
    rows = cur.fetchall()
    print(rows)
    result = []
    for row in rows:
        d = {}
        result.append(dict(row))
        for k in row.keys():
            d[k] = row[k]
        result.append(d)
    return result

# session ids und so um angemeldet zu bleiben

db.execute('''CREATE TABLE IF NOT EXISTS sessions(
              session_id TEXT PRIMARY KEY,
              user_id INTEGER NOT NULL,
              FOREIGN KEY(user_id) REFERENCES schueler(schueler_id)
              )''')
db.commit()

def create_session(user_id):
    session_id = os.urandom(24).hex()
    db.execute('''INSERT INTO sessions(session_id, user_id) VALUES (?, ?)''', (session_id, user_id))
    db.commit()
    return session_id

def get_user_by_session(session_id):
    cur = db.execute('''SELECT schueler.* FROM schueler
                        JOIN sessions ON schueler.schueler_id = sessions.user_id
                        WHERE sessions.session_id = ?''', (session_id,))
    user = cur.fetchone()
    if user:
        return dict(user)
    return None

def check_password(username, password):
    cur = db.execute('''SELECT * FROM schueler WHERE username = ? AND password = ?''', (username, password))
    user = cur.fetchone()
    if user:
        return True
    return False

# abmeldung

def logout(session_id):
    db.execute('''DELETE FROM sessions WHERE session_id = ?''', (session_id,))
    db.commit()
    return True