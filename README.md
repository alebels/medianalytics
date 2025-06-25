![alt text](./Front/public/assets/full-logo.png)

Medianalytics is an open-source platform that processes 5 main articles daily from each registered source and provides users with tools to view this information from a broader perspective through comprehensive data visualization and analysis.

## Contributing

**You are completely welcome to contribute to this project!** Whether by adding new features, improving existing ones, fixing bugs, or enhancing documentation - all contributions are valued.

Please check the [issues](https://github.com/alebels/medianalytics/issues) page for current tasks or create a new issue to discuss your ideas.

## Prerequisites

This project uses Docker to run the application. Make sure you have Docker installed on your machine.
You can download it from [Docker](https://www.docker.com/get-started).

## Arquitecture schema
![alt text](./Front/public/assets/arquitecture-schema.png)

## Setup Instructions

1. **On `db/` folder create a `password.txt` file with your db password:**
   ```
   your_password
   ```

2. **Create a `.env` file in the root directory of `Back-data/` and `Back-api/`:**
   ```sh
   DATABASE_URL=postgresql+asyncpg://dockeruser:your_password@db:5432/medianalytics
   ```

### Back-ai

3. **Get an AI API key**

   - Recommended: [Google AI](https://ai.google.dev/) (free tier available with gemma-3-27b-it)

4. **Configure Environment**
   - Create a `.env` file in the root directory of `Back-ai/`:
     ```sh
     API_KEY=your_api_key
     ```


On `root` folder medianalytics:

5. **Launch Application**
   ```sh
   docker compose up
   ```

### Back-data

6. **Database Migration Setup**
In the back-data container terminal exec:

   ```sh
   alembic init alembic
   ```

7. **Configure Alembic**

   In the `Back-data/` directory:

   Edit `alembic.ini` to set the database URL:
   ```ini
   sqlalchemy.url = postgresql+asyncpg://dockeruser:your_password@db:5432/medianalytics
   ```

   Update `env.py` in the `alembic` directory to import your models:
   ```python
   from models import Base  # Adjust the import based on your project structure
   target_metadata = Base.metadata
   ```

In the back-data container terminal exec:

8. **Generate Migration Script**

   ```sh
   alembic revision --autogenerate -m "Initial migration"
   ```

9. **Apply Migration**

   ```sh
   alembic upgrade head
   ```

10. **Initialize Database**
      ```sh
      python3 init_db.py
      ```


> **Note:** Keep the containers running so scheduled jobs can execute at the times specified in `Back-data/main.py`.

> **Note:** Also you can run the front localy without the container by setup it as an angular project v19.0.6
