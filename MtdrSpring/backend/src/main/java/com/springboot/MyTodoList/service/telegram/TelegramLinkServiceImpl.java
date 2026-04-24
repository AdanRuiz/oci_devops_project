package com.springboot.MyTodoList.service.telegram;

import com.springboot.MyTodoList.model.TelegramLinkCode;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.TelegramLinkCodeRepository;
import com.springboot.MyTodoList.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Service
public class TelegramLinkServiceImpl implements TelegramLinkService {

    private final TelegramLinkCodeRepository linkCodeRepository;
    private final UserRepository userRepository;
    
    private final Random random = new Random();

    public TelegramLinkServiceImpl(TelegramLinkCodeRepository linkCodeRepository, UserRepository userRepository) {
        this.linkCodeRepository = linkCodeRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public String generateLinkingCode(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Generate a 6-digit numeric code
        String code = String.format("%06d", random.nextInt(1000000));
        
        TelegramLinkCode linkCode = new TelegramLinkCode();
        linkCode.setUser(user);
        linkCode.setCode(code);
        linkCode.setExpiresAt(LocalDateTime.now().plusMinutes(15)); // Expires in 15 mins
        linkCode.setUsed(false);
        
        linkCodeRepository.save(linkCode);
        
        return code;
    }

    @Override
    @Transactional
    public boolean linkAccount(String code, String telegramChatId) {
        Optional<TelegramLinkCode> linkCodeOpt = linkCodeRepository.findByCodeAndUsedFalse(code);
        
        if (linkCodeOpt.isEmpty()) {
            return false;
        }
        
        TelegramLinkCode linkCode = linkCodeOpt.get();
        
        if (linkCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            return false;
        }
        
        User user = linkCode.getUser();
        user.setTelegramChatId(telegramChatId);
        userRepository.save(user);
        
        linkCode.setUsed(true);
        linkCodeRepository.save(linkCode);
        
        return true;
    }
}
