from supabase import create_client, Client
from .settings import SUPABASE_URL, SUPABASE_SERVICE_KEY

def get_supabase_client() -> Client:
    """
    Create and return a Supabase client instance.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise ValueError("Missing Supabase environment variables")

    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Create a global instance of the Supabase client
supabase: Client = get_supabase_client()
