package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.model.SprintKpiSnapshot;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import java.util.Optional;
import java.util.UUID;

@Repository
@Transactional
@EnableTransactionManagement
public interface SprintKpiSnapshotRepository extends JpaRepository<SprintKpiSnapshot, UUID> {

    Optional<SprintKpiSnapshot> findBySprint_Id(UUID sprintId);
}
