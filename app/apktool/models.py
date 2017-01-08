from app import database
from app.helpers import join_condition
from sqlalchemy import MetaData
from sqlalchemy.orm import relationship

metadata = MetaData(bind=database.engine)

class Release(database.Model):
    __table__ = database.Table('releases', metadata, autoload=True)
