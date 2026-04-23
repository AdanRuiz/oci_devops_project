package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.model.Invitation;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
@Transactional
public interface InvitationRepository extends JpaRepository<Invitation, UUID> {

    List<Invitation> findByEmailIgnoreCase(String email);

    void deleteByProject_IdAndEmailIgnoreCase(UUID projectId, String email);
}
