import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.database import Base, get_db
from app.main import app

TEST_DB_URL = "postgresql://sadhana:sadhana@localhost:5432/sadhana_test"


@pytest.fixture(scope="session")
def engine():
    eng = create_engine(TEST_DB_URL)
    Base.metadata.create_all(eng)
    yield eng
    Base.metadata.drop_all(eng)
    eng.dispose()


@pytest.fixture(autouse=True)
def clean_tables(engine):
    """Truncate all tables before each test."""
    with Session(engine) as session:
        session.execute(text("TRUNCATE sessions, goals RESTART IDENTITY CASCADE"))
        session.commit()


@pytest.fixture
def client(engine):
    def override_get_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
