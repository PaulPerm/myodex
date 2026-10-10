from alembic import command
from alembic.config import Config
from seed import seed_if_empty


def pytest_sessionstart(session):
    """Runs before pytest collects any tests: create tables, then seed if empty."""
    command.upgrade(Config("alembic.ini"), "head")
    seed_if_empty()