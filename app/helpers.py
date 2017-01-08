import urllib2 as ulib
import urllib
import app
import os
from sqlalchemy import inspect

join_condition = lambda k1, k2, cond: "and_(" + k1 + "==" + k2 + ", " + cond + ")"
obj_json = lambda obj, keys: {camel_case(key): getattr(obj, key) for key in keys}

def camel_case(str):
    components = str.split('_')
    return components[0] + "".join(x.title() for x in components[1:])


def list_to_dict(arr):
    if type(arr) != list:
        return arr
    if len(arr) == 0:
        return {}
    if len(arr) == 1:
        return arr[0]
    if type(arr[0]) != dict:
        return arr
    result = {}
    for elem in arr:
        for key, val in elem.iteritems():
            if key in result:
                result[key] += [val]
            else:
                result[key] = [val]
    return dict([(k, list_to_dict(v)) for k, v in result.iteritems()])


def get_cache(key):
    if key in app.app_memory_cache:
        return app.app_memory_cache[key]
    else:
        return None


def set_cache(key, value):
    app.app_memory_cache[key] = value


def clear_all_cache():
    app.app_memory_cache = {}


def cache_model(cache_obj, model_obj, model_class):
    # None model object initialized for unit testing using caching objects
    if model_obj is None:
        return
    mapper = inspect(model_class)
    for column in mapper.attrs:
        col = column.key
        setattr(cache_obj, col, getattr(model_obj, col))

