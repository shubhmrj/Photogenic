from main import db, app

with app.app_context():
    db.create_all()
    print("Database tables created/updated successfully!")
