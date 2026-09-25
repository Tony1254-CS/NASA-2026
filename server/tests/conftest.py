from sqlalchemy.ext.compiler import compiles
from geoalchemy2 import Geometry
import geoalchemy2.admin

# Mock GeoAlchemy2 DDL admin for SQLite test engine
class DummyDialectAdmin:
    @staticmethod
    def before_create(table, bind, **kw):
        pass

    @staticmethod
    def after_create(table, bind, **kw):
        pass

    @staticmethod
    def before_drop(table, bind, **kw):
        pass

    @staticmethod
    def after_drop(table, bind, **kw):
        pass


geoalchemy2.admin.select_dialect = lambda dialect_name: DummyDialectAdmin


# Compile Geometry as TEXT for SQLite test engine
@compiles(Geometry, "sqlite")
def compile_geometry_sqlite(element, compiler, **kw):
    return "TEXT"
