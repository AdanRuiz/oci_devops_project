package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.UserRepository;
import com.springboot.MyTodoList.service.telegram.TelegramLinkService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/telegram")
public class TelegramController {

    private final TelegramLinkService telegramLinkService;
    private final UserRepository userRepository;

    public TelegramController(TelegramLinkService telegramLinkService, UserRepository userRepository) {
        this.telegramLinkService = telegramLinkService;
        this.userRepository = userRepository;
    }

    @PostMapping("/link-code")
    public ResponseEntity<?> generateLinkCode(Principal principal) {
        if (principal == null || principal.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized: No principal found"));
        }
        
        // Match the principal to a User, e.g. via OCI IAM ID or Email depending on how you stored it
        // Assuming email for now. Update if OCI IAM ID is used instead.
        String principalId = principal.getName();
        User user = userRepository.findByEmail(principalId)
                .or(() -> userRepository.findByOciIamId(principalId))
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        String code = telegramLinkService.generateLinkingCode(user.getId());
        return ResponseEntity.ok(Map.of("code", code));
    }
}
