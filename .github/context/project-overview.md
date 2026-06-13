# Project Overview

This repository contains a project management platform designed to improve productivity and activity visibility for remote and 
hybrid software development teams. The system’s stated objective is to increase team productivity and visibility by 20% through 
task automation, structured work tracking, and KPI reporting. The platform serves two main user groups: developers and managers. 
Developers interact primarily through Telegram to review and manage their personal work, while managers need broader visibility 
across the team, including progress, blockers, and estimated-versus-actual effort. 

The solution is composed of two delivery channels: a web portal and a Telegram chatbot service. The overall system follows a 
cloud-native approach and is intended to run on Oracle Cloud Infrastructure with Oracle Autonomous Database, Docker, Kubernetes, 
CI/CD pipelines, and infrastructure as code. The backend is planned around Java, Spring Boot, microservices, and REST-based 
integrations. For frontend work, this context matters only to understand the product and data flow; frontend changes should remain 
isolated from backend, infrastructure, and database implementation details. 

At the domain level, the core workflow revolves around users, teams, sprints, and work items. A work item may represent a feature, 
issue, or bug, and can include assignments, tags, links to other work items, comments, time entries, and activity logs. The data model 
also includes sprint baselines and KPI definitions/snapshots so the system can track productivity and reporting over time. This means 
the frontend should be designed around a project/work management experience rather than a generic dashboard shell. 

From a product perspective, the MVP focuses on work item management, sprint tracking, manager visibility, Telegram-based developer 
interaction, and basic KPI reporting. The frontend should therefore prioritize interfaces such as work item lists, sprint views, 
detail panels, assignments, comments, time tracking, and lightweight KPI summaries. The UI should be structured so mock services 
can be used first and later replaced by real backend integrations with minimal refactoring. 
