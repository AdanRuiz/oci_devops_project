package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.model.SprintStatus;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import java.util.List;
import java.util.UUID;

@Repository
@Transactional
@EnableTransactionManagement
public interface SprintRepository extends JpaRepository<Sprint, UUID> {

    List<Sprint> findByProject_Id(UUID projectId);

    List<Sprint> findByProject_IdAndStatus(UUID projectId, SprintStatus status);
}
