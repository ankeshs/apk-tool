#!flask/bin/python

from app import app
host = app.config['HOST']
port = app.config['PORT']
debug = app.config['DEBUG']
app.run(host=host, port=port, debug=debug)
