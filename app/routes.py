import time

from app import app, helpers, users, responses, database
import flask
from app.apktool import store
import os
from werkzeug.utils import secure_filename

# Test route
@app.route('/test')
def test():
    return responses.success_response("Its works!")

# Clear all cache (dangerous!)
@app.route('/clear-app-cache')
def clear_cache():
    helpers.clear_all_cache()
    return responses.success_response("Cache discarded")

# <User routes>

# Register a new user or login with email or phone verification (password less)
@app.route('/user/signup', methods=["POST"])
def user_signup():
    data = flask.request.get_json(force=True)
    return users.signup(data)

# Validate email or phone and generate a new refresh token for user
@app.route('/user/validate/<string:type>', methods=["GET"])
def user_validate(type):
    return users.validate(type, flask.request.args)

# Obtain a new access token from refresh token
@app.route('/user/access_token', methods=["POST"])
def user_access_token():
    data = flask.request.get_json(force=True)
    return users.fresh_access_token(data)

# Update signed in user details
@app.route('/user/update', methods=["POST"])
@users.auth_check(0)
def user_update():
    data = flask.request.get_json(force=True)
    return users.update(data)

# Get signed in user details
@app.route('/user', methods=["GET"])
@users.auth_check(0)
def user_data():
    return users.data()

# </User routes>

# <Static Route>

@app.route('/', methods=["GET"])
def index():
    return flask.render_template("store/index.html")

# </Static Route>

# <APK Tool Route>
@app.route('/release', methods=["GET", "POST"])
def release_index():
    if flask.request.method == "POST":
        return store.upload_apk()
    else:
        return store.index()

@app.route('/release/<int:id>', methods=["GET", "POST"])
def release_detail(id):
    if flask.request.method == "GET":
        return store.view(id)
    else:
        return store.update(id)
# </APK Tool Route>

#<Error Handling>

@app.errorhandler(404)
def not_found(error):
    return responses.error_response("Not Found", 404)

@app.errorhandler(405)
def not_found(error):
    return responses.error_response("Method not allowed", 405)

# </Error handling>

@app.after_request
def set_response_headers(response):
    return responses.set_headers(response)


# !!! Very important to close database connection by ending session !!! #
@app.teardown_request
def remove_db_connection(exc):
    try:
        database.session.remove()
    except AttributeError:
        pass
