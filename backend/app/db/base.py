from sqlalchemy.orm import DeclarativeBase, declared_attr
from sqlalchemy import MetaData

# Naming convention ensures Alembic generates deterministic constraint names
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)

    # Automatically derive __tablename__ from class name (snake_case)
    @declared_attr.directive
    def __tablename__(cls) -> str:
        import re
        name = re.sub(r"(?<!^)(?=[A-Z])", "_", cls.__name__).lower()
        return name