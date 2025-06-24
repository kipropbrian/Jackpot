import sys
import logging
from pathlib import Path

def setup_logging():
    """
    Configure application-wide logging settings.
    Sets up both file and console logging handlers.
    """
    try:
        log_file = Path(__file__).parent.parent.parent / 'errors.log'
        
        # Ensure the log file exists and is writable
        log_file.touch(exist_ok=True)
        
        # Configure root logger
        root_logger = logging.getLogger()
        root_logger.setLevel(logging.ERROR)
        
        # File handler with detailed formatting
        file_handler = logging.FileHandler(log_file, mode='a')
        file_handler.setLevel(logging.ERROR)
        file_handler.setFormatter(
            logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        )
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.ERROR)
        console_handler.setFormatter(
            logging.Formatter('%(levelname)s: %(message)s')
        )
        
        # Remove any existing handlers to avoid duplicates
        root_logger.handlers.clear()
        
        # Add both handlers
        root_logger.addHandler(file_handler)
        root_logger.addHandler(console_handler)
        
        return root_logger
        
    except Exception as e:
        print(f"Failed to setup logging: {e}", file=sys.stderr)
        raise 