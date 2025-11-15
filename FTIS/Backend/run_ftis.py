#!/usr/bin/env python3
"""
FTIS - Fever Triage Intelligence System
Complete startup script with database initialization
"""

import os
import sys
import subprocess
import time

def run_command(command, check=True):
    """Run a shell command and handle errors"""
    print(f"🚀 Running: {command}")
    try:
        result = subprocess.run(command, shell=True, check=check, capture_output=True, text=True)
        return result
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running command: {e}")
        if check:
            sys.exit(1)
        return None

def main():
    print("🏥 FTIS - Fever Triage Intelligence System")
    print("=" * 50)
    
    # Check if we're in the backend directory
    if not os.path.exists('requirements.txt'):
        print("❌ Please run this script from the backend directory")
        sys.exit(1)
    
    # Step 1: Install dependencies
    print("\n📦 Step 1: Installing Python dependencies...")
    run_command("pip install -r requirements.txt")
    
    # Step 2: Create models directory if it doesn't exist
    print("\n🤖 Step 2: Setting up ML model...")
    os.makedirs('models', exist_ok=True)
    
    # Step 3: Train model if it doesn't exist
    if not os.path.exists('models/ftis_model.joblib'):
        print("Training ML model...")
        run_command("python model_training.py")
    else:
        print("✅ Model already exists, skipping training")
    
    # Step 4: Initialize database and start server
    print("\n🗄️ Step 3: Initializing database...")
    print("🌐 Step 4: Starting FTIS server...")
    
    # Import and run the app
    try:
        from app import app, init_db, load_model
        
        print("Initializing database...")
        init_db()
        
        print("Loading ML model...")
        load_model()
        
        print("\n✅ FTIS is ready!")
        print("📊 Patient Triage: http://localhost:5000 (opens automatically)")
        print("👨‍⚕️ Doctor Dashboard: http://localhost:5000/static/doctor_dashboard.html")
        print("🖥️ Clinician View: http://localhost:5000/static/clinician.html")
        print("\nPress Ctrl+C to stop the server")
        
        # Start the Flask development server
        app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
        
    except KeyboardInterrupt:
        print("\n👋 FTIS server stopped")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()