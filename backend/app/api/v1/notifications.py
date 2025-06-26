from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from uuid import UUID

from app.api.deps import get_current_user
from app.schemas.notifications import (
    Notification,
    NotificationListResponse,
)
from app.config.database import supabase

router = APIRouter()


@router.get("/", response_model=NotificationListResponse)
async def get_notifications(
    current_user: dict = Depends(get_current_user),
):
    """Get all notifications for the current user."""
    try:
        # Get notifications for the user
        response = supabase.table("notifications").select("*").eq("user_id", current_user["id"]).order("created_at", desc=True).limit(50).execute()
        
        notifications = response.data or []
        
        # Count unread notifications
        unread_count = sum(1 for n in notifications if not n.get("read", True))
        
        return NotificationListResponse(
            notifications=notifications,
            total=len(notifications),
            unread_count=unread_count
        )
    except Exception as e:
        # Return empty list if there's an error (table might not exist yet)
        return NotificationListResponse(
            notifications=[],
            total=0,
            unread_count=0
        )


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Mark a notification as read."""
    try:
        # Update notification read status
        response = supabase.table("notifications").update(
            {"read": True}
        ).eq("id", notification_id).eq("user_id", current_user["id"]).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.patch("/mark-all-read")
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user),
):
    """Mark all notifications as read for the current user."""
    try:
        # Update all unread notifications for the user
        response = supabase.table("notifications").update(
            {"read": True}
        ).eq("user_id", current_user["id"]).eq("read", False).execute()
        
        return {"success": True, "updated_count": len(response.data or [])}
    except Exception as e:
        return {"success": False, "error": str(e)}


# Helper function to create notifications (called from other services)
def create_notification(
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
    data: dict = None
) -> bool:
    """Create a new notification for a user."""
    try:
        notification_data = {
            "user_id": user_id,
            "type": notification_type,
            "title": title,
            "message": message,
            "data": data,
            "read": False
        }
        
        response = supabase.table("notifications").insert(notification_data).execute()
        return bool(response.data)
    except Exception as e:
        print(f"Failed to create notification: {e}")
        return False


def create_simulation_completion_notification(
    user_id: str,
    simulation_id: str,
    simulation_name: str,
    total_combinations: int,
    winning_combinations: int = 0,
    total_payout: float = 0
) -> bool:
    """Create a notification when a simulation completes successfully."""
    try:
        # Calculate win rate
        win_rate = (winning_combinations / total_combinations * 100) if total_combinations > 0 else 0
        
        # Create notification title and message
        title = f'Simulation "{simulation_name}" Completed'
        message = (f'Your simulation finished with {winning_combinations:,} winning combinations out of '
                  f'{total_combinations:,} total ({win_rate:.2f}%). '
                  f'Total winnings: KSh {total_payout:,.0f}')
        
        # Create the notification
        return create_notification(
            user_id=user_id,
            notification_type="simulation_completed",
            title=title,
            message=message,
            data={
                "simulation_id": simulation_id,
                "simulation_name": simulation_name,
                "total_combinations": total_combinations,
                "winning_combinations": winning_combinations,
                "win_rate": round(win_rate, 2),
                "total_payout": total_payout
            }
        )
    except Exception as e:
        print(f"Failed to create simulation completion notification: {e}")
        return False


def create_simulation_failure_notification(
    user_id: str,
    simulation_id: str,
    simulation_name: str,
    error_message: str = "Simulation failed to complete"
) -> bool:
    """Create a notification when a simulation fails."""
    try:
        title = f'Simulation "{simulation_name}" Failed'
        message = f'Your simulation encountered an error and could not be completed. {error_message}'
        
        return create_notification(
            user_id=user_id,
            notification_type="simulation_failed",
            title=title,
            message=message,
            data={
                "simulation_id": simulation_id,
                "simulation_name": simulation_name,
                "error_message": error_message
            }
        )
    except Exception as e:
        print(f"Failed to create simulation failure notification: {e}")
        return False 