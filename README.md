# Oracle PM Tool

A cloud-native project management tool built on Oracle Cloud Infrastructure. Teams can organize work into projects and sprints, track tasks on a Kanban board, log work hours, and monitor KPIs — all integrated with a Telegram bot for notifications and updates.

## Stack

- **Backend:** Spring Boot 3, Hibernate JPA, Oracle JDBC
- **Frontend:** React, React Query, Tailwind CSS
- **Database:** Oracle Autonomous Transaction Processing (ATP)
- **Infrastructure:** OKE (Kubernetes), OCIR (Container Registry), Terraform
- **Bot:** Telegram Bot API (long-polling)

## Features

- Project and sprint management
- Kanban board with task status tracking
- Work log per task
- KPI dashboard with developer stats per sprint
- Telegram bot integration for task updates

## Setup

For local development: [LOCAL_DEV_SETUP.md](LOCAL_DEV_SETUP.md)

For OCI cloud deployment: [OCI_DEPLOYMENT_TUTORIAL.md](OCI_DEPLOYMENT_TUTORIAL.md)
