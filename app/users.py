from functools import wraps
import hashlib
import datetime
import random

from app import app, helpers, database
import responses
from flask import request
from sqlalchemy import MetaData

from app.datatools import get_data
from app.helpers import cache_model

_access_token_cache = {}
metadata = MetaData(bind=database.engine)

class UserAuth(database.Model):
    __table__ = database.Table('user_auth', metadata, autoload=True)


class UserCache:
    def __init__(self, user):
        cache_model(self, user, UserAuth)


def _email_verification(user):
    suffix = "|" + str(datetime.datetime.now()) + "|" + app.config["SECRET_KEY"]
    user.email_token = hashlib.sha256(user.email + suffix).hexdigest()
    user.email_otp = responses.str_random(64)
    user.email_token_expiry = datetime.datetime.now() + datetime.timedelta(minutes=30)
    return {
        "url": "user/validate/email",
        "email": user.email,
        "email_token": user.email_token,
        "expires": user.email_token_expiry
    }


def _phone_verification(user):
    suffix = "|" + str(datetime.datetime.now()) + "|" + app.config["SECRET_KEY"]
    user.phone_token = hashlib.sha256(user.phone + suffix).hexdigest()
    user.phone_otp = str(random.randint(100000, 999999))
    user.phone_token_expiry = datetime.datetime.now() + datetime.timedelta(minutes=5)
    return {
        "url": "user/validate/phone",
        "email": user.phone,
        "phone_token": user.phone_token,
        "expires": user.phone_token_expiry
    }


def signup(data):
    user = None
    email_verify = {}
    phone_verify = {}
    is_new_user = False
    if "email" in data:
        user = UserAuth.query.filter_by(email=data["email"]).first()
        if user is None:
            user = UserAuth()
            user.email = data["email"]
            user.flag = 0
            database.session.add(user)
            is_new_user = True
        else:
            if user.flag < 0:
                return responses.error_response("Access revoked", 401)
        email_verify = _email_verification(user)
    if "phone" in data:
        if user is None:
            user = UserAuth.query.filter_by(phone=data["phone"]).first()
        else:
            if is_new_user:
                user.phone = data["phone"]
            elif user.phone is None or user.phone != data["phone"]:
                return responses.error_response("Invalid parameters", 400)
        if user is None:
            user = UserAuth()
            user.phone = data["phone"]
            user.flag = 0
            database.session.add(user)
            is_new_user = True
        else:
            if user.flag < 0:
                return responses.error_response("Access revoked", 401)
        phone_verify = _phone_verification(user)
    if user is not None:
        database.session.commit()
        return responses.success_json({
            "created": is_new_user,
            "email_verify": email_verify,
            "phone_verify": phone_verify
        })
    else:
        responses.error_response("Not found", 404)


def validate(type, args):
    user = None
    flag = False
    if type == "email":
        user = UserAuth.query.filter_by(email_token=args["email_token"], email_otp=args["email_otp"]).first()
        if user is not None:
            if user.email_token_expiry is not None and datetime.datetime.now() < user.email_token_expiry:
                flag = True
                user.email_verified = 1
                user.email_token = None
                user.email_otp = None
                user.email_token_expiry = None
            else:
                return responses.error_response("Token expired", 401)
    if type == "phone":
        user = UserAuth.query.filter_by(phone_token=args["phone_token"], phone_otp=args["phone_otp"]).first()
        if user is not None:
            if user.phone_token_expiry is not None and datetime.datetime.now() < user.phone_token_expiry:
                flag = True
                user.phone_verified = 1
                user.phone_token = None
                user.phone_otp = None
                user.phone_token_expiry = None
            else:
                return responses.error_response("Token expired", 401)
    if flag and user.flag >= 0:
        user.flag = 1
        user.refresh_token = hashlib.sha256(str(user.id) + "|" + str(datetime.datetime.now()) + "|" + app.config["SECRET_KEY"])\
            .hexdigest()
        database.session.commit()
        tokens = _user_access_token(user)
        tokens["refresh_token"] = user.refresh_token
        return responses.success_json(tokens)
    else:
        return responses.error_response("Invalid request", 400)


def _user_access_token(user):
    token = hashlib.sha256(str(user.refresh_token) + "|" + str(datetime.datetime.now()) + "|" + app.config["SECRET_KEY"]).hexdigest()
    expiry_duration = 60
    expiry = datetime.datetime.now() + datetime.timedelta(minutes=expiry_duration)
    _access_token_cache[token] = {
        "id": user.id,
        "expiry": expiry,
        "level": user.level
    }
    return {
        "access_token": token,
        "expiry": expiry_duration * 60 * 1000
    }


def fresh_access_token(data):
    if "refresh_token" not in data:
        return responses.error_response("Invalid request", 400)
    user = None
    if "email" in data:
        user = UserAuth.query.filter_by(refresh_token=data["refresh_token"], email=data["email"], flag=1).first()
    elif "phone" in data:
        user = UserAuth.query.filter_by(refresh_token=data["refresh_token"], phone=data["phone"], flag=1).first()
    if user is None:
        return responses.error_response("Refresh token not valid", 404)
    return responses.success_json(_user_access_token(user))


def current_user():
    if hasattr(request, 'access_token'):
        if not hasattr(request, 'current_user') and request.access_token in _access_token_cache:
            token_data = _access_token_cache[request.access_token]
            request.current_user = UserAuth.query.filter_by(id=token_data['id'], flag=1).first()
            return request.current_user
    return None


def update(data):
    user = current_user()
    response = {}
    if user is None:
        return responses.error_response("Update failed", 400)
    if "name" in data:
        user.name = data["name"]
    if "email" in data and user.email != data["email"]:
        user.email = data["email"]
        user.email_verified = 0
        if data["email"] is not None:
            response['email_verify'] = _email_verification(user)
    if "phone" in data and user.phone != data["phone"]:
        user.phone = data["phone"]
        user.phone_verified = 0
        if data["phone"] is not None:
            response['phone_verify'] = _phone_verification(user)
    if user.email is None and user.phone is None:
        return responses.error_response("Invalid update data", 400)
    database.session.commit()
    return responses.signed_success_json(response)


def data():
    user = current_user()
    return responses.signed_success_json({
        "email": user.email,
        "phone": user.phone,
        "name": user.name
    })


def _validate_access_token(access_token, level):
    if access_token is not None and access_token in _access_token_cache:
        token_data = _access_token_cache[access_token]
        if datetime.datetime.now() < token_data['expiry'] and token_data['level'] >= level:
            request.access_token = access_token
            return True
    return False


def _validate_token(level):
    # In debug environment allow auth with a master key without checking access token or signature
    if app.debug:
        master_key = request.headers.get("X-Auth-Master-Key")
        if master_key is not None and master_key == app.config["MASTER_KEY"]:
            request.access_token = request.headers.get("X-Auth-Token")
            return True

    if request.method == "GET":
        # For GET requests, unsigned access token is used to establish user identity
        token = request.headers.get("X-Auth-Token")
        return _validate_access_token(token, level)
    else:
        # For POST, PUT, PATCH requests, signed access token is used
        # The token has two parts: access token and signature. Signature is used to prevent tampering of request data
        # Request payload received from client is serialized as is
        token = request.headers.get("X-Auth-Token-Signed")
        if token is None:
            return False
        [access_token, signature] = token.split(".")
        payload = str(request.data) + "|" + access_token
        checksum = hashlib.sha256(payload).hexdigest()
        return _validate_access_token(access_token, level) and checksum == signature


def auth_check(level=0):
    def outer(func):
        @wraps(func)
        def decorated_function(*args, **kwargs):
            if not _validate_token(level):
                return responses.error_response("Authorization failed", 403)
            return func(*args, **kwargs)
        return decorated_function
    return outer


def get_users(cache=True):
    return get_data(
        query=lambda: UserAuth.query.filter_by(flag=1).all(),
        cache_class=UserCache,
        key="get_users",
        aggregator=lambda obj: obj.id,
        cache=cache
    )