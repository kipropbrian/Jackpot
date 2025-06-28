"""Email service using Resend for sending notifications."""
import logging
from typing import Dict, Any, Optional
import resend
from app.config.settings import RESEND_API_KEY, EMAIL_FROM, FRONTEND_URL
from app.config.database import supabase

logger = logging.getLogger(__name__)

# Initialize Resend client
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY
else:
    logger.warning("RESEND_API_KEY not configured - email notifications will be disabled")


class EmailService:
    """Service for sending email notifications using Resend."""
    
    @staticmethod
    def _get_user_email_preferences(user_id: str) -> Dict[str, Any]:
        """Get user email preferences from the database."""
        try:
            response = supabase.table("profiles").select(
                "email, email_notifications, full_name"
            ).eq("id", user_id).single().execute()
            
            if response.data:
                return response.data
            return {}
        except Exception as e:
            logger.error(f"Failed to get user email preferences for {user_id}: {e}")
            return {}
    
    @staticmethod
    def _create_simulation_completion_email_html(
        user_name: str,
        simulation_name: str,
        simulation_id: str,
        total_combinations: int,
        winning_combinations: int,
        win_rate: float,
        total_payout: float,
        best_match_count: int,
        actual_results: list
    ) -> str:
        """Create HTML email template for simulation completion."""
        
        # Create results link
        results_url = f"{FRONTEND_URL}/dashboard/simulations/{simulation_id}"
        
        # Format payout
        formatted_payout = f"KSh {total_payout:,.0f}" if total_payout > 0 else "KSh 0"
        
        # Create match summary
        if winning_combinations > 0:
            status_color = "#16a34a"  # green
            status_text = f"🎉 Congratulations! You had {winning_combinations:,} winning combination{'s' if winning_combinations != 1 else ''}!"
        else:
            status_color = "#dc2626"  # red
            status_text = f"No winning combinations this time, but your best match was {best_match_count} out of {len(actual_results)} games."
        
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Simulation Analysis Complete</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); overflow: hidden;">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); color: white; padding: 30px 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Analysis Complete!</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Your simulation results are ready</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 30px 20px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px;">Hi {user_name},</p>
                    
                    <p style="margin: 0 0 25px 0; font-size: 16px;">
                        Your simulation <strong>"{simulation_name}"</strong> has finished analyzing all combinations.
                    </p>
                    
                    <!-- Status Banner -->
                    <div style="background-color: {status_color}; color: white; padding: 15px; border-radius: 8px; margin: 25px 0; text-align: center; font-weight: 600;">
                        {status_text}
                    </div>
                    
                    <!-- Results Summary -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;">
                        <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">Results Summary</h3>
                        
                        <div style="display: grid; gap: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                <span style="font-weight: 500;">Total Combinations:</span>
                                <span style="font-weight: 600; color: #1f2937;">{total_combinations:,}</span>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                <span style="font-weight: 500;">Winning Combinations:</span>
                                <span style="font-weight: 600; color: #16a34a;">{winning_combinations:,}</span>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                <span style="font-weight: 500;">Win Rate:</span>
                                <span style="font-weight: 600; color: #1f2937;">{win_rate:.2f}%</span>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                <span style="font-weight: 500;">Total Winnings:</span>
                                <span style="font-weight: 600; color: #16a34a;">{formatted_payout}</span>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                                <span style="font-weight: 500;">Best Match:</span>
                                <span style="font-weight: 600; color: #1f2937;">{best_match_count}/{len(actual_results)} games</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Actual Results -->
                    <div style="background-color: #fefefe; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
                        <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">Actual Results</h3>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            {' '.join([f'<span style="background-color: #8b5cf6; color: white; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; font-weight: 600; font-size: 14px;">{result}</span>' for result in actual_results])}
                        </div>
                    </div>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{results_url}" 
                           style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                            View Detailed Results
                        </a>
                    </div>
                    
                    <p style="margin: 30px 0 0 0; font-size: 14px; color: #6b7280;">
                        Thanks for using Jackpot! Good luck with your next simulation.
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 12px; color: #6b7280;">
                        You received this email because you have email notifications enabled.<br>
                        <a href="{FRONTEND_URL}/dashboard/profile" style="color: #8b5cf6; text-decoration: none;">Manage your email preferences</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html_content
    
    @staticmethod
    def send_simulation_completion_email(
        user_id: str,
        simulation_id: str,
        simulation_name: str,
        total_combinations: int,
        winning_combinations: int,
        win_rate: float,
        total_payout: float,
        best_match_count: int,
        actual_results: list
    ) -> bool:
        """Send simulation completion email to user."""
        
        if not RESEND_API_KEY:
            logger.warning("RESEND_API_KEY not configured - skipping email notification")
            return False
        
        try:
            # Get user preferences and email
            user_prefs = EmailService._get_user_email_preferences(user_id)
            
            if not user_prefs:
                logger.warning(f"No user preferences found for user {user_id}")
                return False
            
            # Check if user has email notifications enabled
            if not user_prefs.get("email_notifications", False):
                logger.info(f"Email notifications disabled for user {user_id}")
                return True  # Not an error, user preference
            
            user_email = user_prefs.get("email")
            if not user_email:
                logger.warning(f"No email address found for user {user_id}")
                return False
            
            # Get user name (fallback to email if no name)
            user_name = user_prefs.get("full_name") or user_email.split("@")[0]
            
            # Create email content
            html_content = EmailService._create_simulation_completion_email_html(
                user_name=user_name,
                simulation_name=simulation_name,
                simulation_id=simulation_id,
                total_combinations=total_combinations,
                winning_combinations=winning_combinations,
                win_rate=win_rate,
                total_payout=total_payout,
                best_match_count=best_match_count,
                actual_results=actual_results
            )
            
            # Send email via Resend
            params = {
                "from": EMAIL_FROM,
                "to": [user_email],
                "subject": f"🎯 Analysis Complete: {simulation_name}",
                "html": html_content,
            }
            
            result = resend.Emails.send(params)
            
            if result and result.get("id"):
                logger.info(f"Successfully sent simulation completion email to {user_email} (ID: {result['id']})")
                return True
            else:
                logger.error(f"Failed to send email - no result ID returned")
                return False
                
        except Exception as e:
            logger.error(f"Failed to send simulation completion email to user {user_id}: {e}")
            return False 