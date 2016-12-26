import hashlib
import random
import string
from flask import json, request
import flask

json = lambda x: flask.jsonify(**x)
error_response = lambda msg, code: (json({"code": code, "error": msg}), code)
success_response = lambda msg: (json({"code": 200, "message": msg}), 200)
success_json = lambda body: (json({"code": 200, "body": body}), 200)
str_random = lambda length: ''.join([random.choice(string.ascii_letters + string.digits) for n in xrange(length)])

def signed_success_json(body):
    payload = flask.json.dumps(body) + "|" + request.access_token
    response = json({
        "code": 200,
        "body": body,
    })
    response.headers["X-Auth-Token-Signed"] = request.access_token + "." + hashlib.sha256(payload).hexdigest()
    return response


make_recommendation_response = lambda body, status: json({
    "header": {"status": status},
    "body": body
})

def set_headers(response):
    response.headers["X-api-version"] = "1.0.0"
    response.headers["X-language-pref"] = "en"
    return response