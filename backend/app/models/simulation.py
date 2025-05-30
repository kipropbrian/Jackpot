from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class Simulation:
    """
    Simulation model representing a user's jackpot simulation.
    """
    def __init__(
        self,
        id: UUID,
        user_id: UUID,
        name: str,
        total_combinations: int,
        cost_per_bet: Decimal,
        total_cost: Decimal,
        status: str = "pending",
        progress: int = 0,
        created_at: datetime = None,
        completed_at: Optional[datetime] = None,
        results: Optional[Dict[str, Any]] = None
    ):
        self.id = id
        self.user_id = user_id
        self.name = name
        self.total_combinations = total_combinations
        self.cost_per_bet = cost_per_bet
        self.total_cost = total_cost
        self.status = status
        self.progress = progress
        self.created_at = created_at or datetime.now()
        self.completed_at = completed_at
        self.results = results

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Simulation':
        """
        Create a Simulation instance from a dictionary.
        """
        return cls(
            id=data.get('id'),
            user_id=data.get('user_id'),
            name=data.get('name'),
            total_combinations=data.get('total_combinations'),
            cost_per_bet=data.get('cost_per_bet'),
            total_cost=data.get('total_cost'),
            status=data.get('status', 'pending'),
            progress=data.get('progress', 0),
            created_at=data.get('created_at'),
            completed_at=data.get('completed_at'),
            results=data.get('results')
        )

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the Simulation instance to a dictionary.
        """
        return {
            'id': str(self.id) if self.id else None,
            'user_id': str(self.user_id) if self.user_id else None,
            'name': self.name,
            'total_combinations': self.total_combinations,
            'cost_per_bet': float(self.cost_per_bet) if self.cost_per_bet else None,
            'total_cost': float(self.total_cost) if self.total_cost else None,
            'status': self.status,
            'progress': self.progress,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'results': self.results
        }
