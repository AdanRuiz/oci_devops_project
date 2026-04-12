package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.model.ProjectMember;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@Transactional
@EnableTransactionManagement
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {

    List<ProjectMember> findByProject_Id(UUID projectId);

    List<ProjectMember> findByUser_Id(UUID userId);

    Optional<ProjectMember> findByProject_IdAndUser_Id(UUID projectId, UUID userId);

    void deleteByProject_IdAndUser_Id(UUID projectId, UUID userId);
}
