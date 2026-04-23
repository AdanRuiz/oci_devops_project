package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.*;
import com.springboot.MyTodoList.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class InvitationService {

    @Autowired private InvitationRepository invitationRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private ProjectMemberRepository projectMemberRepository;

    /**
     * Invite a developer by email to a project.
     * - If the user already exists in the DB → add them as a project member immediately.
     * - If not → store a pending invitation; fulfilled on their first login.
     *
     * Returns a map with "status": "added" | "invited"
     */
    public Map<String, String> invite(UUID projectId, String email) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        Optional<User> existingUser = userRepository.findByEmail(email);

        if (existingUser.isPresent()) {
            User user = existingUser.get();
            boolean alreadyMember = projectMemberRepository
                    .findByProject_IdAndUser_Id(projectId, user.getId())
                    .isPresent();
            if (!alreadyMember) {
                ProjectMember member = new ProjectMember();
                member.setProject(project);
                member.setUser(user);
                member.setRole(ProjectRole.DEVELOPER);
                projectMemberRepository.save(member);
            }
            return Map.of("status", "added");
        }

        // User doesn't exist yet — store pending invitation
        boolean alreadyInvited = invitationRepository
                .findByEmailIgnoreCase(email)
                .stream()
                .anyMatch(i -> i.getProject().getId().equals(projectId));

        if (!alreadyInvited) {
            Invitation invitation = new Invitation();
            invitation.setProject(project);
            invitation.setEmail(email.toLowerCase());
            invitationRepository.save(invitation);
        }

        return Map.of("status", "invited");
    }

    /**
     * Called on first login — fulfills all pending invitations for this email
     * by adding the user to the corresponding projects as DEVELOPER.
     */
    public void fulfillForUser(User user) {
        List<Invitation> pending = invitationRepository.findByEmailIgnoreCase(user.getEmail());
        for (Invitation invitation : pending) {
            boolean alreadyMember = projectMemberRepository
                    .findByProject_IdAndUser_Id(invitation.getProject().getId(), user.getId())
                    .isPresent();
            if (!alreadyMember) {
                ProjectMember member = new ProjectMember();
                member.setProject(invitation.getProject());
                member.setUser(user);
                member.setRole(ProjectRole.DEVELOPER);
                projectMemberRepository.save(member);
            }
        }
        if (!pending.isEmpty()) {
            invitationRepository.deleteAll(pending);
        }
    }
}
