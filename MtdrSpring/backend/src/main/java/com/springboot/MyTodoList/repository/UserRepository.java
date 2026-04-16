package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.model.User;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import java.util.Optional;
import java.util.UUID;

@Repository
@Transactional
@EnableTransactionManagement
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByTelegramChatId(String telegramChatId);

    Optional<User> findByOciIamId(String ociIamId);
}
