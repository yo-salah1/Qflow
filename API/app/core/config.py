from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application configuration settings."""
    
    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_KEY: str
    
    # Wikipedia API Configuration
    WIKIPEDIA_API_URL: str = "https://en.wikipedia.org/w/api.php"
    
    # Crawler Configuration
    CRAWL_BATCH_SIZE: int = 50
    MAX_DOCUMENTS: int = 3000
    
    # Search Configuration
    DEFAULT_SEARCH_LIMIT: int = 10
    MAX_SEARCH_LIMIT: int = 100
    SNIPPET_LENGTH: int = 200
    
    # Cache Configuration
    ENABLE_CACHE: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
