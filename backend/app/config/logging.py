import sys
import logging
import os
from pathlib import Path

def setup_logging():
    """
    Configure application-wide logging settings.
    Sets up both file and console logging handlers.
    Uses different log levels based on environment.
    """
    try:
        log_file = Path(__file__).parent.parent.parent / 'errors.log'
        
        # Ensure the log file exists and is writable
        log_file.touch(exist_ok=True)
        
        # Determine log level based on environment
        env = os.getenv("ENVIRONMENT", "development").lower()
        if env == "production":
            log_level = logging.ERROR
            console_level = logging.ERROR
        else:
            # Development/staging - show more logs
            log_level = logging.INFO
            console_level = logging.INFO
        
        # Configure root logger
        root_logger = logging.getLogger()
        root_logger.setLevel(log_level)
        
        # File handler with detailed formatting (always ERROR+ for file)
        file_handler = logging.FileHandler(log_file, mode='a')
        file_handler.setLevel(logging.ERROR)
        file_handler.setFormatter(
            logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        )
        
        # Console handler (level depends on environment)
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(console_level)
        console_handler.setFormatter(
            logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        )
        
        # Remove any existing handlers to avoid duplicates
        root_logger.handlers.clear()
        
        # Add both handlers
        root_logger.addHandler(file_handler)
        root_logger.addHandler(console_handler)
        
        # Log the current configuration
        root_logger.info(f"Logging configured for {env} environment (level: {logging.getLevelName(log_level)})")
        
        return root_logger
        
    except Exception as e:
        print(f"Failed to setup logging: {e}", file=sys.stderr)
        raise 