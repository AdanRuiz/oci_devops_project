package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.model.TelegramLinkCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TelegramLinkCodeRepository extends JpaRepository<TelegramLinkCode, UUID> {
    Optional<TelegramLinkCode> findByCodeAndUsedFalse(String code);
}
