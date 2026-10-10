import pytest
from alembic import command
from alembic.config import Config
from seed import seed_if_empty


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Runs once before all tests: create tables, then seed if empty."""
    command.upgrade(Config("alembic.ini"), "head")
    seed_if_empty()