package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.model.WorkItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkItemRepository extends JpaRepository<WorkItem, String> {
}
