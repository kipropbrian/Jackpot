from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel


class NotificationBase(BaseModel):
    type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    read: Optional[bool] = None


class Notification(NotificationBase):
    id: str
    user_id: str
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    notifications: list[Notification]
    total: int
    unread_count: int 