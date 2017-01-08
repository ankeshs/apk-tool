import hashlib
import json
import os
import re
import datetime
import subprocess

import flask
from werkzeug.utils import secure_filename

from app import app, database
from app import helpers
from app import responses
import models
from app import users

patterns = {
    'KV_LINE': re.compile("^(\\s*)(?P<key>(?:(\\w|\\-|\\_)+))(\\s*)(:)(\\s*)(?P<val>(.*))$"),
    'WORD': re.compile("^(\\s*)(?P<key>(?:(\\w|\\-|\\_)+))(\\s*)$"),
    'EQ_PAIR': re.compile("(?P<key>((\\w|\\-|\\_)+))(\\s*)(\\=)(\\s*)(\\'(?P<val>(.*?))\\')(\\s*)"),
    'ARRAY': re.compile("(\\s*)\\'(?P<val>(.*?))\\'(\\s*)")
}

def badging_to_dict(line):
    kv_match = patterns['KV_LINE'].match(line)
    if kv_match is None:
        word_match = patterns['WORD'].match(line)
        return { word_match.group("key"): 1 }
    key = kv_match.group("key")
    val = kv_match.group("val")
    eq_matches = list(patterns['EQ_PAIR'].finditer(val))
    if len(eq_matches) == 0:
        arr_matches = list(patterns['ARRAY'].finditer(val))
        if len(arr_matches) == 0:
            return { key: val }
        if len(arr_matches) == 1:
            return { key: arr_matches[0].group("val") }
        return { key: [a.group("val") for a in arr_matches] }
    return { key: dict([(a.group("key"), a.group("val")) for a in eq_matches])}


def badging_data(path, filename):
    data = []
    with open(os.path.join(os.path.join(app.config['UPLOAD_FOLDER'], path, filename + ".badge")), "r") as f:
        lines = f.readlines()
        data = map(badging_to_dict, lines)
    return helpers.list_to_dict(data)


def upload_apk():
    has_file = False
    if 'file' in flask.request.files:
        file = flask.request.files['file']
        if file.filename != '' and file is not None:
            filename = os.path.splitext(secure_filename(file.filename))[0]
            md5 = hashlib.md5()
            md5.update(filename + "/" + str(datetime.datetime.now()))
            path = md5.hexdigest()
            release = models.Release()
            release.user_id = 1
            release.filename = filename
            release.path = path
            os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], path))
            disk_file_path = os.path.join(app.config['UPLOAD_FOLDER'], path, filename + ".apk")
            file.save(disk_file_path)
            release.size = os.path.getsize(disk_file_path)
            cmd = os.path.join(app.config['SCRIPT_PATH'], 'stage1.sh') + ' "' + os.path.join(
                app.config['UPLOAD_FOLDER'], path) + '" "' + filename + '"'
            process = subprocess.Popen(cmd, shell=True)
            status = process.wait()
            print status
            badge = badging_data(path, filename)
            release.package_id = badge['package']['name']
            if 'label' in badge['application']:
                release.launcher_name = badge['application']['label']
            if 'icon' in badge['application']:
                release.launcher_icon = os.path.join(filename, badge['application']['icon'])
            if 'versionName' in badge['package']:
                release.version = badge['package']['versionName']
            if 'versionCode' in badge['package']:
                release.version_code = int(badge['package']['versionCode'])
            if 'sdkVersion' in badge:
                release.min_sdk_version = int(badge['sdkVersion'])
            if 'targetSdkVersion' in badge:
                release.target_sdk_version = int(badge['targetSdkVersion'])
            release.badging_json = json.dumps(badge)
            database.session.add(release)
            database.session.commit()
            has_file = True
    if has_file:
        return responses.success_json({"status": "processing"})
    else:
        return responses.error_response("Not Found", 404)


def response_item(obj, keys):
    item = helpers.obj_json(obj, keys)
    if 'launcherIcon' in item:
        item['launcherIcon'] = app.config['STATIC_FILE_BASE'] + "uploads/" + obj.path + "/" + obj.launcher_icon
    if 'filename' in item:
        item['filename'] = item['filename'] + ".apk"
        item['filepath'] = app.config['STATIC_FILE_BASE'] + "uploads/" + obj.path + "/" + obj.filename + ".apk"
    if 'badgingJson' in item:
        item['badgingJson'] = json.loads(obj.badging_json)
    item['user'] = helpers.obj_json(users.get_users()[obj.user_id], ['id', 'name', 'email', 'phone'])
    return item


def index():
    return flask.jsonify({'items': map(lambda r: response_item(r, [
        'id', 'filename', 'path', 'package_id', 'launcher_name', 'launcher_icon', 'version', 'version_code', 'created_tx_stamp'
    ]), models.Release.query.all())})


def view(id):
    keys = [
        'id', 'filename', 'path', 'package_id', 'launcher_name', 'launcher_icon', 'version',
        'version_code', 'created_tx_stamp', 'last_updated_tx_stamp', 'release_notes', 'min_sdk_version',
        'target_sdk_version', 'status', 'file_status', 'badging_json'
    ]
    return flask.jsonify(response_item(models.Release.query.get(id), keys))


def delete_files(release):
    cmd = 'rm -rf "' + os.path.join(app.config['UPLOAD_FOLDER'], release.path) + '"'
    process = subprocess.Popen(cmd, shell=True)
    status = process.wait()
    print status


def update(id):
    release = models.Release.query.get(id)
    data = flask.request.get_json(force=True)
    if "releaseNotes" in data:
        release.release_notes = data['releaseNotes']
    if "status" in data:
        release.status = data["status"]
        if release.status == "DELETED":
            delete_files(release)
    database.session.commit()
    return responses.success_response("Update processed")


