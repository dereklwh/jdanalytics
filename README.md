# [jdanalytics](https://jdanalytics.vercel.app/)

## Tech Stack
- **Frontend:** React + Vite
- **Backend:** Java Spring Boot
- **Analytics and Data:** Python
- **Database:** Supabase (Postgres)

## Database Schema
High level schema of relational database in PostgreSQL.
Key Design Principles:
- Players and teams are stored once, with seasonal/game stats in separate tables
- Follow 3NF by to reduce data redundancy
![image](./assets/fantasy_erd.png)