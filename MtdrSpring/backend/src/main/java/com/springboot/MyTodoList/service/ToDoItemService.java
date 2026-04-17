package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.ToDoItem;
import com.springboot.MyTodoList.repository.ToDoItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Optional;

@Service
public class ToDoItemService {

    @Autowired(required = false)
    private ToDoItemRepository toDoItemRepository;

    @org.springframework.beans.factory.annotation.Value("${app.nodb:false}")
    private boolean noDb;

    private final java.util.concurrent.ConcurrentHashMap<Integer, ToDoItem> inMemory = new java.util.concurrent.ConcurrentHashMap<>();
    private final java.util.concurrent.atomic.AtomicInteger idSeq = new java.util.concurrent.atomic.AtomicInteger(100);
    public List<ToDoItem> findAll(){
        if (noDb || toDoItemRepository == null) {
            return new java.util.ArrayList<>(inMemory.values());
        }
        return toDoItemRepository.findAll();
    }
    public ResponseEntity<ToDoItem> getItemById(int id){
        if (noDb || toDoItemRepository == null) {
            ToDoItem t = inMemory.get(id);
            if (t != null) return new ResponseEntity<>(t, HttpStatus.OK);
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        Optional<ToDoItem> todoData = toDoItemRepository.findById(id);
        if (todoData.isPresent()){
            return new ResponseEntity<>(todoData.get(), HttpStatus.OK);
        }else{
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    public ToDoItem getToDoItemById(int id){
        Optional<ToDoItem> todoData = toDoItemRepository.findById(id);
        if (todoData.isPresent()){
            return todoData.get();
        }else{
            return null;
        }
    }

    
    public ToDoItem addToDoItem(ToDoItem toDoItem){
        if (noDb || toDoItemRepository == null) {
            int id = idSeq.incrementAndGet();
            toDoItem.setID(id);
            inMemory.put(id, toDoItem);
            return toDoItem;
        }
        return toDoItemRepository.save(toDoItem);
    }

    public boolean deleteToDoItem(int id){
        try{
            if (noDb || toDoItemRepository == null) {
                inMemory.remove(id);
                return true;
            }
            toDoItemRepository.deleteById(id);
            return true;
        }catch(Exception e){
            return false;
        }
    }
    public ToDoItem updateToDoItem(int id, ToDoItem td){
        if (noDb || toDoItemRepository == null) {
            ToDoItem existing = inMemory.get(id);
            if (existing == null) return null;
            existing.setCreation_ts(td.getCreation_ts());
            existing.setDescription(td.getDescription());
            existing.setDone(td.isDone());
            inMemory.put(id, existing);
            return existing;
        }
        Optional<ToDoItem> toDoItemData = toDoItemRepository.findById(id);
        if(toDoItemData.isPresent()){
            ToDoItem toDoItem = toDoItemData.get();
            toDoItem.setID(id);
            toDoItem.setCreation_ts(td.getCreation_ts());
            toDoItem.setDescription(td.getDescription());
            toDoItem.setDone(td.isDone());
            return toDoItemRepository.save(toDoItem);
        }else{
            return null;
        }
    }
    

}
