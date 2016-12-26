from app import app
from jinja2 import Environment, PackageLoader

def static_path(filepath, type):
    return app.config['STATIC_FILE_BASE'] + filepath + "?v=" + type + app.config['STATIC_FILE_VERSION']

app.jinja_env.filters['static_path'] = static_path
