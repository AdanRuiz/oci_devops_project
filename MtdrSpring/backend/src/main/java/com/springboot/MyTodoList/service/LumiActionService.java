package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.controller.dto.TeamWithUsersResponse;
import com.springboot.MyTodoList.controller.dto.UserSummaryResponse;
import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.Team;
import com.springboot.MyTodoList.model.TeamMember;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.model.enums.TaskStatus;
import com.springboot.MyTodoList.repository.TeamMemberRepository;
import com.springboot.MyTodoList.repository.UserRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

@Service
public class LumiActionService {

    private static final Pattern MANAGER_PATTERN = Pattern.compile(
        "(?:managed by|manager)\\s+([^,;]+?)(?:\\s+and\\s+|\\s+with\\s+|,|;|$)",
        Pattern.CASE_INSENSITIVE
    );

    private final UserService userService;
    private final TeamService teamService;
    private final TeamMemberService teamMemberService;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final SprintService sprintService;
    private final TaskService taskService;

    public LumiActionService(UserService userService,
                             TeamService teamService,
                             TeamMemberService teamMemberService,
                             TeamMemberRepository teamMemberRepository,
                             UserRepository userRepository,
                             SprintService sprintService,
                             TaskService taskService) {
        this.userService = userService;
        this.teamService = teamService;
        this.teamMemberService = teamMemberService;
        this.teamMemberRepository = teamMemberRepository;
        this.userRepository = userRepository;
        this.sprintService = sprintService;
        this.taskService = taskService;
    }

    public Optional<String> tryHandle(String message) {
        if (message == null || message.isBlank()) {
            return Optional.empty();
        }

        String lower = normalize(message);

        if (matchesTeamIntent(lower)) {
            return Optional.of(handleCreateTeam(message));
        }
        if (matchesProjectIntent(lower)) {
            return Optional.of(handleCreateProject(message));
        }
        if (matchesSprintIntent(lower)) {
            return Optional.of(handleCreateSprint(message));
        }
        if (matchesWorkloadIntent(lower)) {
            return Optional.of(handleWorkload());
        }

        return Optional.empty();
    }

    public Optional<String> executePlan(LumiActionPlan plan) {
        if (plan == null || !plan.isExecutable()) {
            return Optional.empty();
        }

        return switch (plan.getAction()) {
            case CREATE_TEAM -> Optional.of(executeCreateTeam(plan));
            case CREATE_PROJECT -> Optional.of(executeCreateProject(plan));
            case CREATE_SPRINT -> Optional.of(executeCreateSprint(plan));
            case WORKLOAD -> Optional.of(handleWorkload());
            default -> Optional.empty();
        };
    }

    private boolean matchesTeamIntent(String lower) {
        return lower.contains("create team")
            || lower.contains("crear team")
            || lower.contains("crear equipo")
            || lower.contains("new team")
            || lower.contains("nuevo equipo")
            || lower.contains("make a team")
            || lower.contains("set up a team")
            || lower.contains("armar un equipo")
            || lower.contains("armar equipo");
    }

    private boolean matchesProjectIntent(String lower) {
        return lower.contains("create project")
            || lower.contains("crear proyecto")
            || lower.contains("new project")
            || lower.contains("nuevo proyecto")
            || lower.contains("start a project")
            || lower.contains("iniciar proyecto");
    }

    private boolean matchesSprintIntent(String lower) {
        return lower.contains("create sprint")
            || lower.contains("crear sprint")
            || lower.contains("new sprint")
            || lower.contains("nuevo sprint")
            || lower.contains("schedule a sprint")
            || lower.contains("planificar sprint");
    }

    private boolean matchesWorkloadIntent(String lower) {
        return lower.contains("how much more work")
            || lower.contains("team doing this week")
            || lower.contains("carga esta semana")
            || lower.contains("workload")
            || lower.contains("remaining hours")
            || lower.contains("horas restantes");
    }

    private String executeCreateTeam(LumiActionPlan plan) {
        if (plan.getTeamName() == null || plan.getTeamName().isBlank()) {
            return "What should the team be called, and who should be on it?";
        }
        if (plan.getMemberNames() == null || plan.getMemberNames().isEmpty()) {
            return "Who should join \"" + plan.getTeamName().trim()
                + "\"? Tell me their names from the workspace: " + listDeveloperNames();
        }
        return handleCreateTeamFromData(
            plan.getTeamName(),
            plan.getMemberNames(),
            plan.getManagerName()
        );
    }

    private String executeCreateProject(LumiActionPlan plan) {
        if (plan.getProjectName() == null || plan.getProjectName().isBlank()) {
            return "What should the project be called?";
        }
        if (plan.getSourceTeamName() == null || plan.getSourceTeamName().isBlank()) {
            return "Which existing team should I copy members from? Available: " + listTeamNames();
        }
        return handleCreateProjectFromData(plan.getProjectName(), plan.getSourceTeamName());
    }

    private String executeCreateSprint(LumiActionPlan plan) {
        if (plan.getSprintName() == null || plan.getSprintName().isBlank()) {
            return "What should the sprint be called?";
        }
        if (plan.getProjectName() == null || plan.getProjectName().isBlank()) {
            return "Which project is this sprint for? Available: " + listTeamNames();
        }
        if (plan.getStartDate() == null || plan.getEndDate() == null) {
            return "When does \"" + plan.getSprintName() + "\" start and end? (e.g. May 20 to June 3, 2026)";
        }
        return handleCreateSprintFromData(
            plan.getSprintName(),
            plan.getProjectName(),
            plan.getStartDate(),
            plan.getEndDate()
        );
    }

    private String handleCreateTeamFromData(String teamName, List<String> memberNames, String managerNameHint) {
        List<User> users = userService.findAll();
        List<User> matched = findUsersByNames(users, memberNames);
        if (matched.isEmpty()) {
            return "I couldn't match those names to developers in the workspace. Available: " + listDeveloperNames();
        }

        User manager = resolveManagerFromHint(managerNameHint, matched, users);
        Team created = persistTeam(teamName, manager, matched);
        return successMessage("team", created.getName());
    }

    private String handleCreateProjectFromData(String projectName, String sourceTeamHint) {
        List<TeamWithUsersResponse> teams = loadTeamsWithUsers();
        TeamWithUsersResponse sourceTeam = teams.stream()
            .filter(team -> normalize(team.getName()).contains(normalize(sourceTeamHint)))
            .findFirst()
            .orElse(null);

        if (sourceTeam == null) {
            return "I couldn't find that team. Available: " + listTeamNames();
        }

        Long managerId = sourceTeam.getManagerId();
        if (managerId == null && sourceTeam.getUsers() != null && !sourceTeam.getUsers().isEmpty()) {
            managerId = sourceTeam.getUsers().get(0).getId();
        }
        if (managerId == null) {
            return "That team has no members to copy.";
        }

        Team project = new Team();
        project.setName(projectName.trim());
        project.setManagerId(managerId);
        Team created = teamService.add(project);

        Set<Long> memberIds = new HashSet<>();
        memberIds.add(managerId);
        if (sourceTeam.getUsers() != null) {
            for (UserSummaryResponse user : sourceTeam.getUsers()) {
                if (user.getId() != null) {
                    memberIds.add(user.getId());
                }
            }
        }
        addMembers(created.getId(), memberIds);
        return successMessage("project", created.getName());
    }

    private String handleCreateSprintFromData(String sprintName, String projectHint, String startRaw, String endRaw) {
        List<TeamWithUsersResponse> teams = loadTeamsWithUsers();
        TeamWithUsersResponse project = teams.stream()
            .filter(team -> normalize(team.getName()).contains(normalize(projectHint)))
            .findFirst()
            .orElse(null);

        if (project == null) {
            return "I couldn't find that project. Available: " + listTeamNames();
        }

        LocalDateTime start = parseDate(startRaw);
        LocalDateTime end = parseDate(endRaw);
        if (start == null || end == null) {
            return "I couldn't read those dates. Try something like 2026-05-20 to 2026-06-03.";
        }

        Sprint sprint = new Sprint();
        sprint.setName(sprintName.trim());
        sprint.setStartDate(start);
        sprint.setEndDate(end);
        sprintService.add(sprint);
        return successMessage("sprint", sprint.getName());
    }

    private Team persistTeam(String teamName, User manager, List<User> matched) {
        Team team = new Team();
        team.setName(teamName.trim());
        team.setManagerId(manager.getId());
        Team created = teamService.add(team);

        Set<Long> memberIds = new HashSet<>();
        for (User user : matched) {
            memberIds.add(user.getId());
        }
        memberIds.add(manager.getId());
        addMembers(created.getId(), memberIds);
        return created;
    }

    private User resolveManagerFromHint(String managerNameHint, List<User> matched, List<User> allUsers) {
        if (managerNameHint != null && !managerNameHint.isBlank()) {
            List<User> fromHint = findUsersByNames(allUsers, List.of(managerNameHint));
            if (!fromHint.isEmpty()) {
                return fromHint.get(0);
            }
        }
        return matched.stream()
            .filter(user -> "MANAGER".equalsIgnoreCase(user.getRole()))
            .findFirst()
            .orElse(matched.get(0));
    }

    private String successMessage(String kind, String name) {
        String where = switch (kind) {
            case "team" -> "Dashboard → Team";
            case "project" -> "Dashboard → Projects";
            default -> "Dashboard";
        };
        return "Done — \"" + name + "\" is saved. Open " + where + " to see it (no login required).";
    }

    private String listDeveloperNames() {
        List<User> users = userService.findAll();
        if (users.isEmpty()) {
            return "none yet — add people via Dashboard → Team first";
        }
        return users.stream()
            .map(this::safeName)
            .limit(8)
            .reduce((a, b) -> a + ", " + b)
            .orElse("");
    }

    private String listTeamNames() {
        List<Team> teams = teamService.findAll();
        if (teams.isEmpty()) {
            return "none yet";
        }
        return teams.stream()
            .map(Team::getName)
            .limit(8)
            .reduce((a, b) -> a + ", " + b)
            .orElse("");
    }

    private String handleCreateTeam(String message) {
        List<User> users = userService.findAll();
        List<String> names = extractMemberNames(message);
        List<User> matched = findUsersByNames(users, names);

        if (matched.isEmpty()) {
            return "Tell me who should be on the team — names from the workspace: " + listDeveloperNames();
        }

        User manager = resolveManager(message, matched);
        List<Team> teams = teamService.findAll();
        String teamName = extractTeamName(message, teams.size());
        if (teamName == null || teamName.isBlank()) {
            teamName = "Team " + (teams.size() + 1);
        }

        Team created = persistTeam(teamName, manager, matched);
        return successMessage("team", created.getName());
    }

    private String handleCreateProject(String message) {
        List<TeamWithUsersResponse> teams = loadTeamsWithUsers();
        String projectName = firstMatch(message,
            Pattern.compile("create project\\s+(.+?)(?:\\s+using|\\s+from|$)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("crear proyecto\\s+(.+?)(?:\\s+usando|\\s+desde|$)", Pattern.CASE_INSENSITIVE));

        if (projectName == null || projectName.isBlank()) {
            return "What should the project be called?";
        }

        String teamNameHint = firstMatch(message,
            Pattern.compile("(?:using|from|usando|desde)\\s+team\\s+(.+)$", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?:using|from|usando|desde)\\s+(.+)$", Pattern.CASE_INSENSITIVE));

        TeamWithUsersResponse sourceTeam = teams.stream()
            .filter(team -> normalize(team.getName()).contains(normalize(teamNameHint == null ? "" : teamNameHint)))
            .findFirst()
            .orElse(null);

        if (sourceTeam == null) {
            return "Which team should I copy from? Available: " + listTeamNames();
        }

        return handleCreateProjectFromData(projectName, sourceTeam.getName());
    }

    private String handleCreateSprint(String message) {
        List<TeamWithUsersResponse> teams = loadTeamsWithUsers();
        String sprintName = firstMatch(message,
            Pattern.compile("create sprint\\s+(.+?)\\s+(?:for|inside|in)\\s+", Pattern.CASE_INSENSITIVE),
            Pattern.compile("crear sprint\\s+(.+?)\\s+(?:para|en)\\s+", Pattern.CASE_INSENSITIVE));
        String projectName = firstMatch(message,
            Pattern.compile("(?:for|inside|in)\\s+project\\s+(.+?)\\s+(?:from|starting|start|de|desde)\\s+",
                Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?:para|en)\\s+proyecto\\s+(.+?)\\s+(?:de|desde)\\s+", Pattern.CASE_INSENSITIVE));

        Matcher dateMatcher = Pattern.compile(
            "(\\d{4}-\\d{2}-\\d{2}(?:[ T]\\d{2}:\\d{2})?).*?(\\d{4}-\\d{2}-\\d{2}(?:[ T]\\d{2}:\\d{2})?)",
            Pattern.CASE_INSENSITIVE
        ).matcher(message);

        if (sprintName == null || projectName == null || !dateMatcher.find()) {
            return "Tell me the sprint name, which project it's for, and the start/end dates.";
        }

        return handleCreateSprintFromData(
            sprintName,
            projectName,
            dateMatcher.group(1),
            dateMatcher.group(2)
        );
    }

    private String handleWorkload() {
        List<Task> tasks = taskService.findAll();
        long remainingHours = tasks.stream()
            .filter(task -> task.getStatus() == null || task.getStatus() != TaskStatus.DONE)
            .mapToLong(task -> Math.max(
                (task.getExpectedHours() == null ? 0 : task.getExpectedHours())
                    - (task.getHoursDone() == null ? 0 : task.getHoursDone()),
                0))
            .sum();
        long totalExpected = tasks.stream()
            .mapToLong(task -> task.getExpectedHours() == null ? 0 : task.getExpectedHours())
            .sum();
        long totalDone = tasks.stream()
            .mapToLong(task -> task.getHoursDone() == null ? 0 : task.getHoursDone())
            .sum();

        return "This week snapshot: " + remainingHours + "h remaining, "
            + totalDone + "h done out of " + totalExpected + "h planned.";
    }

    private User resolveManager(String message, List<User> matched) {
        Matcher managerMatcher = MANAGER_PATTERN.matcher(message);
        if (managerMatcher.find()) {
            String managerName = managerMatcher.group(1).trim();
            Optional<User> explicit = findUsersByNames(matched, List.of(managerName)).stream().findFirst();
            if (explicit.isPresent()) {
                return explicit.get();
            }
            List<User> all = userService.findAll();
            explicit = findUsersByNames(all, List.of(managerName)).stream().findFirst();
            if (explicit.isPresent()) {
                return explicit.get();
            }
        }

        Optional<User> roleManager = matched.stream()
            .filter(user -> "MANAGER".equalsIgnoreCase(user.getRole()))
            .findFirst();
        return roleManager.orElse(matched.get(0));
    }

    private String extractTeamName(String message, int teamCount) {
        String fromEnglish = firstMatch(message,
            Pattern.compile("create team\\s+(.+?)(?:\\s+with|\\s+managed|\\s+manager|$)", Pattern.CASE_INSENSITIVE));
        if (fromEnglish != null && !fromEnglish.isBlank()) {
            return fromEnglish.trim();
        }
        String fromSpanish = firstMatch(message,
            Pattern.compile("crear (?:team|equipo)\\s+(.+?)(?:\\s+con|\\s+managed|\\s+manager|$)", Pattern.CASE_INSENSITIVE));
        if (fromSpanish != null && !fromSpanish.isBlank()) {
            return fromSpanish.trim();
        }
        return "Team " + (teamCount + 1);
    }

    private List<String> extractMemberNames(String message) {
        Matcher withMatcher = Pattern.compile("(?:with|con)\\s+(.+)$", Pattern.CASE_INSENSITIVE).matcher(message);
        if (!withMatcher.find()) {
            return List.of();
        }
        String raw = withMatcher.group(1);
        String[] parts = raw.split("(?:[;,]|\\s+and\\s+|\\s+y\\s+)", -1);
        List<String> names = new ArrayList<>();
        for (String part : parts) {
            String cleaned = part.trim();
            if (cleaned.isEmpty()) {
                continue;
            }
            if (cleaned.toLowerCase(Locale.ROOT).startsWith("manager ")) {
                cleaned = cleaned.substring(8).trim();
            }
            if (!cleaned.isEmpty()) {
                names.add(cleaned);
            }
        }
        return names;
    }

    private List<User> findUsersByNames(List<User> users, List<String> names) {
        List<User> matched = new ArrayList<>();
        for (String name : names) {
            String token = normalize(name);
            users.stream()
                .filter(user -> {
                    String label = normalize(user.getName());
                    if (label.contains(token)) {
                        return true;
                    }
                    return normalize(user.getEmail()).contains(token);
                })
                .findFirst()
                .ifPresent(matched::add);
        }
        return matched;
    }

    private List<TeamWithUsersResponse> loadTeamsWithUsers() {
        List<Team> teams = teamService.findAll();
        List<TeamWithUsersResponse> response = new ArrayList<>();
        for (Team team : teams) {
            List<UserSummaryResponse> users = new ArrayList<>();
            for (TeamMember member : teamMemberRepository.findByIdTeamId(team.getId())) {
                if (member.getMemberUserId() == null) {
                    continue;
                }
                userRepository.findById(member.getMemberUserId())
                    .ifPresent(user -> users.add(new UserSummaryResponse(user)));
            }
            response.add(new TeamWithUsersResponse(team, users));
        }
        return response;
    }

    private void addMembers(Long teamId, Set<Long> memberIds) {
        for (Long memberUserId : memberIds) {
            TeamMember member = new TeamMember();
            member.setTeamId(teamId);
            member.setMemberUserId(memberUserId);
            teamMemberService.add(member);
        }
    }

    private String firstMatch(String message, Pattern... patterns) {
        for (Pattern pattern : patterns) {
            Matcher matcher = pattern.matcher(message);
            if (matcher.find()) {
                return matcher.group(1).trim();
            }
        }
        return null;
    }

    private LocalDateTime parseDate(String raw) {
        String normalized = raw.trim().replace('T', ' ');
        List<DateTimeFormatter> formatters = List.of(
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd")
        );
        for (DateTimeFormatter formatter : formatters) {
            try {
                if (formatter.toString().contains("HH")) {
                    return LocalDateTime.parse(normalized, formatter);
                }
                return LocalDateTime.parse(normalized + " 00:00",
                    DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
            } catch (DateTimeParseException ignored) {
                // try next
            }
        }
        return null;
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).trim();
    }

    private String safeName(User user) {
        return user.getName() != null ? user.getName() : "user " + user.getId();
    }
}
