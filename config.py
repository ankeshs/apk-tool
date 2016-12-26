# Statement for enabling the development environment
DEBUG = False

# Define the application directory
import os
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Define the database - we are working with
# SQLite for this example
HOST = '127.0.0.1'
PORT = 5002
PRESERVE_CONTEXT_ON_EXCEPTION = False
SQLALCHEMY_ENCRYPT_CREDENTIALS = False
SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://username:password@host:port/database'
DATABASE_CONNECT_OPTIONS = {}
SQLALCHEMY_TRACK_MODIFICATIONS = False
SQLALCHEMY_POOL_SIZE=5

#Multiple databases: http://flask-appbuilder.readthedocs.org/en/latest/multipledbs.html

# Application threads. A common general assumption is
# using 2 per available processor cores - to handle
# incoming requests using one and performing background
# operations using the other.
THREADS_PER_PAGE = 2

# Enable protection agains *Cross-site Request Forgery (CSRF)*
CSRF_ENABLED = True

# Use a secure, unique and absolutely secret key for
# signing the data.
CSRF_SESSION_KEY = "a612de0b07425c08"

# Secret key for signing cookies
SECRET_KEY = "a612de0b07425c08"

AJAX_API_BASE = "/apk-tool/"

STATIC_FILE_BASE = "/apk-tool/static/"

STATIC_FILE_VERSION = "1.0"
