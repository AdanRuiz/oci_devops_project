package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public ResponseEntity<User> getUserById(UUID id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isPresent()) {
            return new ResponseEntity<>(user.get(), HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    public Optional<User> findByTelegramChatId(String telegramChatId) {
        return userRepository.findByTelegramChatId(telegramChatId);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User addUser(User newUser) {
        return userRepository.save(newUser);
    }

    public boolean deleteUser(UUID id) {
        try {
            userRepository.deleteById(id);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public User updateUser(UUID id, User updates) {
        Optional<User> existing = userRepository.findById(id);
        if (existing.isPresent()) {
            User user = existing.get();
            if (updates.getTelegramChatId() != null) {
                user.setTelegramChatId(updates.getTelegramChatId());
            }
            if (updates.getSystemRole() != null) {
                user.setSystemRole(updates.getSystemRole());
            }
            return userRepository.save(user);
        }
        return null;
    }
}
