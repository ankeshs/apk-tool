from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import vendor.email
import pyaes

app = Flask(__name__)
app.config.from_object('config')
try:
    app.config.from_pyfile('../.env')
except BaseException as e:
    print e.message

if app.config['SQLALCHEMY_ENCRYPT_CREDENTIALS']:
    aes = pyaes.AESModeOfOperationCTR(app.config['SECRET_KEY'])
    app.config['SQLALCHEMY_DATABASE_URI'] = aes.decrypt(app.config['SQLALCHEMY_DATABASE_URI'].decode('base64'))
    for key in app.config['SQLALCHEMY_BINDS']:
        aes = pyaes.AESModeOfOperationCTR(app.config['SECRET_KEY'])
        app.config['SQLALCHEMY_BINDS'][key] = aes.decrypt(app.config['SQLALCHEMY_BINDS'][key].decode('base64'))

database = SQLAlchemy(app)

app_memory_cache = {}

from app import boilerplate

from app import routes
