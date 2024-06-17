"""create extension

Revision ID: 3b07894533a6
Revises: 
Create Date: 2024-06-12 21:49:52.054363

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "3b07894533a6"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("create extension pg_rational;")


def downgrade() -> None:
    op.execute("drop extension pg_rational;")
