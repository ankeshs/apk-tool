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

