"""add_unit_to_session_items

Revision ID: c3f1a2b45d67
Revises: ae98fb8da757
Create Date: 2026-04-09 20:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c3f1a2b45d67"
down_revision: Union[str, Sequence[str], None] = "ae98fb8da757"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE TYPE itemunit AS ENUM ('malas', 'count')")
    op.add_column(
        "session_items",
        sa.Column(
            "unit",
            sa.Enum("malas", "count", name="itemunit"),
            nullable=False,
            server_default="malas",
        ),
    )


def downgrade() -> None:
    op.drop_column("session_items", "unit")
    op.execute("DROP TYPE itemunit")
