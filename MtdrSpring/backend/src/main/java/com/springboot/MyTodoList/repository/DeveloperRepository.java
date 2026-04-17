package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.model.Developer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import jakarta.transaction.Transactional;
import java.util.List;

@Repository
@Transactional
@EnableTransactionManagement
public interface DeveloperRepository extends JpaRepository<Developer, Integer> {
    interface DeveloperSummaryProjection {
        Integer getDeveloperId();
        String getFullName();
    }

        @Query(value = "SELECT d.DEVELOPERID as developerId, " +
            "COALESCE(NULLIF(TRIM(ug.NAME || ' ' || ug.LASTNAME), ''), 'Developer ' || TO_CHAR(d.DEVELOPERID)) as fullName " +
            "FROM DEVELOPER d " +
            "LEFT JOIN USERGENERAL ug ON ug.USERID = d.USERID " +
            "ORDER BY d.DEVELOPERID", nativeQuery = true)
    List<DeveloperSummaryProjection> findDeveloperSummaries();
}
