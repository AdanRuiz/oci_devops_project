package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.model.Project;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import java.util.List;
import java.util.UUID;

@Repository
@Transactional
@EnableTransactionManagement
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    List<Project> findByOwner_Id(UUID ownerId);

    List<Project> findByMembers_User_Id(UUID userId);
}
