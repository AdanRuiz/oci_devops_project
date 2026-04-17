# Copilot Instructions for `oci_devops_project`

## Build, test, and lint commands

Run commands from the repo root unless noted.

| Area | Purpose | Command |
| --- | --- | --- |
| Backend (Spring Boot + bundled frontend) | Full backend package (also runs frontend `npm install` + `npm run build` via Maven plugin) | `cd MtdrSpring\backend && mvn clean package spring-boot:repackage` |
| Backend | Run test suite | `cd MtdrSpring\backend && mvn test` |
| Backend | Run a single test class | `cd MtdrSpring\backend && mvn -Dtest=ClassName test` |
| Backend | Run a single test method | `cd MtdrSpring\backend && mvn -Dtest=ClassName#methodName test` |
| Frontend (Vite app under backend) | Local dev server | `cd MtdrSpring\backend\src\main\frontend && npm run dev` |
| Frontend | Production build | `cd MtdrSpring\backend\src\main\frontend && npm run build` |
| Lint | Status | No repo-wired lint command is configured in Maven or frontend scripts. `java_checks.xml` exists, but no active checkstyle plugin/script references it. |

## High-level architecture

- **Backend API:** Spring Boot app in `MtdrSpring\backend\src\main\java\com\springboot\MyTodoList` with standard controller -> service -> repository layers for `ToDoItem` and `User`.
- **Persistence mode switch:** Services support Oracle-backed JPA repositories *or* in-memory fallback. `app.nodb` and optional repository injection (`@Autowired(required=false)`) control this path.
- **Frontend packaging model:** The React/Vite app in `src\main\frontend` is built by `frontend-maven-plugin`, then copied into Spring static resources by `maven-resources-plugin` so the backend jar serves UI assets.
- **Current UI data source:** Frontend pages consume `src\app\data\mockData.ts` (no `fetch`/API calls yet), so UI behavior is currently decoupled from backend REST endpoints.
- **Additional integration surface:** A Telegram long-polling bot (`ToDoItemBotController` + `BotActions`) is wired into Spring and uses `ToDoItemService` plus `DeepSeekService`.
- **Runtime/deployment shape:** Oracle datasource settings are environment-driven (`db_url`, `db_user`, `dbpassword`, `driver_class_name`), and OCI/Kubernetes deployment uses `todolistapp-springboot.yaml` templated by shell scripts.

## Key conventions in this repository

- **Environment variable naming is part of runtime contract:** Backend DB wiring expects non-standard property names (`db_url`, `db_user`, `dbpassword`, `driver_class_name`) instead of typical `spring.datasource.*` env mappings.
- **Legacy REST route style is mixed and should be preserved unless intentionally refactoring:** examples include `/todolist`, `/adduser`, `updateUser/{id}`, and `deleteUser/{id}`.
- **Entity/model naming uses uppercase `ID` accessors:** `getID()` / `setID()` are used throughout services/controllers; keep consistency when adding model fields or DTO mapping.
- **Security is intentionally open by default:** `WebSecurityConfiguration` permits all requests and disables CSRF/basic/form login; do not assume authentication guards exist on endpoints.
- **Bot command flow is sequential action evaluation:** Telegram message handling in `ToDoItemBotController.consume` constructs `BotActions` and runs `fnStart`, `fnDone`, `fnUndo`, `fnDelete`, `fnHide`, `fnListAll`, `fnAddItem`, `fnLLM`, then `fnElse` in order.
