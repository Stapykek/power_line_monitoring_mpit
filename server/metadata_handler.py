"""
This module handles the mapping between original filenames (from user's computer)
and server filenames for image processing sessions.
"""
import json
import os
from pathlib import Path
from typing import Dict, Optional

class MetadataHandler:
    def __init__(self, sessions_dir: str = "sessions"):
        self.sessions_dir = Path(sessions_dir)
    
    def save_filename_mapping(self, session_id: str, mapping: Dict[str, str]):
        """
        Save the mapping between original and server filenames for a session
        
        Args:
            session_id: The session ID
            mapping: Dictionary mapping original filenames to server filenames
        """
        session_path = self.sessions_dir / session_id
        metadata_path = session_path / "metadata.json"
        
        # Create session directory if it doesn't exist
        session_path.mkdir(exist_ok=True)
        
        # Load existing metadata if it exists
        existing_metadata = {}
        if metadata_path.exists():
            with open(metadata_path, 'r', encoding='utf-8') as f:
                existing_metadata = json.load(f)
        
        # Update the mapping
        existing_metadata['filename_mapping'] = mapping
        
        # Save the updated metadata
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(existing_metadata, f, ensure_ascii=False, indent=2)
    
    def get_filename_mapping(self, session_id: str) -> Optional[Dict[str, str]]:
        """
        Get the mapping between original and server filenames for a session
        
        Args:
            session_id: The session ID
            
        Returns:
            Dictionary mapping original filenames to server filenames, or None if not found
        """
        session_path = self.sessions_dir / session_id
        metadata_path = session_path / "metadata.json"
        
        if not metadata_path.exists():
            return None
        
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        return metadata.get('filename_mapping', {})
    
    def add_session_info(self, session_id: str, info: Dict):
        """
        Add additional session information to the metadata
        
        Args:
            session_id: The session ID
            info: Dictionary with additional session information
        """
        session_path = self.sessions_dir / session_id
        metadata_path = session_path / "metadata.json"
        
        # Create session directory if it doesn't exist
        session_path.mkdir(exist_ok=True)
        
        # Load existing metadata if it exists
        existing_metadata = {}
        if metadata_path.exists():
            with open(metadata_path, 'r', encoding='utf-8') as f:
                existing_metadata = json.load(f)
        
        # Update the metadata with new info
        existing_metadata.update(info)
        
        # Save the updated metadata
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(existing_metadata, f, ensure_ascii=False, indent=2)
>>>>>>> REPLACE